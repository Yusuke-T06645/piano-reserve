import path from "node:path";
import fs from "node:fs";
import os from "node:os";
import { randomUUID } from "node:crypto";
import { JSONFilePreset } from "lowdb/node";
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

interface DbSchema {
  reservations: Reservation[];
  waitlist: WaitlistEntry[];
  blackoutDates: BlackoutDate[];
  noShowStrikes: NoShowStrike[];
  admins: AdminUser[];
}

const defaultData: DbSchema = {
  reservations: [],
  waitlist: [],
  blackoutDates: [],
  noShowStrikes: [],
  admins: [],
};

function nowIso() {
  return new Date().toISOString();
}

/**
 * Vercel等のサーバーレス環境では process.cwd() 配下は読み取り専用で、書き込み可能なのは
 * OS一時ディレクトリ(/tmp)のみのため、そちらをデフォルトの保存先にする(このストアは
 * デモ用であり、サーバーレス環境ではもともと永続化されない前提のため問題ない)。
 */
function defaultLocalDbPath(): string {
  const base = process.env.VERCEL ? os.tmpdir() : process.cwd();
  return path.join(base, "var", "data", "db.json");
}

/**
 * ローカルJSONファイルベースのストア実装。
 * dbPathをインスタンスごとに持たせることで、本番/開発では単一のDBファイルを共有しつつ、
 * テストでは一時ファイルを指定して完全に独立したストアを作れるようにしている。
 */
export class LocalJsonStore implements ReservationStore {
  private dbPromise: ReturnType<typeof JSONFilePreset<DbSchema>> | null = null;
  private dbPath: string;

  constructor(dbPath?: string) {
    this.dbPath = dbPath || process.env.LOCAL_DB_PATH || defaultLocalDbPath();
  }

  private async getDb() {
    if (!this.dbPromise) {
      fs.mkdirSync(path.dirname(this.dbPath), { recursive: true });
      this.dbPromise = JSONFilePreset<DbSchema>(this.dbPath, defaultData);
    }
    const db = await this.dbPromise;
    await db.read();

    // 初回起動時に管理者アカウントを環境変数から自動生成(デモ用)
    if (db.data.admins.length === 0 && process.env.ADMIN_EMAIL) {
      const passwordHash = process.env.ADMIN_PASSWORD_HASH
        ? process.env.ADMIN_PASSWORD_HASH
        : bcrypt.hashSync(process.env.ADMIN_PASSWORD || "changeme123", 10);
      db.data.admins.push({ email: process.env.ADMIN_EMAIL, passwordHash });
      await db.write();
    }
    return db;
  }

  async createReservation(
    input: Omit<Reservation, "id" | "status" | "checkinToken" | "manageToken" | "createdAt" | "updatedAt">
  ): Promise<Reservation> {
    const db = await this.getDb();
    const reservation: Reservation = {
      ...input,
      id: `RSV-${randomUUID().slice(0, 8).toUpperCase()}`,
      status: "confirmed",
      checkinToken: randomUUID(),
      manageToken: randomUUID(),
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    db.data.reservations.push(reservation);
    await db.write();
    return reservation;
  }

  async getReservation(id: string): Promise<Reservation | null> {
    const db = await this.getDb();
    return db.data.reservations.find((r) => r.id === id) ?? null;
  }

  async getReservationByCheckinToken(token: string): Promise<Reservation | null> {
    const db = await this.getDb();
    return db.data.reservations.find((r) => r.checkinToken === token) ?? null;
  }

  async getReservationByManageToken(token: string): Promise<Reservation | null> {
    const db = await this.getDb();
    return db.data.reservations.find((r) => r.manageToken === token) ?? null;
  }

  async listReservations(filter?: { date?: string; status?: ReservationStatus }): Promise<Reservation[]> {
    const db = await this.getDb();
    return db.data.reservations
      .filter((r) => (filter?.date ? r.date === filter.date : true))
      .filter((r) => (filter?.status ? r.status === filter.status : true))
      .sort((a, b) => (a.date + a.slotStart).localeCompare(b.date + b.slotStart));
  }

  async updateReservation(id: string, patch: Partial<Reservation>): Promise<Reservation> {
    const db = await this.getDb();
    const idx = db.data.reservations.findIndex((r) => r.id === id);
    if (idx === -1) throw new Error(`Reservation not found: ${id}`);
    db.data.reservations[idx] = { ...db.data.reservations[idx], ...patch, updatedAt: nowIso() };
    await db.write();
    return db.data.reservations[idx];
  }

  async countActiveReservations(date: string, slotStart: string): Promise<number> {
    const db = await this.getDb();
    return db.data.reservations.filter(
      (r) => r.date === date && r.slotStart === slotStart && (r.status === "confirmed" || r.status === "attended")
    ).length;
  }

  async countMonthlyReservationsByEmail(email: string, monthKey: string): Promise<number> {
    const db = await this.getDb();
    return db.data.reservations.filter(
      (r) =>
        r.email.toLowerCase() === email.toLowerCase() &&
        r.date.startsWith(monthKey) &&
        (r.status === "confirmed" || r.status === "attended")
    ).length;
  }

  async addNoShowStrike(strike: Omit<NoShowStrike, "createdAt">): Promise<void> {
    const db = await this.getDb();
    db.data.noShowStrikes.push({ ...strike, createdAt: nowIso() });
    await db.write();
  }

  async countRecentNoShowStrikes(email: string, sinceIso: string): Promise<number> {
    const db = await this.getDb();
    return db.data.noShowStrikes.filter(
      (s) => s.email.toLowerCase() === email.toLowerCase() && s.createdAt >= sinceIso
    ).length;
  }

  async getLatestPenaltyUntil(email: string): Promise<string | null> {
    const db = await this.getDb();
    const strikes = db.data.noShowStrikes
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
    const db = await this.getDb();
    const entry: WaitlistEntry = { ...input, id: `WL-${randomUUID().slice(0, 8).toUpperCase()}`, createdAt: nowIso() };
    db.data.waitlist.push(entry);
    await db.write();
    return entry;
  }

  async listWaitlist(date: string, slotStart: string): Promise<WaitlistEntry[]> {
    const db = await this.getDb();
    return db.data.waitlist
      .filter((w) => w.date === date && w.slotStart === slotStart && !w.promotedAt)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  async markWaitlistPromoted(id: string, reservationId: string): Promise<void> {
    const db = await this.getDb();
    const idx = db.data.waitlist.findIndex((w) => w.id === id);
    if (idx === -1) return;
    db.data.waitlist[idx].promotedAt = nowIso();
    db.data.waitlist[idx].promotedReservationId = reservationId;
    await db.write();
  }

  async listBlackoutDates(): Promise<BlackoutDate[]> {
    const db = await this.getDb();
    return [...db.data.blackoutDates].sort((a, b) => a.date.localeCompare(b.date));
  }

  async addBlackoutDate(entry: Omit<BlackoutDate, "createdAt">): Promise<void> {
    const db = await this.getDb();
    db.data.blackoutDates = db.data.blackoutDates.filter((b) => b.date !== entry.date);
    db.data.blackoutDates.push({ ...entry, createdAt: nowIso() });
    await db.write();
  }

  async removeBlackoutDate(date: string): Promise<void> {
    const db = await this.getDb();
    db.data.blackoutDates = db.data.blackoutDates.filter((b) => b.date !== date);
    await db.write();
  }

  async getAdminByEmail(email: string): Promise<AdminUser | null> {
    const db = await this.getDb();
    return db.data.admins.find((a) => a.email.toLowerCase() === email.toLowerCase()) ?? null;
  }

  async anonymizeReservationsOlderThan(cutoffIso: string): Promise<number> {
    const db = await this.getDb();
    let count = 0;
    db.data.reservations = db.data.reservations.map((r) => {
      if (!r.anonymized && r.createdAt < cutoffIso) {
        count++;
        return {
          ...r,
          name: "（匿名化済み）",
          email: `anonymized-${r.id}@example.invalid`,
          phone: undefined,
          guardianName: undefined,
          notes: undefined,
          anonymized: true,
        };
      }
      return r;
    });
    if (count > 0) await db.write();
    return count;
  }

  async withSlotLock<T>(date: string, slotStart: string, fn: () => Promise<T>): Promise<T> {
    return slotMutex.run(`${date}__${slotStart}`, fn);
  }
}
