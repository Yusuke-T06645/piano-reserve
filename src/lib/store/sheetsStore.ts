import { randomUUID } from "node:crypto";
import { google, sheets_v4 } from "googleapis";
import type {
  AdminUser,
  BlackoutDate,
  NoShowStrike,
  Reservation,
  ReservationStatus,
  ReservationStore,
  WaitlistEntry,
} from "./types";
import { config } from "../config";
import { slotMutex } from "./mutex";
import bcrypt from "bcryptjs";

/**
 * 本番運用向け: Google Sheets を予約台帳として直接使うストア実装。
 *
 * 管理者は Google スプレッドシートを開くだけで、予約一覧をリアルタイムに
 * 確認・編集できる(要件2.3であげた「運用が簡単でコストを抑えられる手法」)。
 *
 * 有効化方法(README/DEPLOYMENT.md にも記載):
 *   1. Google Cloudでサービスアカウントを作成し、Sheets APIを有効化
 *   2. 対象のスプレッドシートを、サービスアカウントのメールアドレスに「編集者」として共有
 *   3. 環境変数を設定:
 *      STORE_BACKEND=sheets
 *      GOOGLE_SHEET_ID=xxxxx
 *      GOOGLE_SERVICE_ACCOUNT_EMAIL=xxxx@xxxx.iam.gserviceaccount.com
 *      GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
 *
 * 各シートタブ(Reservations / Waitlist / BlackoutDates / NoShowStrikes)は
 * 初回アクセス時に自動でヘッダー行を作成する。
 */

const TABS = {
  reservations: "Reservations",
  waitlist: "Waitlist",
  blackoutDates: "BlackoutDates",
  noShowStrikes: "NoShowStrikes",
} as const;

const RESERVATION_HEADERS: (keyof Reservation)[] = [
  "id", "date", "slotStart", "slotEnd", "name", "email", "phone", "ageCategory",
  "guardianName", "notes", "status", "checkinToken", "manageToken", "agreedToTerms",
  "agreedToNoise", "photoConsent", "createdAt", "updatedAt", "checkedInAt", "cancelledAt", "cancelledBy",
  "reminderSentAt", "anonymized",
];
const WAITLIST_HEADERS: (keyof WaitlistEntry)[] = [
  "id", "date", "slotStart", "slotEnd", "name", "email", "phone", "ageCategory",
  "guardianName", "photoConsent", "createdAt", "promotedAt", "promotedReservationId",
];
const BLACKOUT_HEADERS: (keyof BlackoutDate)[] = ["date", "reason", "createdAt"];
const NOSHOW_HEADERS: (keyof NoShowStrike)[] = ["email", "reservationId", "date", "createdAt"];

let sheetsClientPromise: Promise<sheets_v4.Sheets> | null = null;

function getSheetsClient(): Promise<sheets_v4.Sheets> {
  if (!sheetsClientPromise) {
    sheetsClientPromise = (async () => {
      const auth = new google.auth.JWT({
        email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        key: (process.env.GOOGLE_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
        scopes: ["https://www.googleapis.com/auth/spreadsheets"],
      });
      return google.sheets({ version: "v4", auth });
    })();
  }
  return sheetsClientPromise;
}

const SHEET_ID = () => {
  const id = process.env.GOOGLE_SHEET_ID;
  if (!id) throw new Error("GOOGLE_SHEET_ID が設定されていません");
  return id;
};

// タブの存在確認(spreadsheets.get)はSheets APIの読み取りクォータを消費するため、
// 一度確認できたタブはプロセスが生きている間(サーバーレスのウォームインスタンス内)は
// 再確認しない。これが無いと、読み取りのたびに実データ取得とは別にメタデータ取得の
// APIコールが発生し、"Read requests per minute" のクォータを倍消費してしまう。
const verifiedTabs = new Set<string>();

function errorStatus(err: unknown): number | undefined {
  const e = err as { status?: unknown; code?: unknown; response?: { status?: unknown } };
  for (const v of [e?.status, e?.response?.status, e?.code]) {
    const n = Number(v);
    if (Number.isInteger(n) && n > 0) return n;
  }
  return undefined;
}

/**
 * Sheets APIの一時的なエラー(読み取りクォータ超過の429や5xx)は、少し待って再試行する。
 * 再試行しないと、アクセスが集中した瞬間(デプロイ直後で全インスタンスがコールドスタートした時など)に
 * 予約画面がそのままサーバーエラーになってしまう。
 */
export async function withSheetsRetry<T>(fn: () => Promise<T>, delaysMs: number[] = [500, 1500, 3000]): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const status = errorStatus(err);
      const retryable = status === 429 || (status !== undefined && status >= 500 && status < 600);
      if (!retryable || attempt >= delaysMs.length) throw err;
      await new Promise((resolve) => setTimeout(resolve, delaysMs[attempt] + Math.random() * 250));
    }
  }
}

async function ensureSheetExists(tabName: string, headers: string[]) {
  if (verifiedTabs.has(tabName)) return;
  const sheets = await getSheetsClient();
  const meta = await withSheetsRetry(() => sheets.spreadsheets.get({ spreadsheetId: SHEET_ID() }));
  const exists = meta.data.sheets?.some((s) => s.properties?.title === tabName);
  if (!exists) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SHEET_ID(),
      requestBody: { requests: [{ addSheet: { properties: { title: tabName } } }] },
    });
    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID(),
      range: `${tabName}!A1`,
      valueInputOption: "RAW",
      requestBody: { values: [headers] },
    });
  }
  verifiedTabs.add(tabName);
}

/**
 * セルの値を復元する。真偽値は大文字小文字を区別せずに判定する。
 * 以前は String(false) = "false" を RAW で書き込んでいたため、シート上には
 * 小文字の文字列 "false" が残っている。これを "TRUE"/"FALSE" だけで判定すると
 * 文字列 "false"(truthy)のまま扱われ、撮影同意「なし」が管理画面で「あり」と表示されていた。
 */
export function parseCell(raw: unknown): unknown {
  if (typeof raw === "boolean") return raw;
  if (typeof raw === "string") {
    const lower = raw.toLowerCase();
    if (lower === "true") return true;
    if (lower === "false") return false;
  }
  return raw;
}

/**
 * 読み取り結果の短時間キャッシュ(タブ単位)。
 * 予約画面の開放日一覧は1回の表示で「開放日の数×(予約+キャンセル待ち)」回シートを読むため、
 * 同じタブの読み取りを共有しないと Sheets API の読み取りクォータ(1分あたりの上限)をすぐに超えてしまう。
 * 予約の確定・更新など正確さが必要な処理は fresh: true で必ず最新を読む。
 * 同じインスタンス内で書き込んだ場合はキャッシュを破棄する。
 */
const READ_CACHE_TTL_MS = 3000;
const readCache = new Map<string, { at: number; rows: Promise<unknown[][]> }>();

async function fetchRows(tabName: string, headers: string[]): Promise<unknown[][]> {
  await ensureSheetExists(tabName, headers);
  const sheets = await getSheetsClient();
  const res = await withSheetsRetry(() =>
    sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID(),
      range: `${tabName}!A2:${String.fromCharCode(64 + headers.length)}100000`,
    })
  );
  return res.data.values ?? [];
}

function readRows(tabName: string, headers: string[], fresh: boolean): Promise<unknown[][]> {
  const cached = readCache.get(tabName);
  if (!fresh && cached && Date.now() - cached.at < READ_CACHE_TTL_MS) return cached.rows;
  const rows = fetchRows(tabName, headers);
  readCache.set(tabName, { at: Date.now(), rows });
  // 失敗した読み取りはキャッシュに残さない
  rows.catch(() => {
    if (readCache.get(tabName)?.rows === rows) readCache.delete(tabName);
  });
  return rows;
}

async function readTable<T>(tabName: string, headers: string[], options: { fresh?: boolean } = {}): Promise<T[]> {
  const rows = await readRows(tabName, headers, options.fresh ?? false);
  return rows
    .filter((row) => Array.isArray(row) && row.some((cell) => cell !== undefined && cell !== ""))
    .map((row) => {
      const obj: Record<string, unknown> = {};
      headers.forEach((h, i) => {
        const raw = (row as unknown[])[i];
        if (raw === undefined || raw === "") return;
        obj[h] = parseCell(raw);
      });
      return obj as T;
    });
}

async function writeTable(tabName: string, headers: string[], rows: Record<string, unknown>[]) {
  readCache.delete(tabName);
  const sheets = await getSheetsClient();
  const values = [
    headers,
    // 真偽値は文字列化せずそのまま渡し、シート上でも TRUE/FALSE の真偽値として保存する
    ...rows.map((row) =>
      headers.map((h) => {
        const v = row[h];
        if (v === undefined || v === null) return "";
        return typeof v === "boolean" ? v : String(v);
      })
    ),
  ];
  // 既存データをクリアしてから書き込み(件数が少ない運用を想定した単純な全件洗い替え方式)
  // clear/update はどちらも同じ内容で再実行しても結果が変わらないため、一時的なエラーは再試行する
  await withSheetsRetry(() =>
    sheets.spreadsheets.values.clear({
      spreadsheetId: SHEET_ID(),
      range: `${tabName}!A2:Z100000`,
    })
  );
  await withSheetsRetry(() =>
    sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID(),
      range: `${tabName}!A1`,
      valueInputOption: "RAW",
      requestBody: { values },
    })
  );
}

function nowIso() {
  return new Date().toISOString();
}

export class GoogleSheetsStore implements ReservationStore {
  async createReservation(
    input: Omit<Reservation, "id" | "status" | "checkinToken" | "manageToken" | "createdAt" | "updatedAt">
  ): Promise<Reservation> {
    const reservation: Reservation = {
      ...input,
      id: `RSV-${randomUUID().slice(0, 8).toUpperCase()}`,
      status: "confirmed",
      checkinToken: randomUUID(),
      manageToken: randomUUID(),
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    const all = await readTable<Reservation>(TABS.reservations, RESERVATION_HEADERS, { fresh: true });
    all.push(reservation);
    await writeTable(TABS.reservations, RESERVATION_HEADERS, all as unknown as Record<string, unknown>[]);
    return reservation;
  }

  async getReservation(id: string): Promise<Reservation | null> {
    const all = await readTable<Reservation>(TABS.reservations, RESERVATION_HEADERS);
    return all.find((r) => r.id === id) ?? null;
  }

  async getReservationByCheckinToken(token: string): Promise<Reservation | null> {
    const all = await readTable<Reservation>(TABS.reservations, RESERVATION_HEADERS);
    return all.find((r) => r.checkinToken === token) ?? null;
  }

  async getReservationByManageToken(token: string): Promise<Reservation | null> {
    const all = await readTable<Reservation>(TABS.reservations, RESERVATION_HEADERS);
    return all.find((r) => r.manageToken === token) ?? null;
  }

  async listReservations(filter?: { date?: string; status?: ReservationStatus }): Promise<Reservation[]> {
    const all = await readTable<Reservation>(TABS.reservations, RESERVATION_HEADERS);
    return all
      .filter((r) => (filter?.date ? r.date === filter.date : true))
      .filter((r) => (filter?.status ? r.status === filter.status : true))
      .sort((a, b) => (a.date + a.slotStart).localeCompare(b.date + b.slotStart));
  }

  async updateReservation(id: string, patch: Partial<Reservation>): Promise<Reservation> {
    const all = await readTable<Reservation>(TABS.reservations, RESERVATION_HEADERS, { fresh: true });
    const idx = all.findIndex((r) => r.id === id);
    if (idx === -1) throw new Error(`Reservation not found: ${id}`);
    all[idx] = { ...all[idx], ...patch, updatedAt: nowIso() };
    await writeTable(TABS.reservations, RESERVATION_HEADERS, all as unknown as Record<string, unknown>[]);
    return all[idx];
  }

  async countActiveReservations(
    date: string,
    slotStart: string,
    slotEnd: string,
    excludeReservationId?: string
  ): Promise<number> {
    const all = await readTable<Reservation>(TABS.reservations, RESERVATION_HEADERS, { fresh: true });
    return all.filter(
      (r) =>
        r.id !== excludeReservationId &&
        r.date === date &&
        (r.status === "confirmed" || r.status === "attended") &&
        r.slotStart < slotEnd &&
        r.slotEnd > slotStart
    ).length;
  }

  async countMonthlyReservationsByEmail(email: string, monthKey: string): Promise<number> {
    const all = await readTable<Reservation>(TABS.reservations, RESERVATION_HEADERS, { fresh: true });
    return all.filter(
      (r) =>
        r.email.toLowerCase() === email.toLowerCase() &&
        r.date.startsWith(monthKey) &&
        (r.status === "confirmed" || r.status === "attended")
    ).length;
  }

  async addNoShowStrike(strike: Omit<NoShowStrike, "createdAt">): Promise<void> {
    const all = await readTable<NoShowStrike>(TABS.noShowStrikes, NOSHOW_HEADERS, { fresh: true });
    all.push({ ...strike, createdAt: nowIso() });
    await writeTable(TABS.noShowStrikes, NOSHOW_HEADERS, all as unknown as Record<string, unknown>[]);
  }

  async countRecentNoShowStrikes(email: string, sinceIso: string): Promise<number> {
    const all = await readTable<NoShowStrike>(TABS.noShowStrikes, NOSHOW_HEADERS, { fresh: true });
    return all.filter((s) => s.email.toLowerCase() === email.toLowerCase() && s.createdAt >= sinceIso).length;
  }

  async getLatestPenaltyUntil(email: string): Promise<string | null> {
    const all = await readTable<NoShowStrike>(TABS.noShowStrikes, NOSHOW_HEADERS, { fresh: true });
    const strikes = all
      .filter((s) => s.email.toLowerCase() === email.toLowerCase())
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const sinceIso = new Date(
      Date.now() - config.noShowRollingWindowMonths * 30 * 24 * 3600 * 1000
    ).toISOString();
    const recentCount = strikes.filter((s) => s.createdAt >= sinceIso).length;
    if (recentCount < config.noShowStrikeLimit || strikes.length === 0) return null;
    const latest = new Date(strikes[0].createdAt);
    latest.setMonth(latest.getMonth() + config.noShowPenaltyMonths);
    return latest.toISOString();
  }

  async addWaitlistEntry(input: Omit<WaitlistEntry, "id" | "createdAt">): Promise<WaitlistEntry> {
    const entry: WaitlistEntry = { ...input, id: `WL-${randomUUID().slice(0, 8).toUpperCase()}`, createdAt: nowIso() };
    const all = await readTable<WaitlistEntry>(TABS.waitlist, WAITLIST_HEADERS, { fresh: true });
    all.push(entry);
    await writeTable(TABS.waitlist, WAITLIST_HEADERS, all as unknown as Record<string, unknown>[]);
    return entry;
  }

  async listWaitlist(date: string): Promise<WaitlistEntry[]> {
    const all = await readTable<WaitlistEntry>(TABS.waitlist, WAITLIST_HEADERS);
    return all
      .filter((w) => w.date === date && !w.promotedAt)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  async markWaitlistPromoted(id: string, reservationId: string): Promise<void> {
    const all = await readTable<WaitlistEntry>(TABS.waitlist, WAITLIST_HEADERS, { fresh: true });
    const idx = all.findIndex((w) => w.id === id);
    if (idx === -1) return;
    all[idx].promotedAt = nowIso();
    all[idx].promotedReservationId = reservationId;
    await writeTable(TABS.waitlist, WAITLIST_HEADERS, all as unknown as Record<string, unknown>[]);
  }

  async listBlackoutDates(): Promise<BlackoutDate[]> {
    const all = await readTable<BlackoutDate>(TABS.blackoutDates, BLACKOUT_HEADERS);
    return all.sort((a, b) => a.date.localeCompare(b.date));
  }

  async addBlackoutDate(entry: Omit<BlackoutDate, "createdAt">): Promise<void> {
    const all = await readTable<BlackoutDate>(TABS.blackoutDates, BLACKOUT_HEADERS, { fresh: true });
    const filtered = all.filter((b) => b.date !== entry.date);
    filtered.push({ ...entry, createdAt: nowIso() });
    await writeTable(TABS.blackoutDates, BLACKOUT_HEADERS, filtered as unknown as Record<string, unknown>[]);
  }

  async removeBlackoutDate(date: string): Promise<void> {
    const all = await readTable<BlackoutDate>(TABS.blackoutDates, BLACKOUT_HEADERS, { fresh: true });
    const filtered = all.filter((b) => b.date !== date);
    await writeTable(TABS.blackoutDates, BLACKOUT_HEADERS, filtered as unknown as Record<string, unknown>[]);
  }

  async getAdminByEmail(email: string): Promise<AdminUser | null> {
    // 管理者アカウントはスプレッドシートではなく環境変数で管理する(認証情報を平文でシートに置かないため)
    if (!process.env.ADMIN_EMAIL || process.env.ADMIN_EMAIL.toLowerCase() !== email.toLowerCase()) return null;
    const passwordHash =
      process.env.ADMIN_PASSWORD_HASH || bcrypt.hashSync(process.env.ADMIN_PASSWORD || "changeme123", 10);
    return { email: process.env.ADMIN_EMAIL, passwordHash };
  }

  async anonymizeReservationsOlderThan(cutoffIso: string): Promise<number> {
    const all = await readTable<Reservation>(TABS.reservations, RESERVATION_HEADERS, { fresh: true });
    let count = 0;
    const updated = all.map((r) => {
      if (!r.anonymized && r.createdAt < cutoffIso) {
        count++;
        return {
          ...r,
          name: "（匿名化済み）",
          email: `anonymized-${r.id}@example.invalid`,
          phone: "",
          guardianName: "",
          notes: "",
          anonymized: true,
        };
      }
      return r;
    });
    if (count > 0) await writeTable(TABS.reservations, RESERVATION_HEADERS, updated as unknown as Record<string, unknown>[]);
    return count;
  }

  async withDayLock<T>(date: string, fn: () => Promise<T>): Promise<T> {
    // プロセス内の排他制御(README/DEPLOYMENT.mdに記載の通り、複数インスタンス運用の場合は
    // Vercelのリージョン固定 or 追加のロック機構と組み合わせることを推奨)
    return slotMutex.run(date, fn);
  }
}
