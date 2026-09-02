/**
 * 個人情報の保持期間ポリシーに基づき、古い予約データの氏名・連絡先を匿名化するバッチ。
 * 実行例: npx tsx scripts/purge-old-data.ts
 * 本番運用では月次のCronジョブ等での定期実行を推奨(README参照)。
 */
import { config } from "../src/lib/config";
import { getStore } from "../src/lib/store";

async function main() {
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - config.piiRetentionMonths);
  const store = getStore();
  const count = await store.anonymizeReservationsOlderThan(cutoff.toISOString());
  console.log(`${count} 件の古い予約データを匿名化しました(保持期間: ${config.piiRetentionMonths}ヶ月)。`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
