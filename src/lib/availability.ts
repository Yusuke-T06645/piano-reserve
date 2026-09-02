import { config, generateDaySlots } from "./config";
import { isEligibleOpenDate, isPastCutoff, listUpcomingEligibleDates, monthKey } from "./dates";
import { getStore } from "./store";
import type { AvailabilityInfo } from "./store/types";

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

/** 指定日の全枠について、空き状況を返す */
export async function getDayAvailability(date: string): Promise<AvailabilityInfo[]> {
  const store = getStore();
  const slots = generateDaySlots();
  const results: AvailabilityInfo[] = [];
  for (const slot of slots) {
    const reserved = await store.countActiveReservations(date, slot.start);
    const waitlist = await store.listWaitlist(date, slot.start);
    results.push({
      date,
      slotStart: slot.start,
      slotEnd: slot.end,
      capacity: config.capacityPerSlot,
      reserved,
      available: Math.max(0, config.capacityPerSlot - reserved),
      waitlistCount: waitlist.length,
    });
  }
  return results;
}

export function isSlotPastCutoff(date: string, slotStart: string): boolean {
  return isPastCutoff(date, slotStart);
}

export { monthKey };
