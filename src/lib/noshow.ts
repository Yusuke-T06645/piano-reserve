import { fromIsoDate } from "./dates";
import { getStore } from "./store";

/**
 * 開催時刻を過ぎてもチェックインされていない「確定」ステータスの予約を
 * 自動的に「無断キャンセル(no_show)」として扱い、ノーショー回数を加算する。
 * Vercel Cron 等から定期実行することを想定(/api/cron/no-shows)。
 */
export async function markPastReservationsAsNoShow(now: Date = new Date()): Promise<number> {
  const store = getStore();
  const reservations = await store.listReservations({ status: "confirmed" });
  let count = 0;
  for (const r of reservations) {
    const [h, m] = r.slotEnd.split(":").map(Number);
    const end = fromIsoDate(r.date);
    end.setHours(h, m, 0, 0);
    if (end.getTime() < now.getTime()) {
      await store.updateReservation(r.id, { status: "no_show" });
      await store.addNoShowStrike({ email: r.email, reservationId: r.id, date: r.date });
      count++;
    }
  }
  return count;
}
