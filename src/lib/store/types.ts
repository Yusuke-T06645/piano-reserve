export type ReservationStatus =
  | "confirmed" // 予約確定・来場待ち
  | "attended" // QRチェックイン済み(来場済み)
  | "cancelled" // 利用者または管理者によるキャンセル
  | "no_show"; // 無断キャンセル(管理者確認 or 自動判定)

export type AgeCategory = "adult" | "minor";

export interface Reservation {
  id: string; // 予約ID(予約番号として表示)
  date: string; // YYYY-MM-DD
  slotStart: string; // "16:00" 等
  slotEnd: string;
  name: string;
  email: string;
  phone?: string;
  ageCategory: AgeCategory;
  guardianName?: string; // ageCategory === "minor" の場合必須
  notes?: string;
  status: ReservationStatus;
  checkinToken: string; // QRに埋め込む一意トークン(チェックイン専用)
  manageToken: string; // 本人によるキャンセル・変更用トークン(checkinTokenとは別物)
  agreedToTerms: true;
  agreedToNoise: true;
  createdAt: string; // ISO datetime
  updatedAt: string;
  checkedInAt?: string;
  cancelledAt?: string;
  cancelledBy?: "user" | "admin";
  reminderSentAt?: string;
  // 個人情報保持ポリシーにより一定期間後に匿名化される
  anonymized?: boolean;
}

export interface WaitlistEntry {
  id: string;
  date: string;
  slotStart: string;
  slotEnd: string;
  name: string;
  email: string;
  phone?: string;
  ageCategory: AgeCategory;
  guardianName?: string;
  createdAt: string;
  promotedAt?: string;
  promotedReservationId?: string;
}

export interface BlackoutDate {
  date: string; // YYYY-MM-DD
  reason: string; // 例: "定期調律のため"
  createdAt: string;
}

export interface NoShowStrike {
  email: string;
  reservationId: string;
  date: string;
  createdAt: string;
}

export interface AdminUser {
  email: string;
  passwordHash: string;
}

/** ある日に埋まっている(選べない)時間帯の1区間 */
export interface BusyRange {
  start: string; // "16:20"
  end: string; // "16:45"
  kind: "reserved" | "cutoff";
}

/** ある日の空き状況(自由選択の時間帯ピッカー用) */
export interface DayAvailability {
  date: string;
  openTime: string;
  closeTime: string;
  granularityMinutes: number;
  maxUsageMinutes: number;
  busyRanges: BusyRange[];
  waitlistCount: number;
}

/**
 * データストアの共通インターフェース。
 * ローカルJSON実装(LocalJsonStore)と、本番運用向けの
 * Google Sheets実装(GoogleSheetsStore)の両方がこれを満たす。
 * これにより、管理者が普段使うスプレッドシートをそのまま
 * 予約台帳として使う運用にも、環境変数の切り替えだけで対応できる。
 */
export interface ReservationStore {
  // 予約
  createReservation(input: Omit<Reservation,
    "id" | "status" | "checkinToken" | "manageToken" | "createdAt" | "updatedAt">): Promise<Reservation>;
  getReservation(id: string): Promise<Reservation | null>;
  getReservationByCheckinToken(token: string): Promise<Reservation | null>;
  getReservationByManageToken(token: string): Promise<Reservation | null>;
  listReservations(filter?: { date?: string; status?: ReservationStatus }): Promise<Reservation[]>;
  updateReservation(id: string, patch: Partial<Reservation>): Promise<Reservation>;

  // 予約数カウント(排他制御・上限チェック用)
  // date+slotStart+slotEnd の時間帯に重複する有効な予約件数を返す(excludeReservationIdはリスケジュール時に自分自身を除外するため)
  countActiveReservations(
    date: string,
    slotStart: string,
    slotEnd: string,
    excludeReservationId?: string
  ): Promise<number>;
  countMonthlyReservationsByEmail(email: string, monthKey: string): Promise<number>;

  // ノーショー
  addNoShowStrike(strike: Omit<NoShowStrike, "createdAt">): Promise<void>;
  countRecentNoShowStrikes(email: string, sinceIso: string): Promise<number>;
  getLatestPenaltyUntil(email: string): Promise<string | null>;

  // キャンセル待ち(日付単位。各エントリは自分の希望時間帯(slotStart/slotEnd)を保持する)
  addWaitlistEntry(input: Omit<WaitlistEntry, "id" | "createdAt">): Promise<WaitlistEntry>;
  listWaitlist(date: string): Promise<WaitlistEntry[]>;
  markWaitlistPromoted(id: string, reservationId: string): Promise<void>;

  // ブラックアウト日(調律日等)
  listBlackoutDates(): Promise<BlackoutDate[]>;
  addBlackoutDate(entry: Omit<BlackoutDate, "createdAt">): Promise<void>;
  removeBlackoutDate(date: string): Promise<void>;

  // 管理者
  getAdminByEmail(email: string): Promise<AdminUser | null>;

  // 個人情報保持ポリシー
  anonymizeReservationsOlderThan(cutoffIso: string): Promise<number>;

  /**
   * 排他制御込みで予約作成を行うためのロック。
   * 時間帯は自由に選べる(重複チェックが必要)ため、同一date全体への同時アクセスをシリアライズする。
   */
  withDayLock<T>(date: string, fn: () => Promise<T>): Promise<T>;
}
