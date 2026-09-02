import Link from "next/link";
import { Container, Card, SectionTitle, Badge } from "@/components/ui";
import { getDayAvailability, listBookableDates } from "@/lib/availability";
import { formatJapaneseDate } from "@/lib/dates";
import { config } from "@/lib/config";

export const dynamic = "force-dynamic";

export default async function ReservePage() {
  const dates = await listBookableDates();
  const withAvailability = await Promise.all(
    dates.map(async (d) => {
      if (!d.available) return { ...d, totalAvailable: 0, totalWaitlist: 0 };
      const slots = await getDayAvailability(d.date);
      return {
        ...d,
        totalAvailable: slots.reduce((sum, s) => sum + s.available, 0),
        totalWaitlist: slots.reduce((sum, s) => sum + s.waitlistCount, 0),
      };
    })
  );

  return (
    <Container className="py-10 sm:py-14">
      <SectionTitle
        eyebrow="Step 1"
        title="予約する日を選ぶ"
        description={`開放日は毎月第1・第3金曜日、${config.openTime}〜${config.closeTime}です。ご希望の日付を選択してください。`}
      />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {withAvailability.map((d) => {
          const full = d.available && d.totalAvailable === 0;
          return (
            <Link
              key={d.date}
              href={d.available ? `/reserve/${d.date}` : "#"}
              aria-disabled={!d.available}
              className={
                d.available
                  ? "block focus-visible:outline-offset-4"
                  : "block pointer-events-none opacity-50"
              }
            >
              <Card className="h-full hover:shadow-md hover:border-teal/40 transition-all">
                <p className="text-lg font-bold text-navy">{formatJapaneseDate(d.date)}</p>
                <p className="text-sm text-muted mt-1">
                  {config.openTime}〜{config.closeTime}
                </p>
                <div className="mt-3">
                  {!d.available && <Badge tone="neutral">休止日</Badge>}
                  {d.available && full && d.totalWaitlist === 0 && <Badge tone="danger">満枠</Badge>}
                  {d.available && full && d.totalWaitlist > 0 && <Badge tone="warning">満枠(キャンセル待ち可)</Badge>}
                  {d.available && !full && <Badge tone="success">空きあり（{d.totalAvailable}枠）</Badge>}
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
      {withAvailability.length === 0 && (
        <Card>
          <p className="text-muted">現在、予約可能な開放日の情報がありません。しばらくしてから再度お試しください。</p>
        </Card>
      )}
    </Container>
  );
}
