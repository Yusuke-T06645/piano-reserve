import { config, generateTimeGrid, minutesToTime, timeToMinutes } from "./config";
import { isEligibleOpenDate, isPastCutoff, listUpcomingEligibleDates, monthKey } from "./dates";
import { getStore } from "./store";
import type { BusyRange, DayAvailability } from "./store/types";

/** 開放予定日の一覧(ブラックアウト日=調律日等を除外済み)を返す */
export async function listBookableDates(): Promise<{ date: string; available: boolean }[]> {
  const store = getStore();
  const blackout = new Set((await store.listBlackoutDates()).map((b) => b.date));
  const dates = listUpcomingEligibleDates();
  return dates.map((date) => ({ date, available: !blackout.has(date) }));
}

export async function isDateBookable(date: string): Promise<boolean> {
  if (!isEligibleOpenDate(date)) return false;
  const store = getStore();
  const blackout = await store.listBlackoutDates();
  return !blackout.some((b) => b.date === date);
}

/**
 * 指定日の空き状況を返す。時間帯は10分固定枠ではなく自由選択のため、
 * 「埋まっている(選べない)時間帯」のリスト(予約済み範囲 + 受付締切による範囲)として表現する。
 */
export async function getDayAvailability(date: string): Promise<DayAvailability> {
  const store = getStore();
  const reservations = (await store.listReservations({ date })).filter(
    (r) => r.status === "confirmed" || r.status === "attended"
  );
  const reservedRanges: BusyRange[] = reservations.map((r) => ({
    start: r.slotStart,
    end: r.slotEnd,
    kind: "reserved",
  }));

  const cutoffRanges: BusyRange[] = [];
  const grid = generateTimeGrid();
  const firstBookableStart = grid.find((point) => point !== config.closeTime && !isPastCutoff(date, point));
  if (firstBookableStart === undefined) {
    cutoffRanges.push({ start: config.openTime, end: config.closeTime, kind: "cutoff" });
  } else if (firstBookableStart !== config.openTime) {
    cutoffRanges.push({ start: config.openTime, end: firstBookableStart, kind: "cutoff" });
  }

  const waitlist = await store.listWaitlist(date);

  return {
    date,
    openTime: config.openTime,
    closeTime: config.closeTime,
    granularityMinutes: config.granularityMinutes,
    maxUsageMinutes: config.maxUsageMinutes,
    busyRanges: [...cutoffRanges, ...reservedRanges].sort((a, b) => a.start.localeCompare(b.start)),
    waitlistCount: waitlist.length,
  };
}

/** busyRanges(重複しうる)を分単位でマージし、まだ空いている合計時間(分)を返す */
export function freeMinutesInDay(day: Pick<DayAvailability, "openTime" | "closeTime" | "busyRanges">): number {
  const totalMinutes = timeToMinutes(day.closeTime) - timeToMinutes(day.openTime);
  const intervals = day.busyRanges
    .map((r) => [timeToMinutes(r.start), timeToMinutes(r.end)] as const)
    .sort((a, b) => a[0] - b[0]);

  let busyMinutes = 0;
  let curStart: number | null = null;
  let curEnd = 0;
  for (const [s, e] of intervals) {
    if (curStart === null) {
      curStart = s;
      curEnd = e;
      continue;
    }
    if (s <= curEnd) {
      curEnd = Math.max(curEnd, e);
    } else {
      busyMinutes += curEnd - curStart;
      curStart = s;
      curEnd = e;
    }
  }
  if (curStart !== null) busyMinutes += curEnd - curStart;

  return Math.max(0, totalMinutes - busyMinutes);
}

export function isSlotPastCutoff(date: string, slotStart: string): boolean {
  return isPastCutoff(date, slotStart);
}

export { minutesToTime, monthKey, timeToMinutes };
