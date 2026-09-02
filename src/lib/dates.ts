import { config } from "./config";

/** YYYY-MM-DD 形式で日付を表す */
export type IsoDate = string;

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function toIsoDate(d: Date): IsoDate {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function fromIsoDate(iso: IsoDate): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function formatJapaneseDate(iso: IsoDate): string {
  const d = fromIsoDate(iso);
  const weekdayNames = ["日", "月", "火", "水", "木", "金", "土"];
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日（${weekdayNames[d.getDay()]}）`;
}

/** その月における「第何金曜日か」を返す (1=第1金曜, 2=第2金曜, ...) */
function nthWeekdayOfMonth(d: Date): number {
  return Math.floor((d.getDate() - 1) / 7) + 1;
}

/**
 * 「毎月第1・第3金曜日」のルールに該当する日付かどうかを判定する。
 * ブラックアウト日(調律日等)の除外はデータ層側で別途行う。
 */
export function isEligibleOpenDate(iso: IsoDate): boolean {
  const d = fromIsoDate(iso);
  if (d.getDay() !== config.eligibleWeekday) return false;
  const nth = nthWeekdayOfMonth(d);
  return (config.eligibleOccurrences as readonly number[]).includes(nth);
}

/** 今日から bookingWindowDaysAhead 日先までの、開放ルールに該当する日付一覧を返す */
export function listUpcomingEligibleDates(from: Date = new Date()): IsoDate[] {
  const result: IsoDate[] = [];
  const start = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  for (let i = 0; i <= config.bookingWindowDaysAhead; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    const iso = toIsoDate(d);
    if (isEligibleOpenDate(iso)) result.push(iso);
  }
  return result;
}

export function isPastCutoff(iso: IsoDate, slotStart: string, now: Date = new Date()): boolean {
  const [h, m] = slotStart.split(":").map(Number);
  const slotDate = fromIsoDate(iso);
  slotDate.setHours(h, m, 0, 0);
  const cutoffMs = config.bookingCutoffHoursBefore * 60 * 60 * 1000;
  return slotDate.getTime() - now.getTime() < cutoffMs;
}

export function hoursUntil(iso: IsoDate, slotStart: string, now: Date = new Date()): number {
  const [h, m] = slotStart.split(":").map(Number);
  const slotDate = fromIsoDate(iso);
  slotDate.setHours(h, m, 0, 0);
  return (slotDate.getTime() - now.getTime()) / (1000 * 60 * 60);
}

export function monthKey(iso: IsoDate): string {
  return iso.slice(0, 7); // YYYY-MM
}
