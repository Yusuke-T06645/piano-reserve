import { config } from "./config";

/** YYYY-MM-DD 形式で日付を表す */
export type IsoDate = string;

function pad(n: number) {
  return String(n).padStart(2, "0");
}

/**
 * このアプリの開放日・締切時刻はすべて日本時間(JST, UTC+9)基準のルールだが、
 * サーバーの実行環境(VercelのNode.jsランタイム等)はUTCで動くことが多い。
 * `new Date()`のローカルgetter/setter(getHours/getDate/setHours等)はOSの
 * タイムゾーン設定に依存してしまうため、それらは一切使わず、常にUTCの
 * getter/setterだけを使って「UTCフィールド=JST時刻の値」という規約で
 * 日時を扱う。これにより、実行環境のタイムゾーン設定に関係なく常に正しく
 * JST基準で動く。
 */
const JST_OFFSET_MS = 9 * 60 * 60 * 1000;

/** 現在時刻(実時刻)を、UTCゲッターでJSTの年月日時分が読み取れる疑似Dateに変換する */
function toJstFields(now: Date): Date {
  return new Date(now.getTime() + JST_OFFSET_MS);
}

/** JSTの日付("YYYY-MM-DD")とJSTの時刻("HH:mm")から、その瞬間の実時刻(UTC epoch)を返す */
export function jstInstant(iso: IsoDate, hhmm: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  const [h, mi] = hhmm.split(":").map(Number);
  return new Date(Date.UTC(y, m - 1, d, h, mi) - JST_OFFSET_MS);
}

/** 実時刻`now`をJST基準で見た場合の、days日後のISO日付を返す(翌日判定等に使う) */
export function addDaysIso(now: Date, days: number): IsoDate {
  const jst = toJstFields(now);
  const d = new Date(Date.UTC(jst.getUTCFullYear(), jst.getUTCMonth(), jst.getUTCDate() + days));
  return toIsoDate(d);
}

export function toIsoDate(d: Date): IsoDate {
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

/** ISO日付を、その日のJST 00:00を表す疑似Date(UTCゲッターで読むこと)に変換する */
export function fromIsoDate(iso: IsoDate): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function formatJapaneseDate(iso: IsoDate): string {
  const d = fromIsoDate(iso);
  const weekdayNames = ["日", "月", "火", "水", "木", "金", "土"];
  return `${d.getUTCFullYear()}年${d.getUTCMonth() + 1}月${d.getUTCDate()}日（${weekdayNames[d.getUTCDay()]}）`;
}

/** その月における「第何金曜日か」を返す (1=第1金曜, 2=第2金曜, ...) */
function nthWeekdayOfMonth(d: Date): number {
  return Math.floor((d.getUTCDate() - 1) / 7) + 1;
}

/**
 * 「毎月第1・第3金曜日」のルールに該当する日付かどうかを判定する。
 * ブラックアウト日(調律日等)の除外はデータ層側で別途行う。
 */
export function isEligibleOpenDate(iso: IsoDate): boolean {
  const d = fromIsoDate(iso);
  if (d.getUTCDay() !== config.eligibleWeekday) return false;
  const nth = nthWeekdayOfMonth(d);
  return (config.eligibleOccurrences as readonly number[]).includes(nth);
}

/** 今日(JST)から bookingWindowDaysAhead 日先までの、開放ルールに該当する日付一覧を返す */
export function listUpcomingEligibleDates(from: Date = new Date()): IsoDate[] {
  const result: IsoDate[] = [];
  const jstFrom = toJstFields(from);
  const start = new Date(Date.UTC(jstFrom.getUTCFullYear(), jstFrom.getUTCMonth(), jstFrom.getUTCDate()));
  for (let i = 0; i <= config.bookingWindowDaysAhead; i++) {
    const d = new Date(start);
    d.setUTCDate(d.getUTCDate() + i);
    const iso = toIsoDate(d);
    if (isEligibleOpenDate(iso)) result.push(iso);
  }
  return result;
}

export function isPastCutoff(iso: IsoDate, slotStart: string, now: Date = new Date()): boolean {
  const slotStartInstant = jstInstant(iso, slotStart);
  const cutoffMs = config.bookingCutoffHoursBefore * 60 * 60 * 1000;
  return slotStartInstant.getTime() - now.getTime() < cutoffMs;
}

export function hoursUntil(iso: IsoDate, slotStart: string, now: Date = new Date()): number {
  const slotStartInstant = jstInstant(iso, slotStart);
  return (slotStartInstant.getTime() - now.getTime()) / (1000 * 60 * 60);
}

export function monthKey(iso: IsoDate): string {
  return iso.slice(0, 7); // YYYY-MM
}
