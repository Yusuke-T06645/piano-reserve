import Link from "next/link";
import { notFound } from "next/navigation";
import { Stepper } from "@/components/ui";
import { freeMinutesInDay, getDayAvailability, isDateBookable } from "@/lib/availability";
import { formatJapaneseDate } from "@/lib/dates";
import { config } from "@/lib/config";
import { TimeRangeSelector } from "./TimeRangeSelector";

export const dynamic = "force-dynamic";

export default async function DateSlotsPage({ params }: { params: Promise<{ date: string }> }) {
  const { date } = await params;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) notFound();
  if (!(await isDateBookable(date))) notFound();

  const availability = await getDayAvailability(date);
  const hasFreeTime = freeMinutesInDay(availability) >= config.granularityMinutes;

  return (
    <div className="px-4 sm:px-6 lg:px-16 py-10 sm:py-14">
      <div className="mx-auto max-w-[1400px]">
        <Stepper current={2} />

        <p className="text-[13px] font-bold tracking-widest text-gold-ink uppercase">STEP 2 / 3</p>
        <h1 className="font-display mt-2.5 text-2xl sm:text-[30px] font-bold text-navy">
          {formatJapaneseDate(date)}の利用時間を選ぶ
        </h1>
        <p className="mt-3 mb-8 text-[16px] text-muted leading-[1.8]">
          {hasFreeTime ? (
            <>
              {config.openTime}〜{config.closeTime}の間で、ご希望の利用時間をお選びください（{config.granularityMinutes}
              分単位・1組最大{config.maxUsageMinutes}分）。「15分」などのボタン、つまみのドラッグ、＋／−ボタンのいずれでも調整できます。
            </>
          ) : (
            <>
              この日はすべての時間帯が埋まっています。キャンセル待ちにご登録いただくか、他の開放日をお選びください。
            </>
          )}
        </p>

        <TimeRangeSelector
          date={date}
          openTime={availability.openTime}
          closeTime={availability.closeTime}
          granularityMinutes={availability.granularityMinutes}
          maxUsageMinutes={availability.maxUsageMinutes}
          busyRanges={availability.busyRanges}
          waitlistCount={availability.waitlistCount}
        />

        <p className="mt-9">
          <Link href="/reserve" className="inline-flex min-h-11 items-center gap-1.5 text-[15px] font-bold text-teal-dark hover:underline">
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
