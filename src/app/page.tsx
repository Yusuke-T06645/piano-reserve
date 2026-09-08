import Link from "next/link";
import Image from "next/image";
import { Card, Button } from "@/components/ui";
import { config } from "@/lib/config";
import { freeMinutesInDay, getDayAvailability, listBookableDates } from "@/lib/availability";
import { formatJapaneseDate } from "@/lib/dates";

export const dynamic = "force-dynamic";

async function getNextOpenDay() {
  const dates = await listBookableDates();
  const nextAvailable = dates.find((d) => d.available);
  if (!nextAvailable) return null;
  const availability = await getDayAvailability(nextAvailable.date);
  const freeMinutes = freeMinutesInDay(availability);
  return { date: nextAvailable.date, freeMinutes, waitlistCount: availability.waitlistCount };
}

export default async function Home() {
  const nextOpenDay = await getNextOpenDay();

  return (
    <>
      {/* ヒーローセクション */}
      <section className="relative overflow-hidden bg-linear-to-br from-navy-dark via-navy to-teal-dark px-4 sm:px-16 pt-14 sm:pt-20 pb-20 sm:pb-24">
        <div
          className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-gold/25 blur-3xl pointer-events-none"
          aria-hidden
        />
        <div
          className="absolute -left-16 -bottom-32 h-80 w-80 rounded-full bg-teal/30 blur-3xl pointer-events-none"
          aria-hidden
        />
        <svg
          width="640"
          height="140"
          viewBox="0 0 640 140"
          className="absolute left-0 top-8 opacity-10 pointer-events-none hidden sm:block"
          aria-hidden
          fill="none"
        >
          <g stroke="#F0DEB8" strokeWidth="1">
            <line x1="0" y1="10" x2="640" y2="10" />
            <line x1="0" y1="34" x2="640" y2="34" />
            <line x1="0" y1="58" x2="640" y2="58" />
            <line x1="0" y1="82" x2="640" y2="82" />
            <line x1="0" y1="106" x2="640" y2="106" />
          </g>
        </svg>

        <div className="relative mx-auto max-w-[1400px] grid sm:grid-cols-2 gap-10 sm:gap-14 items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-gold-light/15 border border-gold-light/35 px-4 py-2 text-xs font-bold tracking-wide text-gold-light">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M9 18V5l10-2v13" />
                <circle cx="6.5" cy="18" r="2.5" />
                <circle cx="16.5" cy="16" r="2.5" />
              </svg>
              {config.orgName} 地域開放事業
            </span>

            {/* 次回の開放日・残り枠数(最優先で表示する情報) */}
            <div className="mt-6 inline-flex flex-wrap items-stretch gap-px rounded-2xl bg-white/12 border border-white/20 overflow-hidden backdrop-blur-sm">
              <div className="px-5 py-4">
                <p className="text-[11px] font-bold tracking-widest text-white/60 uppercase">次回の開放日</p>
                <p className="font-display mt-1 text-lg sm:text-xl font-bold text-white">
                  {nextOpenDay ? formatJapaneseDate(nextOpenDay.date) : "現在、開放予定日はありません"}
                </p>
              </div>
              {nextOpenDay && (
                <div className="px-5 py-4 bg-white/8">
                  <p className="text-[11px] font-bold tracking-widest text-white/60 uppercase">予約可能な残り枠</p>
                  <p className="font-display mt-1 text-lg sm:text-xl font-bold text-gold-light">
                    {nextOpenDay.freeMinutes > 0
                      ? `空きあり（残り${nextOpenDay.freeMinutes}分）`
                      : nextOpenDay.waitlistCount > 0
                        ? "満席（キャンセル待ち登録可）"
                        : "満席"}
                  </p>
                </div>
              )}
            </div>

            <h1 className="font-display mt-6 text-3xl sm:text-[52px] font-bold leading-[1.4] text-white tracking-wide">
              グランドピアノを、
              <br />
              地域のみなさまへ。
            </h1>
            <p className="mt-5 text-white/80 leading-[1.9] max-w-md text-[15px] sm:text-base">
              {config.orgName}が所有するグランドピアノを一般開放します。毎月第1・第3金曜日、
              {config.openTime}〜{config.closeTime}の間で、ご希望の時間帯（最大{config.maxUsageMinutes}分）を自由に選んでご予約いただけます。
            </p>
            <div className="mt-9 flex flex-wrap gap-3.5">
              <Link href="/reserve">
                <Button size="lg" variant="gold">
                  空き枠を確認して予約する
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </Button>
              </Link>
              <Link href="/manage/lookup">
                <Button size="lg" variant="outline" className="!text-white !border-white/55 hover:!bg-white/10">
                  予約内容の確認・変更
                </Button>
              </Link>
            </div>
            <p className="mt-4">
              <a href="#guide" className="text-[13px] font-bold text-white/70 underline underline-offset-2 hover:text-white">
                ご利用の流れ・会場のご案内を見る
              </a>
            </p>
            <div className="mt-9 flex flex-col gap-4 sm:flex-row sm:gap-7 pt-7 border-t border-white/15">
              <div className="flex items-baseline gap-2 sm:block">
                <p className="font-display text-lg sm:text-[22px] font-bold text-gold-light">毎月2回</p>
                <p className="text-xs text-white/60 sm:mt-0.5">第1・第3金曜開催</p>
              </div>
              <div className="flex items-baseline gap-2 sm:block">
                <p className="font-display text-lg sm:text-[22px] font-bold text-gold-light">
                  最大{config.maxUsageMinutes}分
                </p>
                <p className="text-xs text-white/60 sm:mt-0.5">1組あたりのご利用時間</p>
              </div>
              <div className="flex items-baseline gap-2 sm:block">
                <p className="font-display text-lg sm:text-[22px] font-bold text-gold-light">無料</p>
                <p className="text-xs text-white/60 sm:mt-0.5">事前Web予約制</p>
              </div>
            </div>
          </div>

          <div className="relative flex justify-center">
            <div
              className="absolute h-[300px] w-[300px] sm:h-[460px] sm:w-[460px] rounded-full bg-gold-light/20 blur-2xl pointer-events-none"
              aria-hidden
            />
            <div className="relative w-full max-w-[420px] sm:max-w-[520px] rounded-[26px] overflow-hidden shadow-hero border border-gold-light/35">
              <Image
                src="/piano-hero.jpg"
                alt={`${config.orgName}本社に設置されているヤマハ製グランドピアノ`}
                width={1344}
                height={1008}
                priority
                className="block w-full h-auto"
              />
              <div className="absolute inset-x-0 bottom-0 px-5 py-4 bg-linear-to-t from-navy-dark/80 via-navy-dark/15 to-transparent">
                <p className="text-white text-xs font-bold tracking-wide">
                  YAMAHA グランドピアノ ／ {config.venueName}
                </p>
              </div>
            </div>
          </div>
        </div>

        <svg
          viewBox="0 0 1440 84"
          preserveAspectRatio="none"
          className="absolute inset-x-0 bottom-0 w-full h-12 sm:h-[84px] text-white"
          aria-hidden
        >
          <path
            fill="currentColor"
            d="M0,44 C110,14 200,74 320,50 C440,26 520,78 640,54 C760,30 840,76 960,52 C1080,28 1170,72 1280,50 C1340,39 1400,34 1440,40 L1440,84 L0,84 Z"
          />
        </svg>
      </section>

      {/* 開放情報 */}
      <section id="guide" className="scroll-mt-16 px-4 sm:px-16 pt-16 sm:pt-[88px]">
        <div className="mx-auto max-w-[1400px] grid sm:grid-cols-3 gap-5 mb-16 sm:mb-[88px]">
          <Card className="p-7">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gold-soft text-gold">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <rect x="3" y="5" width="18" height="16" rx="3" />
                <path d="M8 3v4M16 3v4M3 10h18" />
              </svg>
            </div>
            <p className="mt-5 text-xs font-bold tracking-widest text-gold uppercase">開放日</p>
            <p className="font-display mt-2 text-2xl font-bold text-navy">毎月 第1・第3金曜日</p>
            <p className="mt-2.5 text-[13px] text-muted leading-relaxed">開放日は当日の状況により休止する場合があります</p>
          </Card>
          <Card className="p-7">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-soft text-teal-dark">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3.5 2" />
              </svg>
            </div>
            <p className="mt-5 text-xs font-bold tracking-widest text-teal-dark uppercase">時間</p>
            <p className="font-display mt-2 text-2xl font-bold text-navy">
              {config.openTime} 〜 {config.closeTime}
            </p>
            <p className="mt-2.5 text-[13px] text-muted leading-relaxed">
              1組あたり最大{config.maxUsageMinutes}分、自由に時間を選べます
            </p>
          </Card>
          <Card className="p-7">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-navy-soft text-navy">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <circle cx="12" cy="12" r="9" />
                <path d="M9 6l3 5 3-5M12 11v7M9 13h6M9 16h6" />
              </svg>
            </div>
            <p className="mt-5 text-xs font-bold tracking-widest text-navy uppercase">利用料金</p>
            <p className="font-display mt-2 text-2xl font-bold text-navy">無料</p>
            <p className="mt-2.5 text-[13px] text-muted leading-relaxed">事前のWeb予約が必要です</p>
          </Card>
        </div>

        <div className="mx-auto max-w-[1400px] grid sm:grid-cols-2 gap-10 sm:gap-16 pb-16 sm:pb-24">
          <div>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-navy mb-8">ご利用の流れ</h2>
            <ol className="space-y-7">
              {[
                "カレンダーから空いている日時を選ぶ",
                "お名前・連絡先を入力して予約する",
                "確認メールに記載のQRコードを保存する",
                "当日、受付でQRコードを提示する",
              ].map((step, i) => (
                <li key={i} className="flex gap-4 items-start">
                  <span className="shrink-0 h-10 w-10 rounded-full bg-teal text-white text-[15px] font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                  <span className="pt-2 text-[15px] text-ink">{step}</span>
                </li>
              ))}
            </ol>
            <Link href="/reserve" className="inline-block mt-8">
              <Button variant="secondary">今すぐ予約する</Button>
            </Link>

            <div className="mt-12 rounded-2xl border border-navy/[0.09] bg-white p-7">
              <h2 className="font-display text-lg font-bold text-navy mb-4">会場のご案内</h2>
              <dl className="space-y-3 text-[13.5px] text-ink leading-[1.7]">
                <div>
                  <dt className="font-bold text-muted text-[11.5px]">会場</dt>
                  <dd>
                    {config.venueName}
                    <br />
                    {config.venueAddress}
                    {config.venueMapUrl && (
                      <>
                        {" "}
                        ・
                        <a
                          href={config.venueMapUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-bold text-teal-dark underline"
                        >
                          地図を見る
                        </a>
                      </>
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="font-bold text-muted text-[11.5px]">アクセス</dt>
                  <dd>{config.venueAccess}</dd>
                </div>
                <div>
                  <dt className="font-bold text-muted text-[11.5px]">当日の持ち物・受付方法</dt>
                  <dd>{config.venueChecklist}</dd>
                </div>
              </dl>
            </div>
          </div>

          <Card className="bg-cream border-none p-9">
            <h2 className="font-display text-lg sm:text-[22px] font-bold text-navy mb-4">ご利用にあたってのお願い</h2>
            <ul className="space-y-3 text-[13.5px] text-ink leading-[1.8]">
              <li className="flex gap-2.5">
                <span className="text-gold shrink-0">●</span>
                近隣にお住まいの皆様へのご配慮をお願いいたします（演奏時間の厳守、静かな出入り）。
              </li>
              <li className="flex gap-2.5">
                <span className="text-gold shrink-0">●</span>
                未成年の方がご利用の場合は、保護者の同意と当日の同伴が必要です。
              </li>
            </ul>
            <details className="mt-3 group">
              <summary className="cursor-pointer list-none text-[13px] font-bold text-teal-dark inline-flex items-center gap-1.5 focus-visible:outline-none">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                  className="transition-transform group-open:rotate-90"
                >
                  <path d="M9 6l6 6-6 6" />
                </svg>
                その他の注意事項をすべて見る
              </summary>
              <ul className="mt-3 space-y-3 text-[13.5px] text-ink leading-[1.8]">
                <li className="flex gap-2.5">
                  <span className="text-gold shrink-0">●</span>
                  複数の方が触れる鍵盤です。衛生面にご配慮のうえご利用ください。
                </li>
                <li className="flex gap-2.5">
                  <span className="text-gold shrink-0">●</span>
                  当日、無断でのご欠席が続いた場合、以降のご予約を一定期間制限させていただく場合があります。
                </li>
                <li className="flex gap-2.5">
                  <span className="text-gold shrink-0">●</span>
                  ピアノの破損や利用中の事故等に関する責任範囲は「利用規約」をご確認ください。
                </li>
              </ul>
            </details>
            <div className="mt-5 flex gap-6 text-sm">
              <Link href="/terms" className="font-bold text-teal-dark hover:underline">
                利用規約を読む
              </Link>
              <Link href="/privacy" className="font-bold text-teal-dark hover:underline">
                プライバシーポリシー
              </Link>
            </div>
          </Card>
        </div>
      </section>
    </>
  );
}
