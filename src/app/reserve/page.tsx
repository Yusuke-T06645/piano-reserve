import Link from "next/link";
import { Stepper } from "@/components/ui";
import { listDaySummaries, type DaySummary } from "@/lib/availability";
import { formatJapaneseDate } from "@/lib/dates";
import { config } from "@/lib/config";

export const dynamic = "force-dynamic";

/** 日付カードに表示する状況ラベル（色だけでなく文言でも区別できるようにする） */
function statusLabel(d: DaySummary): { text: string; className: string; stripe: string } {
  switch (d.status) {
    case "open":
      return {
        text: `空きあり（残り${d.freeMinutes}分）`,
        className: "bg-success-soft text-success",
        stripe: "bg-success",
      };
    case "full":
      return {
        text: d.waitlistCount > 0 ? "満席（キャンセル待ち受付中）" : "満席（キャンセル待ち可）",
        className: "bg-gold-soft text-gold-ink",
        stripe: "bg-gold",
      };
    case "closed":
      return {
        text: "本日の受付は終了しました",
        className: "bg-[#EDE8DF] text-muted",
        stripe: "bg-navy/[0.16]",
      };
    case "blackout":
      return {
        text: "休止日（調律・点検等のため）",
        className: "bg-[#EDE8DF] text-muted",
        stripe: "bg-navy/[0.16]",
      };
  }
}

export default async function ReservePage() {
  const days = await listDaySummaries();
  const nextBookable = days.find((d) => d.status === "open");

  return (
    <div className="px-4 sm:px-6 lg:px-16 py-10 sm:py-14">
      <div className="mx-auto max-w-[1400px]">
        <Stepper current={1} />

        <p className="text-[13px] font-bold tracking-widest text-gold-ink uppercase">STEP 1 / 3</p>
        <h1 className="font-display mt-2.5 text-2xl sm:text-[30px] font-bold text-navy">予約する日を選ぶ</h1>
        <p className="mt-3 mb-6 text-[16px] text-muted leading-[1.8]">
          開放日は毎月第1・第3金曜日、{config.openTime}〜{config.closeTime}です。下の開放日の一覧から、ご希望の日を選んでください。
        </p>

        {nextBookable && (
          <Link
            href={`/reserve/${nextBookable.date}`}
            className="mb-8 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-teal/25 bg-teal-soft px-5 py-4 sm:px-6"
          >
            <span className="flex items-center gap-3">
              <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal text-white">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </span>
              <span>
                <span className="block text-[13px] font-bold tracking-widest text-teal-dark uppercase">次に予約できる日</span>
                <span className="block font-display text-[17px] font-bold text-navy">
                  {formatJapaneseDate(nextBookable.date)}（残り{nextBookable.freeMinutes}分）
                </span>
              </span>
            </span>
            <span className="text-[15px] font-bold text-teal-dark">この日の時間を選ぶ →</span>
          </Link>
        )}

        {days.length > 0 && !nextBookable && (
          <div className="mb-8 rounded-2xl border border-gold/40 bg-gold-soft px-5 py-4 sm:px-6">
            <p className="text-[16px] font-bold text-navy">現在、すぐにご予約いただける空き枠がありません</p>
            <p className="mt-1.5 text-[15px] leading-[1.8] text-ink">
              満席の日はキャンセル待ちにご登録いただけます（キャンセルが出た場合、先着順で自動的にご案内します）。
              休止日・受付終了の日はお選びいただけません。
            </p>
          </div>
        )}

        <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {days.map((d) => {
            const label = statusLabel(d);
            const selectable = d.status === "open" || d.status === "full";
            const card = (
              <div
                className={
                  selectable
                    ? "relative h-full overflow-hidden rounded-2xl border border-navy/[0.09] bg-white px-6 py-[26px] shadow-soft transition-all group-hover:shadow-elevated group-hover:border-teal/40"
                    : "relative h-full overflow-hidden rounded-2xl border border-dashed border-navy/[0.28] bg-[#F5F1EC] px-6 py-[26px]"
                }
              >
                <span aria-hidden className={`absolute left-0 top-0 bottom-0 w-1 ${label.stripe}`} />
                <p className={`font-display text-[19px] font-bold ${selectable ? "text-navy" : "text-muted"}`}>
                  {formatJapaneseDate(d.date)}
                </p>
                <p className="mt-1.5 text-[14px] text-muted">
                  {config.openTime}〜{config.closeTime}
                </p>
                <div className="mt-4">
                  <span
                    className={`inline-flex items-center rounded-full px-3.5 py-1.5 text-[13px] font-bold ${label.className}`}
                  >
                    {label.text}
                  </span>
                </div>
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
            <a href={`mailto:${config.supportEmail}`} className="font-bold text-teal-dark underline">
              {config.supportEmail}
            </a>
            までお問い合わせください。
          </p>
        )}
      </div>
    </div>
  );
}
