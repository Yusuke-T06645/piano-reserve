import Link from "next/link";
import { Stepper } from "@/components/ui";
import { freeMinutesInDay, getDayAvailability, listBookableDates } from "@/lib/availability";
import { formatJapaneseDate } from "@/lib/dates";
import { config } from "@/lib/config";

export const dynamic = "force-dynamic";

export default async function ReservePage() {
  const dates = await listBookableDates();
  const withAvailability = await Promise.all(
    dates.map(async (d) => {
      if (!d.available) return { ...d, freeMinutes: 0, totalWaitlist: 0 };
      const availability = await getDayAvailability(d.date);
      return {
        ...d,
        freeMinutes: freeMinutesInDay(availability),
        totalWaitlist: availability.waitlistCount,
      };
    })
  );

  return (
    <div className="px-4 sm:px-16 py-10 sm:py-14">
      <div className="mx-auto max-w-5xl">
        <Stepper current={1} />

        <p className="text-xs font-bold tracking-widest text-gold uppercase">STEP 1 / 3</p>
        <h1 className="font-display mt-2.5 text-2xl sm:text-[30px] font-bold text-navy">予約する日を選ぶ</h1>
        <p className="mt-3 mb-10 text-[14.5px] text-muted leading-[1.8]">
          開放日は毎月第1・第3金曜日、{config.openTime}〜{config.closeTime}です。ご希望の日付を選択してください。
        </p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {withAvailability.map((d) => {
            const full = d.available && d.freeMinutes < config.granularityMinutes;
            const stripe = !d.available
              ? "bg-navy/[0.16]"
              : full && d.totalWaitlist === 0
                ? "bg-danger"
                : full
                  ? "bg-gold"
                  : "bg-success";
            return (
              <Link
                key={d.date}
                href={d.available ? `/reserve/${d.date}` : "#"}
                aria-disabled={!d.available}
                className={
                  d.available
                    ? "block focus-visible:outline-offset-4 group"
                    : "block pointer-events-none"
                }
              >
                <div
                  className={
                    d.available
                      ? "relative overflow-hidden rounded-2xl border border-navy/[0.09] bg-white px-6 py-[26px] shadow-soft transition-all group-hover:shadow-elevated group-hover:border-teal/40"
                      : "relative overflow-hidden rounded-2xl border border-dashed border-navy/[0.16] bg-[#F5F1EC] px-6 py-[26px] opacity-65"
                  }
                >
                  <span aria-hidden className={`absolute left-0 top-0 bottom-0 w-1 ${stripe}`} />
                  <p className={`font-display text-[19px] font-bold ${d.available ? "text-navy" : "text-muted"}`}>
                    {formatJapaneseDate(d.date)}
                  </p>
                  <p className="mt-1.5 text-xs text-muted">
                    {config.openTime}〜{config.closeTime}
                  </p>
                  <div className="mt-4">
                    {!d.available && (
                      <span className="inline-flex items-center rounded-full bg-[#EDE8DF] px-3 py-1 text-[11.5px] font-bold text-muted">
                        休止日（調律のため）
                      </span>
                    )}
                    {d.available && full && d.totalWaitlist === 0 && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-danger-soft px-3 py-1 text-[11.5px] font-bold text-danger">
                        <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-danger" />
                        満枠
                      </span>
                    )}
                    {d.available && full && d.totalWaitlist > 0 && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-gold-soft px-3 py-1 text-[11.5px] font-bold text-[#8A6A3E]">
                        <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-gold" />
                        満枠（キャンセル待ち可）
                      </span>
                    )}
                    {d.available && !full && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-success-soft px-3 py-1 text-[11.5px] font-bold text-success">
                        <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-success" />
                        空きあり（{d.freeMinutes}分）
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
        {withAvailability.length === 0 && (
          <p className="text-muted">現在、予約可能な開放日の情報がありません。しばらくしてから再度お試しください。</p>
        )}
      </div>
    </div>
  );
}
