/**
 * ローカル開発環境（STORE_BACKEND=local）向けのデモ予約データ投入スクリプト。
 * 実行例: npm run seed
 *
 * 空の予約カレンダー・管理画面ではなく、確定・来場済み・キャンセル済み・キャンセル待ちなど
 * 実際の運用に近い状態を画面上で確認できるようにするためのもの。
 * 実行時点から見て直近の開放日（第1・第3金曜）にデータを積むため、いつ実行しても
 * 予約カレンダー・管理画面にすぐ反映される。
 */
import { generateDaySlots } from "../src/lib/config";
import { listUpcomingEligibleDates } from "../src/lib/dates";
import { getStore } from "../src/lib/store";
import type { Reservation } from "../src/lib/store/types";

const SEED_MARKER = "[seed-demo-data]";

try {
  // next dev/build と異なり、tsx単体実行では .env.local が自動読み込みされないため明示的に読む
  // (ADMIN_EMAIL等はstore側で呼び出し時に参照されるので、importより後でも問題ない)
  process.loadEnvFile(".env.local");
} catch {
  // .env.local が無くても STORE_BACKEND=local 等の既定値で動作するため無視する
}

async function main() {
  const store = getStore();

  const already = await store.listReservations();
  if (already.some((r) => r.notes?.includes(SEED_MARKER))) {
    console.log(
      "デモデータは既に投入済みのようです。何もせず終了します。" +
        "再投入したい場合は var/data/db.json を削除してから実行してください。"
    );
    return;
  }

  const [day1, day2, day3] = listUpcomingEligibleDates();
  if (!day1 || !day2 || !day3) {
    throw new Error("直近の開放日が見つかりませんでした（config.tsの開放日ルールを確認してください）。");
  }
  const slots = generateDaySlots();

  async function seed(input: Omit<Parameters<typeof store.createReservation>[0], "notes">): Promise<Reservation> {
    return store.createReservation({ ...input, notes: SEED_MARKER });
  }

  // 1件目: 通常の確定予約
  await seed({
    date: day1,
    slotStart: slots[0].start,
    slotEnd: slots[0].end,
    name: "山田 太郎",
    email: "taro.yamada@example.com",
    phone: "090-1234-5678",
    ageCategory: "adult",
    agreedToTerms: true,
    agreedToNoise: true,
  });

  // 2件目: 当日QRチェックイン済み（来場済み）の予約
  const attended = await seed({
    date: day1,
    slotStart: slots[1].start,
    slotEnd: slots[1].end,
    name: "佐藤 花子",
    email: "hanako.sato@example.com",
    ageCategory: "adult",
    agreedToTerms: true,
    agreedToNoise: true,
  });
  await store.updateReservation(attended.id, {
    status: "attended",
    checkedInAt: new Date().toISOString(),
  });

  // 3件目: 利用者本人によりキャンセル済みの予約
  const cancelled = await seed({
    date: day1,
    slotStart: slots[2].start,
    slotEnd: slots[2].end,
    name: "鈴木 一郎",
    email: "ichiro.suzuki@example.com",
    ageCategory: "adult",
    agreedToTerms: true,
    agreedToNoise: true,
  });
  await store.updateReservation(cancelled.id, {
    status: "cancelled",
    cancelledAt: new Date().toISOString(),
    cancelledBy: "user",
  });

  // 4件目: 未成年（保護者氏名あり）の確定予約
  await seed({
    date: day2,
    slotStart: slots[0].start,
    slotEnd: slots[0].end,
    name: "田中 陽菜",
    email: "hina.tanaka@example.com",
    ageCategory: "minor",
    guardianName: "田中 直子",
    agreedToTerms: true,
    agreedToNoise: true,
  });

  // 5件目: 満席枠 + キャンセル待ち登録の一組
  await seed({
    date: day2,
    slotStart: slots[1].start,
    slotEnd: slots[1].end,
    name: "高橋 健二",
    email: "kenji.takahashi@example.com",
    ageCategory: "adult",
    agreedToTerms: true,
    agreedToNoise: true,
  });
  await store.addWaitlistEntry({
    date: day2,
    slotStart: slots[1].start,
    slotEnd: slots[1].end,
    name: "伊藤 美咲",
    email: "misaki.ito@example.com",
    ageCategory: "adult",
  });

  // 休止日（調律日）の例
  await store.addBlackoutDate({
    date: day3,
    reason: `${SEED_MARKER} 定期調律のため`,
  });

  console.log(`デモデータを投入しました（開放日: ${day1}, ${day2} / 休止日サンプル: ${day3}）。`);
  console.log("- 確定予約 / 来場済み / キャンセル済み / 未成年予約 / 満席+キャンセル待ち の各パターンを用意しました。");
  console.log("npm run dev で起動し、/reserve と /admin から確認してください。");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
