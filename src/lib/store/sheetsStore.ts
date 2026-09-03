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
  "agreedToNoise", "createdAt", "updatedAt", "checkedInAt", "cancelledAt", "cancelledBy",
  "reminderSentAt", "anonymized",
];
const WAITLIST_HEADERS: (keyof WaitlistEntry)[] = [
  "id", "date", "slotStart", "slotEnd", "name", "email", "phone", "ageCategory",
  "guardianName", "createdAt", "promotedAt", "promotedReservationId",
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

async function ensureSheetExists(tabName: string, headers: string[]) {
  const sheets = await getSheetsClient();
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID() });
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
}

async function readTable<T>(tabName: string, headers: string[]): Promise<T[]> {
  await ensureSheetExists(tabName, headers);
  const sheets = await getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID(),
    range: `${tabName}!A2:${String.fromCharCode(64 + headers.length)}100000`,
  });
  const rows = res.data.values ?? [];
  return rows
    .filter((row) => row.some((cell) => cell !== undefined && cell !== ""))
    .map((row) => {
      const obj: Record<string, unknown> = {};
      headers.forEach((h, i) => {
        const raw = row[i];
        if (raw === undefined || raw === "") return;
        if (raw === "TRUE") obj[h] = true;
        else if (raw === "FALSE") obj[h] = false;
        else obj[h] = raw;
      });
      return obj as T;
    });
}

async function writeTable(tabName: string, headers: string[], rows: Record<string, unknown>[]) {
  const sheets = await getSheetsClient();
  const values = [
    headers,
    ...rows.map((row) => headers.map((h) => (row[h] === undefined || row[h] === null ? "" : String(row[h])))),
  ];
  // 既存データをクリアしてから書き込み(件数が少ない運用を想定した単純な全件洗い替え方式)
  await sheets.spreadsheets.values.clear({
    spreadsheetId: SHEET_ID(),
    range: `${tabName}!A2:Z100000`,
  });
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID(),
    range: `${tabName}!A1`,
    valueInputOption: "RAW",
    requestBody: { values },
  });
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
    const all = await readTable<Reservation>(TABS.reservations, RESERVATION_HEADERS);
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
    const all = await readTable<Reservation>(TABS.reservations, RESERVATION_HEADERS);
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
    const all = await readTable<Reservation>(TABS.reservations, RESERVATION_HEADERS);
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
    const all = await readTable<Reservation>(TABS.reservations, RESERVATION_HEADERS);
    return all.filter(
      (r) =>
        r.email.toLowerCase() === email.toLowerCase() &&
        r.date.startsWith(monthKey) &&
        (r.status === "confirmed" || r.status === "attended")
    ).length;
  }

  async addNoShowStrike(strike: Omit<NoShowStrike, "createdAt">): Promise<void> {
    const all = await readTable<NoShowStrike>(TABS.noShowStrikes, NOSHOW_HEADERS);
    all.push({ ...strike, createdAt: nowIso() });
    await writeTable(TABS.noShowStrikes, NOSHOW_HEADERS, all as unknown as Record<string, unknown>[]);
  }

  async countRecentNoShowStrikes(email: string, sinceIso: string): Promise<number> {
    const all = await readTable<NoShowStrike>(TABS.noShowStrikes, NOSHOW_HEADERS);
    return all.filter((s) => s.email.toLowerCase() === email.toLowerCase() && s.createdAt >= sinceIso).length;
  }

  async getLatestPenaltyUntil(email: string): Promise<string | null> {
    const all = await readTable<NoShowStrike>(TABS.noShowStrikes, NOSHOW_HEADERS);
    const strikes = all
      .filter((s) => s.email.toLowerCase() === email.toLowerCase())
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const recentCount = await this.countRecentNoShowStrikes(
      email,
      new Date(Date.now() - config.noShowRollingWindowMonths * 30 * 24 * 3600 * 1000).toISOString()
    );
    if (recentCount < config.noShowStrikeLimit || strikes.length === 0) return null;
    const latest = new Date(strikes[0].createdAt);
    latest.setMonth(latest.getMonth() + config.noShowPenaltyMonths);
    return latest.toISOString();
  }

  async addWaitlistEntry(input: Omit<WaitlistEntry, "id" | "createdAt">): Promise<WaitlistEntry> {
    const entry: WaitlistEntry = { ...input, id: `WL-${randomUUID().slice(0, 8).toUpperCase()}`, createdAt: nowIso() };
    const all = await readTable<WaitlistEntry>(TABS.waitlist, WAITLIST_HEADERS);
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
    const all = await readTable<WaitlistEntry>(TABS.waitlist, WAITLIST_HEADERS);
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
    const all = await readTable<BlackoutDate>(TABS.blackoutDates, BLACKOUT_HEADERS);
    const filtered = all.filter((b) => b.date !== entry.date);
    filtered.push({ ...entry, createdAt: nowIso() });
    await writeTable(TABS.blackoutDates, BLACKOUT_HEADERS, filtered as unknown as Record<string, unknown>[]);
  }

  async removeBlackoutDate(date: string): Promise<void> {
    const all = await readTable<BlackoutDate>(TABS.blackoutDates, BLACKOUT_HEADERS);
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
    const all = await readTable<Reservation>(TABS.reservations, RESERVATION_HEADERS);
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
