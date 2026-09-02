import { Card, SectionTitle, Badge } from "@/components/ui";
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
      <SectionTitle
        title="予約一覧ダッシュボード"
        description="直近の開放日の予約状況です。ここでの操作はGoogle Sheets運用時にはスプレッドシートにも即時反映されます。"
      />
      <div className="mb-6">
        <Badge tone="info">直近の来場待ち予約 {totalUpcoming} 件</Badge>
      </div>

      <div className="space-y-6">
        {grouped.map(({ date, reservations }) => (
          <Card key={date}>
            <h2 className="text-base font-bold text-navy mb-3">{formatJapaneseDate(date)}</h2>
            {reservations.length === 0 ? (
              <p className="text-sm text-muted">この日の予約はまだありません。</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-muted border-b border-black/10">
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
          </Card>
        ))}
      </div>
    </div>
  );
}
