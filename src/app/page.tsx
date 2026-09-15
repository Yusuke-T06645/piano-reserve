import Link from "next/link";
import Image from "next/image";
import { Card } from "@/components/ui";
import { VenueInfo } from "@/components/VenueInfo";
import { config } from "@/lib/config";
import { listDaySummaries, type DaySummary } from "@/lib/availability";
import { formatJapaneseDate } from "@/lib/dates";

export const dynamic = "force-dynamic";

/** 次回の開放日と、その日が予約できない場合に次に予約できる日を求める */
async function getOpenDayStatus(): Promise<{ next: DaySummary | null; nextBookable: DaySummary | null }> {
  const summaries = await listDaySummaries();
  const next = summaries[0] ?? null;
  const nextBookable = summaries.find((d) => d.status === "open") ?? null;
  return { next, nextBookable };
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
        <Link href="/manage/lookup" className="font-bold text-teal-dark underline">
          予約の確認・変更・キャンセル
        </Link>
        ）から、ご利用の{config.selfServiceChangeDeadlineHours}時間前まで手続きできます。締切を過ぎた場合や当日に遅れる場合は、
        <a href={`mailto:${config.supportEmail}`} className="font-bold text-teal-dark underline">
          {config.supportEmail}
        </a>
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
  const { next, nextBookable } = await getOpenDayStatus();
  const canReserveNow = nextBookable !== null;

  return (
    <>
      {/* ヒーローセクション */}
      <section className="relative overflow-hidden bg-linear-to-br from-navy-dark via-navy to-teal-dark px-4 sm:px-6 lg:px-16 pt-12 sm:pt-16 lg:pt-20 pb-16 sm:pb-20 lg:pb-24">
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

        <div className="relative mx-auto max-w-[1400px] grid lg:grid-cols-2 gap-10 lg:gap-14 items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-gold-light/15 border border-gold-light/35 px-4 py-2 text-[13px] font-bold tracking-wide text-gold-light">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M9 18V5l10-2v13" />
                <circle cx="6.5" cy="18" r="2.5" />
                <circle cx="16.5" cy="16" r="2.5" />
              </svg>
              {config.orgName} 地域開放事業
            </span>

            {/* 1. まず「何を開放しているか」を伝える */}
            <h1 className="font-display mt-5 text-[30px] sm:text-[44px] lg:text-[52px] font-bold leading-[1.35] sm:leading-[1.4] text-white tracking-wide">
              グランドピアノを、
              <br />
              地域のみなさまへ。
            </h1>
            <p className="mt-4 max-w-md text-[16px] sm:text-[17px] leading-[1.9] text-white/85">
              {config.orgName}が所有するグランドピアノを、地域のみなさまに開放しています。
              <span className="hidden sm:inline">
                毎月第1・第3金曜日の{config.openTime}〜{config.closeTime}
                の間で、ご希望の時間帯を選んでご予約いただけます。
              </span>
            </p>

            {/* 2. 次回の開放日・時間・空き状況(実際の予約データに連動) */}
            <div className="mt-6 rounded-2xl border border-white/20 bg-white/12 p-5 backdrop-blur-sm">
              <p className="text-[13px] font-bold tracking-widest text-gold-light uppercase">次回の開放日</p>
              {next ? (
                <>
                  <p className="font-display mt-1.5 text-[20px] sm:text-[22px] font-bold text-white">
                    {formatJapaneseDate(next.date)}
                    <span className="ml-2 text-[16px] font-semibold text-white/85">
                      {config.openTime}〜{config.closeTime}
                    </span>
                  </p>
                  <p className="mt-2.5 flex items-center gap-2 text-[16px] font-bold text-gold-light">
                    <span
                      aria-hidden
                      className={
                        next.status === "open"
                          ? "h-2.5 w-2.5 shrink-0 rounded-full bg-gold-light"
                          : "h-2.5 w-2.5 shrink-0 rounded-full border-2 border-gold-light"
                      }
                    />
                    {STATUS_TEXT[next.status](next)}
                  </p>
                  {next.status !== "open" && (
                    <p className="mt-2 text-[15px] leading-[1.8] text-white/85">
                      {nextBookable
                        ? `次に予約できる日は ${formatJapaneseDate(nextBookable.date)}（残り${nextBookable.freeMinutes}分）です。`
                        : "現在ご予約いただける日がありません。開放日が追加され次第このページでお知らせします。"}
                    </p>
                  )}
                </>
              ) : (
                <p className="mt-1.5 text-[16px] leading-[1.8] text-white/85">
                  現在、開放予定日はありません。次回の日程が決まり次第このページでお知らせします。
                </p>
              )}
            </div>

            {/* 3. 料金・予約方法・利用時間 */}
            <ul className="mt-5 flex flex-wrap gap-2">
              {["無料", "事前予約制", `1組最大${config.maxUsageMinutes}分`, "毎月第1・第3金曜"].map((item) => (
                <li
                  key={item}
                  className="rounded-full border border-white/25 bg-white/10 px-3.5 py-1.5 text-[14px] font-bold text-white"
                >
                  {item}
                </li>
              ))}
            </ul>

            {/* 4. 行動につながるボタン */}
            <div className="mt-7 flex flex-col sm:flex-row flex-wrap gap-3">
              <Link
                href="/reserve"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-linear-to-br from-gold-light to-gold px-7 py-4 text-base font-bold text-navy-dark shadow-[0_16px_30px_-10px_rgba(217,178,126,0.5)] hover:brightness-105"
              >
                {canReserveNow ? "空き枠を確認して予約する" : "開放日の一覧を見る"}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </Link>
              <Link
                href="/manage/lookup"
                className="inline-flex min-h-12 items-center justify-center rounded-full border-[1.5px] border-white/60 px-7 py-4 text-base font-bold text-white hover:bg-white/10"
              >
                予約の確認・変更・キャンセル
              </Link>
            </div>
            <p className="mt-4">
              <a
                href="#guide"
                className="inline-flex min-h-11 items-center text-[15px] font-bold text-white underline underline-offset-4 hover:text-gold-light"
              >
                ご利用の流れ・会場のご案内を見る
              </a>
            </p>
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
              <div className="absolute inset-x-0 bottom-0 px-5 py-4 bg-linear-to-t from-navy-dark/90 via-navy-dark/40 to-transparent">
                <p className="text-white text-[13px] font-bold tracking-wide">
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
      <section id="guide" className="scroll-mt-24 px-4 sm:px-6 lg:px-16 pt-16 sm:pt-[88px]">
        <div className="mx-auto max-w-[1400px] grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-16 sm:mb-[88px]">
          <Card className="p-7">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gold-soft text-gold-ink">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <rect x="3" y="5" width="18" height="16" rx="3" />
                <path d="M8 3v4M16 3v4M3 10h18" />
              </svg>
            </div>
            <p className="mt-5 text-[13px] font-bold tracking-widest text-gold-ink uppercase">開放日</p>
            <p className="font-display mt-2 text-2xl font-bold text-navy">毎月 第1・第3金曜日</p>
            <p className="mt-2.5 text-[15px] text-muted leading-[1.8]">開放日は当日の状況により休止する場合があります</p>
          </Card>
          <Card className="p-7">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-soft text-teal-dark">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3.5 2" />
              </svg>
            </div>
            <p className="mt-5 text-[13px] font-bold tracking-widest text-teal-dark uppercase">時間</p>
            <p className="font-display mt-2 text-2xl font-bold text-navy">
              {config.openTime} 〜 {config.closeTime}
            </p>
            <p className="mt-2.5 text-[15px] text-muted leading-[1.8]">
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
            <p className="mt-5 text-[13px] font-bold tracking-widest text-navy uppercase">利用料金</p>
            <p className="font-display mt-2 text-2xl font-bold text-navy">無料</p>
            <p className="mt-2.5 text-[15px] text-muted leading-[1.8]">事前のWeb予約が必要です</p>
          </Card>
        </div>

        <div className="mx-auto max-w-[1400px] grid lg:grid-cols-2 gap-10 lg:gap-16 pb-16 sm:pb-20 lg:pb-24">
          <div>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-navy mb-8">ご利用の流れ</h2>
            <ol className="space-y-6">
              {[
                "開放日の一覧から希望の日を選ぶ",
                "利用したい時間帯を選ぶ（1組最大60分）",
                "お名前・連絡先を入力して予約を確定する",
                "当日は、受付でQRコード・予約番号をご提示いただくか、お名前をお伝えください。",
              ].map((step, i) => (
                <li key={i} className="flex gap-4 items-start">
                  <span className="shrink-0 h-10 w-10 rounded-full bg-teal text-white text-[16px] font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                  <span className="pt-1.5 text-[16px] leading-[1.8] text-ink">{step}</span>
                </li>
              ))}
            </ol>
            <Link
              href="/reserve"
              className="mt-8 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-linear-to-br from-navy to-navy-dark px-7 py-4 text-base font-bold text-white shadow-[0_12px_24px_-12px_rgba(18,35,46,0.5)] hover:brightness-110"
            >
              {canReserveNow ? "今すぐ予約する" : "開放日の一覧を見る"}
            </Link>

            <VenueInfo className="mt-12" />
          </div>

          <Card className="bg-cream border-none p-7 sm:p-9">
            <h2 className="font-display text-lg sm:text-[22px] font-bold text-navy mb-4">ご利用にあたってのお願い</h2>
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
              <summary className="cursor-pointer list-none inline-flex min-h-11 items-center gap-1.5 text-[15px] font-bold text-teal-dark">
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
              <div className="mt-3 space-y-5">
                <div>
                  <p className="text-[14px] font-bold text-navy mb-2">演奏時のルール</p>
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
                  <p className="text-[14px] font-bold text-navy mb-2">撮影・SNSについて</p>
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
                  <p className="text-[14px] font-bold text-navy mb-2">安全・設備について</p>
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
                  <p className="text-[14px] font-bold text-navy mb-2">禁止事項</p>
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
                  <p className="text-[14px] font-bold text-navy mb-2">そのほか</p>
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
              <Link href="/terms" className="inline-flex min-h-11 items-center font-bold text-teal-dark hover:underline">
                利用規約を読む
              </Link>
              <Link href="/privacy" className="inline-flex min-h-11 items-center font-bold text-teal-dark hover:underline">
                プライバシーポリシー
              </Link>
            </div>
          </Card>
        </div>

        {/* はじめての方向けのFAQ */}
        <div className="mx-auto max-w-[900px] pb-16 sm:pb-20 lg:pb-24">
          <h2 className="font-display text-xl sm:text-2xl font-bold text-navy mb-2">よくあるご質問</h2>
          <p className="mb-7 text-[15px] text-muted leading-[1.8]">はじめてご利用になる方からよくいただくご質問をまとめました。</p>
          <div className="divide-y divide-navy/[0.09] rounded-2xl border border-navy/[0.09] bg-white">
            {FAQ.map(({ q, a }) => (
              <details key={q} className="group px-5 sm:px-7">
                <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 py-4 text-[16px] font-bold text-navy">
                  {q}
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                    className="shrink-0 text-teal-dark transition-transform group-open:rotate-90"
                  >
                    <path d="M9 6l6 6-6 6" />
                  </svg>
                </summary>
                <p className="pb-5 text-[15px] leading-[1.9] text-ink">{a}</p>
              </details>
            ))}
          </div>
          <p className="mt-5 text-[15px] leading-[1.8] text-muted">
            ここに掲載のないご質問は
            <a href={`mailto:${config.supportEmail}`} className="font-bold text-teal-dark underline">
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
