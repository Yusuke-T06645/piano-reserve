/**
 * ビジネスルール設定
 * ここを変更するだけで、開放日・枠数・予約上限・ノーショー対策等のルールを調整できます。
 */
export const config = {
  siteName: "田中組グランドピアノ開放事業",
  siteShortName: "ピアノひろば",
  orgName: "株式会社田中組",
  adminNotifyEmail: process.env.ADMIN_NOTIFY_EMAIL || "admin@example.com",
  supportEmail: process.env.SUPPORT_EMAIL || "piano-support@example.com",

  // 開放日ルール: 毎月 第1・第3金曜日
  eligibleWeekday: 5, // 0=日,1=月,...5=金
  eligibleOccurrences: [1, 3] as const,

  // 開放時間・枠設定
  openTime: "16:00",
  closeTime: "17:00",
  slotMinutes: 10, // 1枠10分 → 6枠/時間
  capacityPerSlot: 1, // ピアノは1台のため同時1組まで

  // 予約可能期間
  bookingWindowDaysAhead: 90, // 何日先まで予約可能か
  bookingCutoffHoursBefore: 3, // 開始の何時間前まで新規予約を受け付けるか

  // 予約上限(公平な利用のため)
  monthlyBookingLimitPerEmail: 1,

  // キャンセル・変更
  selfServiceChangeDeadlineHours: 24, // これより前ならWeb上で自由に変更・キャンセル可能

  // ノーショー(無断キャンセル)対策
  noShowStrikeLimit: 2, // このローリング期間内に何回で制限がかかるか
  noShowRollingWindowMonths: 3,
  noShowPenaltyMonths: 2, // 制限がかかる期間

  // データ保持(個人情報保護)
  piiRetentionMonths: 12,

  // 対象者
  minGuestAge: null as number | null, // 年齢下限は設けない。ただし未成年は保護者同伴を必須化
};

export type SlotTime = { start: string; end: string; label: string };

/** 16:00〜17:00 を10分刻みで分割したスロット一覧を返す */
export function generateDaySlots(): SlotTime[] {
  const [oh, om] = config.openTime.split(":").map(Number);
  const [ch, cm] = config.closeTime.split(":").map(Number);
  const startMinutes = oh * 60 + om;
  const endMinutes = ch * 60 + cm;
  const slots: SlotTime[] = [];
  for (let m = startMinutes; m + config.slotMinutes <= endMinutes; m += config.slotMinutes) {
    const toHHMM = (mins: number) =>
      `${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`;
    slots.push({
      start: toHHMM(m),
      end: toHHMM(m + config.slotMinutes),
      label: `${toHHMM(m)}〜${toHHMM(m + config.slotMinutes)}`,
    });
  }
  return slots;
}
