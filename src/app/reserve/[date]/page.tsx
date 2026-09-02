import Link from "next/link";
import { notFound } from "next/navigation";
import { Container, Card, SectionTitle, Badge, Button } from "@/components/ui";
import { getDayAvailability, isDateBookable, isSlotPastCutoff } from "@/lib/availability";
import { formatJapaneseDate } from "@/lib/dates";

export const dynamic = "force-dynamic";

export default async function DateSlotsPage({ params }: { params: Promise<{ date: string }> }) {
  const { date } = await params;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) notFound();
  if (!(await isDateBookable(date))) notFound();

  const slots = await getDayAvailability(date);

  return (
    <Container className="py-10 sm:py-14">
      <SectionTitle eyebrow="Step 2" title={`${formatJapaneseDate(date)} の時間枠を選ぶ`} description="10分単位でご予約いただけます。" />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {slots.map((s) => {
          const past = isSlotPastCutoff(date, s.slotStart);
          const full = s.available === 0;
          return (
            <Card key={s.slotStart} className="flex flex-col justify-between">
              <div>
                <p className="text-xl font-bold text-navy">{s.slotStart}〜{s.slotEnd}</p>
                <div className="mt-2">
                  {past && <Badge tone="neutral">受付終了</Badge>}
                  {!past && !full && <Badge tone="success">空きあり</Badge>}
                  {!past && full && s.waitlistCount === 0 && <Badge tone="danger">満席</Badge>}
                  {!past && full && s.waitlistCount > 0 && (
                    <Badge tone="warning">満席・キャンセル待ち {s.waitlistCount}名</Badge>
                  )}
                </div>
              </div>
              <div className="mt-4">
                {!past && !full && (
                  <Link href={`/reserve/${date}/${encodeURIComponent(s.slotStart)}`}>
                    <Button className="w-full">この枠を予約する</Button>
                  </Link>
                )}
                {!past && full && (
                  <Link href={`/reserve/${date}/${encodeURIComponent(s.slotStart)}?waitlist=1`}>
                    <Button variant="outline" className="w-full">
                      キャンセル待ちに登録する
                    </Button>
                  </Link>
                )}
                {past && (
                  <Button variant="ghost" className="w-full" disabled>
                    受付終了しました
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>
      <p className="mt-8 text-sm text-muted">
        <Link href="/reserve" className="text-teal-dark hover:underline">
          ← 他の開放日を選びなおす
        </Link>
      </p>
    </Container>
  );
}
