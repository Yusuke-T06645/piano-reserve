import Link from "next/link";
import { notFound } from "next/navigation";
import { Stepper, Button } from "@/components/ui";
import { getDayAvailability, isDateBookable, isSlotPastCutoff } from "@/lib/availability";
import { formatJapaneseDate } from "@/lib/dates";
import { config } from "@/lib/config";

export const dynamic = "force-dynamic";

export default async function DateSlotsPage({ params }: { params: Promise<{ date: string }> }) {
  const { date } = await params;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) notFound();
  if (!(await isDateBookable(date))) notFound();

  const slots = await getDayAvailability(date);

  return (
    <div className="px-4 sm:px-16 py-10 sm:py-14">
      <div className="mx-auto max-w-5xl">
        <Stepper current={2} />

        <p className="text-xs font-bold tracking-widest text-gold uppercase">STEP 2 / 3</p>
        <h1 className="font-display mt-2.5 text-2xl sm:text-[30px] font-bold text-navy">
          {formatJapaneseDate(date)}の利用時間を選ぶ
        </h1>
        <p className="mt-3 mb-10 text-[14.5px] text-muted leading-[1.8]">
          {config.openTime}〜{config.closeTime}の間で、{config.slotMinutes}分単位でご希望の利用時間を選択してください。
        </p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {slots.map((s) => {
            const past = isSlotPastCutoff(date, s.slotStart);
            const full = s.available === 0;
            const stripe = past ? "bg-navy/[0.16]" : full && s.waitlistCount === 0 ? "bg-danger" : full ? "bg-gold" : "bg-success";
            return (
              <div
                key={s.slotStart}
                className={
                  past
                    ? "relative overflow-hidden rounded-2xl border border-dashed border-navy/[0.16] bg-[#F5F1EC] px-6 py-[26px] opacity-65 flex flex-col justify-between"
                    : "relative overflow-hidden rounded-2xl border border-navy/[0.09] bg-white px-6 py-[26px] shadow-soft flex flex-col justify-between"
                }
              >
                <div>
                  <span aria-hidden className={`absolute left-0 top-0 bottom-0 w-1 ${stripe}`} />
                  <p className={`font-display text-[19px] font-bold ${past ? "text-muted" : "text-navy"}`}>
                    {s.slotStart}〜{s.slotEnd}
                  </p>
                  <div className="mt-4">
                    {past && (
                      <span className="inline-flex items-center rounded-full bg-[#EDE8DF] px-3 py-1 text-[11.5px] font-bold text-muted">
                        受付終了
                      </span>
                    )}
                    {!past && !full && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-success-soft px-3 py-1 text-[11.5px] font-bold text-success">
                        <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-success" />
                        空きあり
                      </span>
                    )}
                    {!past && full && s.waitlistCount === 0 && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-danger-soft px-3 py-1 text-[11.5px] font-bold text-danger">
                        <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-danger" />
                        満席
                      </span>
                    )}
                    {!past && full && s.waitlistCount > 0 && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-gold-soft px-3 py-1 text-[11.5px] font-bold text-[#8A6A3E]">
                        <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-gold" />
                        満席・キャンセル待ち {s.waitlistCount}名
                      </span>
                    )}
                  </div>
                </div>
                <div className="mt-6">
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
              </div>
            );
          })}
        </div>

        <p className="mt-9">
          <Link href="/reserve" className="inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-teal-dark hover:underline">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M19 12H5M11 18l-6-6 6-6" />
            </svg>
            他の開放日を選びなおす
          </Link>
        </p>
      </div>
    </div>
  );
}
