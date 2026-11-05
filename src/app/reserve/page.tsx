import Link from "next/link";
import { Stepper } from "@/components/ui";
import { getDayAvailability, listDaySummaries, type DaySummary } from "@/lib/availability";
import { SlotKeys, buildSlots, type Slot } from "@/components/SlotKeys";
import { formatJapaneseDate } from "@/lib/dates";
import { config } from "@/lib/config";

export const dynamic = "force-dynamic";

/** 日付カードに表示する状況ラベル（色だけでなく文言でも区別できるようにする） */
function statusLabel(d: DaySummary): { text: string; dot: string } {
  switch (d.status) {
    case "open":
      return { text: `空きあり（残り${d.freeMinutes}分）`, dot: "bg-success" };
    case "full":
      return {
        text: d.waitlistCount > 0 ? "満席（キャンセル待ち受付中）" : "満席（キャンセル待ち可）",
        dot: "bg-gold",
      };
    case "closed":
      return { text: "本日の受付は終了しました", dot: "bg-navy/25" };
    case "blackout":
      return { text: "休止日（調律・点検等のため）", dot: "bg-navy/25" };
  }
}

export default async function ReservePage() {
  const days = await listDaySummaries();
  const nextBookable = days.find((d) => d.status === "open");
  // 予約できる日(空きあり・満席)は、時間枠ごとの空き状況を小さな鍵盤で見せる
  const slotsByDate = new Map<string, Slot[]>(
    await Promise.all(
      days
        .filter((d) => d.status === "open" || d.status === "full")
        .map(async (d) => {
          const day = await getDayAvailability(d.date);
          return [d.date, buildSlots(day.openTime, day.closeTime, day.granularityMinutes, day.busyRanges)] as const;
        })
    )
  );

  return (
    <div className="bg-cream px-4 sm:px-6 lg:px-16 py-10 sm:py-14">
      <div className="mx-auto max-w-[1400px]">
        <Stepper current={1} />

        <h1 className="font-display text-[28px] sm:text-[32px] font-medium leading-[1.3] text-navy">予約する日を選ぶ</h1>
        <p className="mt-4 mb-8 text-[16px] text-muted leading-[1.8]">
          開放日は毎月第1・第3金曜日、{config.openTime}〜{config.closeTime}です。下の開放日の一覧から、ご希望の日を選んでください。
        </p>

        {nextBookable && (
          <Link
            href={`/reserve/${nextBookable.date}`}
            className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-teal-dark/25 bg-white px-6 py-5 transition-colors hover:border-teal-dark/50 hover:bg-teal-soft/40"
          >
            <span>
              <span className="block text-[14px] text-teal-dark">次に予約できる日</span>
              <span className="block font-display text-[20px] font-medium text-navy">
                {formatJapaneseDate(nextBookable.date)}
                <span className="ml-2 font-sans text-[15px] text-muted">残り{nextBookable.freeMinutes}分</span>
              </span>
            </span>
            <span className="inline-flex items-center gap-2 text-[15px] font-medium text-teal-dark">
              この日の時間を選ぶ
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </span>
          </Link>
        )}

        {days.length > 0 && !nextBookable && (
          <div className="mb-8 rounded-2xl border border-gold/40 bg-gold-soft px-6 py-5">
            <p className="text-[16px] font-medium text-navy">現在、すぐにご予約いただける空き枠がありません</p>
            <p className="mt-2 text-[15px] leading-[1.8] text-ink">
              満席の日はキャンセル待ちにご登録いただけます（キャンセルが出た場合、先着順で自動的にご案内します）。
              休止日・受付終了の日はお選びいただけません。
            </p>
          </div>
        )}

        <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {days.map((d) => {
            const label = statusLabel(d);
            const selectable = d.status === "open" || d.status === "full";
            const card = (
              <div
                className={
                  selectable
                    ? "h-full rounded-2xl border border-navy/[0.08] bg-white p-6 transition-colors duration-150 group-hover:border-teal-dark/40 group-hover:bg-teal-soft/30"
                    : "h-full rounded-2xl border border-dashed border-navy/20 bg-transparent p-6"
                }
              >
                <p className={`font-display text-[20px] font-medium ${selectable ? "text-navy" : "text-muted"}`}>
                  {formatJapaneseDate(d.date)}
                </p>
                <p className="mt-1 text-[14px] text-muted tabular-nums">
                  {config.openTime}〜{config.closeTime}
                </p>
                {slotsByDate.has(d.date) && (
                  <SlotKeys slots={slotsByDate.get(d.date)!} closeTime={config.closeTime} compact className="mt-4" />
                )}
                <p className="mt-4 flex items-center gap-2 text-[14px] text-ink">
                  <span aria-hidden className={`h-2 w-2 shrink-0 rounded-full ${label.dot}`} />
                  {label.text}
                </p>
              </div>
            );
            return (
              <li key={d.date}>
                {selectable ? (
                  <Link href={`/reserve/${d.date}`} className="group block h-full">
                    {card}
                  </Link>
                ) : (
                  card
                )}
              </li>
            );
          })}
        </ul>

        {days.length === 0 && (
          <p className="text-[16px] leading-[1.8] text-ink">
            現在、予約可能な開放日の情報がありません。次回の日程が決まり次第、このページに掲載します。お急ぎの場合は
            <a href={`mailto:${config.supportEmail}`} className="font-medium text-teal-dark underline">
              {config.supportEmail}
            </a>
            までお問い合わせください。
          </p>
        )}
      </div>
    </div>
  );
}
