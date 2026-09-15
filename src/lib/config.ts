/**
 * ビジネスルール設定
 * ここを変更するだけで、開放日・枠数・予約上限・ノーショー対策等のルールを調整できます。
 */
export const config = {
  siteName: "田中組グランドピアノ開放事業",
  siteShortName: "ピアノひろば",
  orgName: "株式会社田中組",
  // 未設定時にダミードメインへ誤送信し続けないよう、フォールバックは空文字にする
  // (空の場合は notifications.ts 側で送信をスキップしてログに警告を出す)
  adminNotifyEmail: process.env.ADMIN_NOTIFY_EMAIL || "",
  supportEmail: process.env.SUPPORT_EMAIL || "soumubu@tanakagumi.co.jp",
  supportPhone: process.env.SUPPORT_PHONE || "011-611-3331",

  // 会場案内(予約前・完了画面の両方で表示する)
  // 未確認の項目は推測で記載せず空のままにしておくこと。
  // 空の項目は公開画面に表示せず、代わりに問い合わせ先を案内する(src/components/VenueInfo.tsx)。
  venueName: process.env.VENUE_NAME || "株式会社田中組 本社 1階ホール（指定エリア）",
  venueAddress: process.env.VENUE_ADDRESS || "北海道札幌市中央区北6条西11丁目26番地",
  /** 最寄り駅・バス停からのアクセス(改行はそのまま表示される) */
  venueAccess:
    process.env.VENUE_ACCESS ||
    "JR桑園駅から徒歩約11分\n地下鉄 西11丁目駅から徒歩約14分\nJR札幌駅から徒歩約18分",
  /** 建物の入口と受付場所 */
  venueEntrance:
    process.env.VENUE_ENTRANCE ||
    "1階のガラス張りの正面玄関からお入りください。受付は無人です。受付に置かれた電話機で内線「9501」（総務部）をお呼び出しください。",
  /** 駐車場・駐輪場の案内(台数は未確認のため記載していない) */
  venueParking:
    process.env.VENUE_PARKING || "敷地内の来客用駐車場・駐輪場を無料でご利用いただけます。",
  /** 段差・車いすでの入館に関する案内 */
  venueAccessibility:
    process.env.VENUE_ACCESSIBILITY ||
    "車いすでのご来館が可能です。なお、館内に多目的トイレはございませんので、あらかじめご了承ください。",
  venueMapUrl: process.env.VENUE_MAP_URL || "",
  venueChecklist:
    "当日は、受付でQRコード・予約番号をご提示いただくか、お名前をお伝えください。上履きの必要はありません。",

  // 開放日ルール: 毎月 第1・第3金曜日
  eligibleWeekday: 5, // 0=日,1=月,...5=金
  eligibleOccurrences: [1, 3] as const,

  // 開放時間・利用時間設定
  openTime: "16:00",
  closeTime: "17:00",
  granularityMinutes: 5, // 利用時間はこの単位でドラッグ選択・調整できる
  maxUsageMinutes: 60, // 1回のご利用の最大時間
  capacityPerSlot: 1, // ピアノは1台のため同時1組まで(時間帯が重複する予約は不可)

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

/** "16:00" のような文字列を、0時からの経過分に変換する */
export function timeToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

/** 0時からの経過分を "16:00" のような文字列に変換する */
export function minutesToTime(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** openTime〜closeTime の開放時間の長さ(分)を返す */
export function totalOpenMinutes(): number {
  return timeToMinutes(config.closeTime) - timeToMinutes(config.openTime);
}

/** openTime〜closeTime を granularityMinutes 刻みで分割した時刻一覧(グリッド線)を返す */
export function generateTimeGrid(): string[] {
  const startMinutes = timeToMinutes(config.openTime);
  const endMinutes = timeToMinutes(config.closeTime);
  const points: string[] = [];
  for (let m = startMinutes; m <= endMinutes; m += config.granularityMinutes) {
    points.push(minutesToTime(m));
  }
  return points;
}

/**
 * 地図を開くリンクを返す。
 * VENUE_MAP_URL が設定されていればそれを、未設定の場合は住所からGoogleマップの検索URLを組み立てる。
 */
export function venueMapLink(): string {
  if (config.venueMapUrl) return config.venueMapUrl;
  if (!config.venueAddress) return "";
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(config.venueAddress)}`;
}
