import Link from "next/link";
import Image from "next/image";
import { Card } from "@/components/ui";
import { VenueInfo } from "@/components/VenueInfo";
import { MiniKeyboard } from "@/components/MiniKeyboard";
import { LogoMark } from "@/components/LogoMark";
import { KeyboardEdge } from "@/components/KeyboardEdge";
import { SlotKeys, buildSlots, type Slot } from "@/components/SlotKeys";
import { config, isFixedSlotMode, maxGroupsPerDay } from "@/lib/config";
import { getDayAvailability, listDaySummaries, type DaySummary } from "@/lib/availability";
import { formatJapaneseDate } from "@/lib/dates";

export const dynamic = "force-dynamic";

/** 次回の開放日と、その日が予約できない場合に次に予約できる日、次回の時間枠ごとの空き状況を求める */
async function getOpenDayStatus(): Promise<{
  next: DaySummary | null;
  nextBookable: DaySummary | null;
  nextSlots: Slot[] | null;
}> {
  const summaries = await listDaySummaries();
  const next = summaries[0] ?? null;
  const nextBookable = summaries.find((d) => d.status === "open") ?? null;
  let nextSlots: Slot[] | null = null;
  if (next && next.status !== "blackout") {
    const day = await getDayAvailability(next.date);
    nextSlots = buildSlots(day.openTime, day.closeTime, day.granularityMinutes, day.busyRanges);
  }
  return { next, nextBookable, nextSlots };
}

const STATUS_TEXT: Record<DaySummary["status"], (d: DaySummary) => string> = {
  open: (d) => `空きあり（残り${d.freeMinutes}分）`,
  full: (d) => (d.waitlistCount > 0 ? "満席（キャンセル待ち受付中）" : "満席（キャンセル待ちに登録できます）"),
  closed: () => "本日の受付は終了しました",
  blackout: () => "休止日（調律・点検等のため）",
};

const FAQ: { q: string; a: React.ReactNode }[] = [
  {
    q: "初心者でも利用できますか？",
    a: "はい。演奏の経験や上手さは問いません。はじめてグランドピアノに触れる方も、ゆっくり練習したい方もご利用いただけます。",
  },
  {
    q: "子どもの練習に利用できますか？",
    a: "はい、ご利用いただけます。未成年の方がご利用になる場合は、保護者の方の同意と、当日の同伴・同席をお願いしています。ご予約時に保護者の方のお名前をご入力ください。",
  },
  {
    q: "保護者・同伴の方は一緒に入れますか？",
    a: "ご家族・お連れの方のご入場は可能です。ピアノ周辺のスペースには限りがありますので、少人数でのご来場にご協力ください。",
  },
  {
    q: "楽譜は持参する必要がありますか？",
    a: "会場での楽譜の貸し出しは行っておりません。お使いになる楽譜・タブレット等はご持参ください。",
  },
  {
    q: "キャンセルや遅刻の場合はどうすればよいですか？",
    a: (
      <>
        キャンセル・日時の変更は、確認メールに記載のリンク（
        <Link href="/manage/lookup" className="font-medium text-teal-dark underline">
          予約の確認・変更・キャンセル
        </Link>
        ）から、ご利用の{config.selfServiceChangeDeadlineHours}時間前まで手続きできます。締切を過ぎた場合や当日に遅れる場合は、
        <a href={`mailto:${config.supportEmail}`} className="font-medium text-teal-dark underline">
          {config.supportEmail}
        </a>
        {config.supportPhone && `（電話: ${config.supportPhone}）`}
        までご連絡ください。なお、遅れてご来場された場合も、次のご予約の方がいらっしゃるため終了時刻の延長はできません。
      </>
    ),
  },
  {
    q: "QRコードを表示できない場合はどうすればよいですか？",
    a: "QRコードがなくてもご利用いただけます。受付で予約番号をお伝えいただくか、お名前をお伝えください。スタッフが予約内容を確認します。",
  },
];

export default async function Home() {
  const { next, nextBookable, nextSlots } = await getOpenDayStatus();
  const canReserveNow = nextBookable !== null;

  return (
    <>
      {/* ヒーロー: 左に案内と次回の開放日、右に実際のピアノの写真 */}
      <section className="relative overflow-hidden bg-linear-to-b from-navy-dark to-[#173040] px-4 sm:px-6 lg:px-16 pt-12 sm:pt-16 lg:pt-24 pb-24 sm:pb-28 lg:pb-32">
        {/* 田中組のロゴマークの透かし(静止)。文字と重ならない左下の余白に置く */}
        <LogoMark
          className="pointer-events-none absolute -bottom-10 -right-16 hidden w-[300px] h-auto text-gold-light xl:block"
          fillOpacity={0.03}
          strokeOpacity={0.12}
        />
        <div className="relative mx-auto max-w-[1400px] grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] gap-12 lg:gap-16 items-center">
          <div>
            <p style={{ "--i": 0 } as React.CSSProperties} className="rise-in flex items-center gap-2 text-[14px] text-gold-light">
              <LogoMark className="h-6 w-auto text-gold-light" />
              {config.orgName} 地域開放事業
            </p>

            {/* 1. まず「何を開放しているか」を伝える */}
            <h1
              style={{ "--i": 1 } as React.CSSProperties}
              className="rise-in font-display mt-4 text-[36px] sm:text-[48px] xl:text-[56px] font-medium leading-[1.3] text-white"
            >
              <span className="inline-block">グランドピアノを、</span>
              <br />
              <span className="inline-block">
                <span className="text-gold-light">地域のみなさま</span>へ。
              </span>
            </h1>
            {/* 文節ごとに inline-block で区切り、単語の途中で改行されないようにする */}
            <p
              style={{ "--i": 2 } as React.CSSProperties}
              className="rise-in mt-6 max-w-[34rem] text-[16px] sm:text-[18px] leading-[1.9] text-white/75 [&_span]:inline-block"
            >
              <span>{config.orgName}が所有する</span>
              <span>グランドピアノを、</span>
              <span>地域のみなさまに</span>
              <span>無料で開放しています。</span>
              <span>毎月第1・第3金曜日の</span>
              <span>{config.openTime}〜{config.closeTime}の間で、</span>
              <span>1組{config.maxUsageMinutes}分まで</span>
              <span>ご予約いただけます。</span>
            </p>

            {/* 2. 次回の開放日・時間・空き状況(実際の予約データに連動) */}
            <div
              style={{ "--i": 3 } as React.CSSProperties}
              className="rise-in mt-8 max-w-[34rem] rounded-2xl border border-gold-light/20 bg-white/[0.05] p-6"
            >
              <p className="flex items-center gap-2 text-[14px] text-gold-light">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <rect x="3" y="5" width="18" height="16" rx="3" />
                  <path d="M8 3v4M16 3v4M3 10h18" />
                </svg>
                次回の開放日
              </p>
              {next ? (
                <>
                  <p className="font-display mt-1 text-[24px] font-medium text-white">
                    {formatJapaneseDate(next.date)}
                    <span className="block sm:inline sm:ml-3 font-sans text-[16px] text-white/75 tabular-nums whitespace-nowrap">
                      {config.openTime}〜{config.closeTime}
                    </span>
                  </p>
                  {nextSlots && nextSlots.length > 0 && (
                    <SlotKeys slots={nextSlots} closeTime={config.closeTime} tone="dark" className="mt-5" />
                  )}
                  <p className="mt-4 text-[15px] text-white">{STATUS_TEXT[next.status](next)}</p>
                  {next.status !== "open" && (
                    <p className="mt-1 text-[15px] leading-[1.8] text-white/75">
                      {nextBookable
                        ? `次に予約できる日は ${formatJapaneseDate(nextBookable.date)}（残り${nextBookable.freeMinutes}分）です`
                        : "現在ご予約いただける日がありません。開放日が追加され次第このページでお知らせします。"}
                    </p>
                  )}
                </>
              ) : (
                <p className="mt-1 text-[16px] leading-[1.8] text-white/75">
                  現在、開放予定日はありません。次回の日程が決まり次第このページでお知らせします。
                </p>
              )}
            </div>

            {/* 3. 行動につながるボタン(主と副の2つだけ) */}
            <div style={{ "--i": 4 } as React.CSSProperties} className="rise-in mt-8 flex flex-col sm:flex-row gap-3">
              <Link
                href="/reserve"
                className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-[10px] bg-gold px-6 text-base font-medium text-navy-dark transition-[background-color,transform] duration-150 hover:bg-gold-light active:scale-[0.98]"
              >
                {canReserveNow ? "空き枠を確認して予約する" : "開放日の一覧を見る"}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </Link>
              <Link
                href="/manage/lookup"
                className="inline-flex min-h-12 items-center justify-center rounded-[10px] border border-white/15 bg-white/[0.06] px-6 text-base font-medium text-white transition-colors duration-150 hover:bg-white/[0.12]"
              >
                予約の確認・変更・キャンセル
              </Link>
            </div>
          </div>

          <div style={{ "--i": 2 } as React.CSSProperties} className="rise-in flex flex-col items-center gap-8">
            <figure className="relative w-full rounded-[20px] border border-gold-light/20 bg-white/[0.04] p-2">
              <Image
                src="/piano-hero.jpg"
                alt={`${config.orgName}本社に設置されているヤマハ製グランドピアノ`}
                width={1344}
                height={1008}
                priority
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="block w-full h-auto rounded-xl"
              />
              {/* 真鍮の銘板のようなラベル */}
              <span className="absolute left-6 top-6 rounded-md bg-gold px-3 py-1 font-display text-[14px] font-medium text-navy-dark">
                YAMAHA グランドピアノ
              </span>
              <figcaption className="px-2 pt-3 pb-1 text-[13px] text-white/60">{config.venueName}</figcaption>
            </figure>
            <MiniKeyboard />
          </div>
        </div>
        {/* ヒーローの下端を鍵盤の並びで締める */}
        <KeyboardEdge className="absolute inset-x-0 bottom-0 block" />
      </section>

      {/* 開放情報 */}
      <section id="guide" className="scroll-mt-24 bg-cream px-4 sm:px-6 lg:px-16 pt-16 sm:pt-20">
        <dl className="mx-auto max-w-[1400px] grid sm:grid-cols-[1.4fr_1fr_1fr] rounded-2xl border border-navy/[0.08] bg-white mb-16 sm:mb-20 divide-y sm:divide-y-0 sm:divide-x divide-navy/[0.08]">
          <div className="p-6 sm:p-8">
            <dt className="flex items-center gap-2 text-[14px] text-gold-ink">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gold-soft">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <rect x="3" y="5" width="18" height="16" rx="3" />
                  <path d="M8 3v4M16 3v4M3 10h18" />
                </svg>
              </span>
              開放日
            </dt>
            <dd className="font-display mt-4 text-[28px] sm:text-[32px] font-medium leading-[1.3] text-navy">毎月 第1・第3金曜日</dd>
            <dd className="mt-2 text-[15px] text-muted leading-[1.8]">当日の状況により休止する場合があります</dd>
          </div>
          <div className="p-6 sm:p-8">
            <dt className="flex items-center gap-2 text-[14px] text-gold-ink">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gold-soft">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v5l3.5 2" />
                </svg>
              </span>
              時間
            </dt>
            <dd className="font-display mt-4 text-[24px] font-medium text-navy tabular-nums">
              {config.openTime}〜{config.closeTime}
            </dd>
            <dd className="mt-2 text-[15px] text-muted leading-[1.8]">
              {isFixedSlotMode()
                ? `1組${config.maxUsageMinutes}分・1日${maxGroupsPerDay()}組まで`
                : `1組あたり最大${config.maxUsageMinutes}分`}
            </dd>
          </div>
          <div className="p-6 sm:p-8">
            <dt className="flex items-center gap-2 text-[14px] text-gold-ink">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gold-soft">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M9 18V5l10-2v13" />
                  <circle cx="6.5" cy="18" r="2.5" />
                  <circle cx="16.5" cy="16" r="2.5" />
                </svg>
              </span>
              利用料金
            </dt>
            <dd className="font-display mt-4 text-[24px] font-medium text-navy">無料</dd>
            <dd className="mt-2 text-[15px] text-muted leading-[1.8]">事前のWeb予約が必要です</dd>
          </div>
        </dl>

        <div className="mx-auto max-w-[1400px] grid lg:grid-cols-2 items-start gap-12 lg:gap-16 pb-16 sm:pb-20 lg:pb-24">
          <div>
            <p className="text-[14px] text-gold-ink">はじめての方へ</p>
            <h2 className="font-display mt-2 text-[24px] sm:text-[28px] font-medium text-navy mb-8">ご利用の流れ</h2>
            <ol className="relative space-y-6">
              <span aria-hidden className="absolute left-5 top-5 bottom-5 w-px -translate-x-1/2 bg-gold" />
              {[
                "開放日の一覧から希望の日を選ぶ",
                `利用したい時間帯を選ぶ（1組最大${config.maxUsageMinutes}分）`,
                "お名前・連絡先を入力して予約を確定する",
                "当日は、受付でQRコード・予約番号をご提示いただくか、お名前をお伝えください",
              ].map((step, i) => (
                <li key={i} className="relative flex gap-4 items-start">
                  <span className="relative shrink-0 h-10 w-10 rounded-full bg-navy font-display text-[18px] font-medium text-gold-light flex items-center justify-center tabular-nums">
                    {i + 1}
                  </span>
                  <span className="pt-1.5 text-[16px] leading-[1.8] text-ink">{step}</span>
                </li>
              ))}
            </ol>
            <Link
              href="/reserve"
              className="mt-8 inline-flex min-h-12 items-center justify-center rounded-[10px] bg-teal-dark px-6 text-base font-medium text-white transition-[background-color,transform] duration-150 hover:bg-navy active:scale-[0.98]"
            >
              {canReserveNow ? "日付を選んで予約する" : "開放日の一覧を見る"}
            </Link>

            <VenueInfo className="mt-12" />
          </div>

          <Card className="border-navy/[0.08] shadow-none p-6 sm:p-8">
            <h2 className="font-display text-[22px] font-medium text-navy mb-4">ご利用にあたってのお願い</h2>
            <ul className="space-y-3 text-[15px] text-ink leading-[1.8]">
              <li className="flex gap-2.5">
                <span aria-hidden className="mt-[0.65em] h-2 w-2 shrink-0 rounded-full bg-gold" />
                近隣にお住まいの皆様へのご配慮をお願いいたします。予約時間内に終了し、17:00にはご利用中でも終了してください。
              </li>
              <li className="flex gap-2.5">
                <span aria-hidden className="mt-[0.65em] h-2 w-2 shrink-0 rounded-full bg-gold" />
                未成年の方がご利用の場合は、保護者の同意と当日の同伴が必要です。
              </li>
            </ul>
            <details className="mt-4 group">
              <summary className="cursor-pointer list-none inline-flex min-h-11 items-center gap-2 text-[15px] font-medium text-teal-dark">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                  className="transition-transform group-open:rotate-90"
                >
                  <path d="M9 6l6 6-6 6" />
                </svg>
                その他の注意事項をすべて見る
              </summary>
              <div className="mt-3 space-y-5">
                <div>
                  <p className="text-[14px] font-medium text-navy mb-2">演奏時のルール</p>
                  <ul className="space-y-3 text-[15px] text-ink leading-[1.8]">
                    <li className="flex gap-2.5">
                      <span aria-hidden className="mt-[0.65em] h-2 w-2 shrink-0 rounded-full bg-gold" />
                      予約時間内に終了し、速やかな入替えにご協力ください。
                    </li>
                    <li className="flex gap-2.5">
                      <span aria-hidden className="mt-[0.65em] h-2 w-2 shrink-0 rounded-full bg-gold" />
                      係員の案内・指示に従ってください。
                    </li>
                  </ul>
                </div>
                <div>
                  <p className="text-[14px] font-medium text-navy mb-2">撮影・SNSについて</p>
                  <ul className="space-y-3 text-[15px] text-ink leading-[1.8]">
                    <li className="flex gap-2.5">
                      <span aria-hidden className="mt-[0.65em] h-2 w-2 shrink-0 rounded-full bg-gold" />
                      他の利用者・社員を撮影する場合は、本人の同意が必要です。
                    </li>
                    <li className="flex gap-2.5">
                      <span aria-hidden className="mt-[0.65em] h-2 w-2 shrink-0 rounded-full bg-gold" />
                      ライブ配信はできませんが、動画撮影は可能です。
                    </li>
                    <li className="flex gap-2.5">
                      <span aria-hidden className="mt-[0.65em] h-2 w-2 shrink-0 rounded-full bg-gold" />
                      執務エリア・社員・防犯設備・社内情報が特定できる撮影・投稿は禁止です。
                    </li>
                  </ul>
                </div>
                <div>
                  <p className="text-[14px] font-medium text-navy mb-2">安全・設備について</p>
                  <ul className="space-y-3 text-[15px] text-ink leading-[1.8]">
                    <li className="flex gap-2.5">
                      <span aria-hidden className="mt-[0.65em] h-2 w-2 shrink-0 rounded-full bg-gold" />
                      複数の方が触れる鍵盤です。衛生面にご配慮のうえご利用ください。
                    </li>
                    <li className="flex gap-2.5">
                      <span aria-hidden className="mt-[0.65em] h-2 w-2 shrink-0 rounded-full bg-gold" />
                      異常・破損を発見した場合は使用せず、係員へお知らせください。
                    </li>
                    <li className="flex gap-2.5">
                      <span aria-hidden className="mt-[0.65em] h-2 w-2 shrink-0 rounded-full bg-gold" />
                      故意・過失による破損は、修繕費用をご負担いただく場合があります。
                    </li>
                    <li className="flex gap-2.5">
                      <span aria-hidden className="mt-[0.65em] h-2 w-2 shrink-0 rounded-full bg-gold" />
                      安全管理・防犯のため、防犯カメラで録画されています。
                    </li>
                    <li className="flex gap-2.5">
                      <span aria-hidden className="mt-[0.65em] h-2 w-2 shrink-0 rounded-full bg-gold" />
                      緊急時は演奏を中止し、係員の指示に従って避難してください。
                    </li>
                  </ul>
                </div>
                <div>
                  <p className="text-[14px] font-medium text-navy mb-2">禁止事項</p>
                  <ul className="space-y-3 text-[15px] text-ink leading-[1.8]">
                    <li className="flex gap-2.5">
                      <span aria-hidden className="mt-[0.65em] h-2 w-2 shrink-0 rounded-full bg-gold" />
                      投げ銭・物販・宣伝・勧誘等の営利・商業目的でのご利用
                    </li>
                    <li className="flex gap-2.5">
                      <span aria-hidden className="mt-[0.65em] h-2 w-2 shrink-0 rounded-full bg-gold" />
                      ピアノ周辺での飲食・飲酒・喫煙
                    </li>
                    <li className="flex gap-2.5">
                      <span aria-hidden className="mt-[0.65em] h-2 w-2 shrink-0 rounded-full bg-gold" />
                      大声での歌唱・発声など、通常業務に支障を与える音量での演奏
                    </li>
                    <li className="flex gap-2.5">
                      <span aria-hidden className="mt-[0.65em] h-2 w-2 shrink-0 rounded-full bg-gold" />
                      危険・威圧的な行為、執務エリアへの立ち入り
                    </li>
                  </ul>
                </div>
                <div>
                  <p className="text-[14px] font-medium text-navy mb-2">そのほか</p>
                  <ul className="space-y-3 text-[15px] text-ink leading-[1.8]">
                    <li className="flex gap-2.5">
                      <span aria-hidden className="mt-[0.65em] h-2 w-2 shrink-0 rounded-full bg-gold" />
                      当日、無断でのご欠席が続いた場合、以降のご予約を一定期間制限させていただく場合があります。
                    </li>
                    <li className="flex gap-2.5">
                      <span aria-hidden className="mt-[0.65em] h-2 w-2 shrink-0 rounded-full bg-gold" />
                      ピアノの破損や利用中の事故等に関する責任範囲は「利用規約」をご確認ください。
                    </li>
                  </ul>
                </div>
              </div>
            </details>
            <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-[15px]">
              <Link href="/terms" className="inline-flex min-h-11 items-center font-medium text-teal-dark hover:underline">
                利用規約を読む
              </Link>
              <Link href="/privacy" className="inline-flex min-h-11 items-center font-medium text-teal-dark hover:underline">
                プライバシーポリシー
              </Link>
            </div>
          </Card>
        </div>

      </section>

      {/* はじめての方向けのFAQ */}
      <section className="px-4 sm:px-6 lg:px-16 pt-16 sm:pt-20">
        <div className="mx-auto max-w-[900px] pb-16 sm:pb-20 lg:pb-24">
          <p className="text-[14px] text-gold-ink">ご利用の前に</p>
          <h2 className="font-display mt-2 text-[24px] sm:text-[28px] font-medium text-navy mb-2">よくあるご質問</h2>
          <p className="mb-8 text-[15px] text-muted leading-[1.8]">はじめてご利用になる方からよくいただくご質問をまとめました。</p>
          <div className="divide-y divide-navy/[0.09] rounded-2xl border border-navy/[0.09] bg-white">
            {FAQ.map(({ q, a }) => (
              <details key={q} className="group px-5 sm:px-8 transition-colors hover:bg-cream/60 open:bg-cream/60">
                <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 py-4 text-[16px] font-medium text-navy">
                  {q}
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                    className="shrink-0 text-muted transition-transform group-open:rotate-90"
                  >
                    <path d="M9 6l6 6-6 6" />
                  </svg>
                </summary>
                <p className="pb-5 text-[15px] leading-[1.9] text-ink">{a}</p>
              </details>
            ))}
          </div>
          <p className="mt-6 text-[15px] leading-[1.8] text-muted">
            ここに掲載のないご質問は
            <a href={`mailto:${config.supportEmail}`} className="font-medium text-teal-dark underline">
              {config.supportEmail}
            </a>
            {config.supportPhone && `（電話: ${config.supportPhone}）`}
            までお気軽にお問い合わせください。
          </p>
        </div>
      </section>
    </>
  );
}
