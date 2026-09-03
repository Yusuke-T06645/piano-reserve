import { getStore } from "@/lib/store";
import { formatJapaneseDate } from "@/lib/dates";
import { listUpcomingEligibleDates } from "@/lib/dates";
import { ReservationRow } from "./ReservationRow";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const store = getStore();
  const upcoming = listUpcomingEligibleDates().slice(0, 6);
  const grouped = await Promise.all(
    upcoming.map(async (date) => ({
      date,
      reservations: await store.listReservations({ date }),
    }))
  );

  const totalUpcoming = grouped.reduce(
    (sum, g) => sum + g.reservations.filter((r) => r.status === "confirmed").length,
    0
  );

  return (
    <div>
      <h1 className="font-display text-2xl sm:text-[26px] font-bold text-navy">予約一覧ダッシュボード</h1>
      <p className="mt-2.5 text-[13.5px] text-muted leading-[1.8] max-w-[620px]">
        直近の開放日の予約状況です。ここでの操作はGoogle Sheets運用時にはスプレッドシートにも即時反映されます。
      </p>

      <div className="flex gap-3.5 my-6">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-soft px-4 py-2 text-[12.5px] font-bold text-teal-dark">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <circle cx="12" cy="8" r="4" />
            <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
          </svg>
          直近の来場待ち予約 {totalUpcoming} 件
        </span>
      </div>

      <div className="flex flex-col gap-[22px]">
        {grouped.map(({ date, reservations }) => (
          <div key={date} className="rounded-[18px] border border-navy/[0.09] bg-white px-6 sm:px-7 py-[26px] shadow-soft">
            <div className="flex items-center justify-between mb-3.5">
              <h2 className="text-base font-bold text-navy">{formatJapaneseDate(date)}</h2>
              <span className="text-xs text-muted">
                予約 {reservations.filter((r) => r.status === "confirmed" || r.status === "attended").length}件
              </span>
            </div>
            {reservations.length === 0 ? (
              <p className="text-sm text-muted">この日の予約はまだありません。</p>
            ) : (
              <div className="overflow-x-auto -mx-1">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-muted border-b border-navy/[0.09]">
                      <th className="py-2 pr-4 font-medium">時間</th>
                      <th className="py-2 pr-4 font-medium">予約者</th>
                      <th className="py-2 pr-4 font-medium">状況</th>
                      <th className="py-2 font-medium text-right">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reservations.map((r) => (
                      <ReservationRow
                        key={r.id}
                        id={r.id}
                        slotStart={r.slotStart}
                        slotEnd={r.slotEnd}
                        name={r.name}
                        email={r.email}
                        phone={r.phone}
                        ageCategory={r.ageCategory}
                        status={r.status}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
