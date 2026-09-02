import Link from "next/link";
import { Container, Card, Badge, Button } from "@/components/ui";
import { PianoIllustration } from "@/components/PianoIllustration";
import { config, generateDaySlots } from "@/lib/config";

export default function Home() {
  const slots = generateDaySlots();

  return (
    <>
      {/* ヒーローセクション */}
      <section className="bg-navy text-white overflow-hidden relative">
        <div className="absolute inset-0 opacity-10 pointer-events-none" aria-hidden>
          <div className="absolute -right-20 -top-20 h-96 w-96 rounded-full bg-gold blur-3xl" />
          <div className="absolute -left-10 bottom-0 h-72 w-72 rounded-full bg-teal blur-3xl" />
        </div>
        <Container className="relative py-16 sm:py-24 grid sm:grid-cols-2 gap-10 items-center">
          <div>
            <Badge tone="warning">{config.orgName} 地域開放事業</Badge>
            <h1 className="mt-4 text-3xl sm:text-4xl font-bold leading-tight">
              グランドピアノを、
              <br />
              地域のみなさまへ。
            </h1>
            <p className="mt-4 text-white/80 leading-relaxed max-w-md">
              {config.orgName}が所有するグランドピアノを一般開放します。毎月第1・第3金曜日、16:00〜17:00の間、10分単位でどなたでもご予約いただけます。
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/reserve">
                <Button size="lg" variant="primary">
                  空き状況を見て予約する
                </Button>
              </Link>
              <a href="#guide">
                <Button size="lg" variant="outline" className="!text-white !border-white hover:!bg-white hover:!text-navy">
                  ご利用の流れを見る
                </Button>
              </a>
            </div>
          </div>
          <PianoIllustration className="w-full max-w-md mx-auto drop-shadow-2xl" />
        </Container>
      </section>

      {/* 開放情報 */}
      <section id="guide" className="py-14 sm:py-20 scroll-mt-16">
        <Container>
          <div className="grid sm:grid-cols-3 gap-5 mb-14">
            <Card>
              <p className="text-xs font-semibold text-gold tracking-widest uppercase">開放日</p>
              <p className="mt-2 text-xl font-bold text-navy">毎月 第1・第3金曜日</p>
              <p className="mt-1 text-sm text-muted">開放日は当日の状況により休止する場合があります</p>
            </Card>
            <Card>
              <p className="text-xs font-semibold text-gold tracking-widest uppercase">時間</p>
              <p className="mt-2 text-xl font-bold text-navy">
                {config.openTime} 〜 {config.closeTime}
              </p>
              <p className="mt-1 text-sm text-muted">{config.slotMinutes}分単位・{slots.length}枠でご予約いただけます</p>
            </Card>
            <Card>
              <p className="text-xs font-semibold text-gold tracking-widest uppercase">利用料金</p>
              <p className="mt-2 text-xl font-bold text-navy">無料</p>
              <p className="mt-1 text-sm text-muted">事前のWeb予約が必要です</p>
            </Card>
          </div>

          <div className="grid sm:grid-cols-2 gap-10">
            <div>
              <h2 className="text-xl font-bold text-navy mb-4">ご利用の流れ</h2>
              <ol className="space-y-3">
                {[
                  "カレンダーから空いている日時を選ぶ",
                  "お名前・連絡先を入力して予約する",
                  "確認メールに記載のQRコードを保存する",
                  "当日、受付でQRコードを提示する",
                ].map((step, i) => (
                  <li key={i} className="flex gap-3 items-start">
                    <span className="shrink-0 h-7 w-7 rounded-full bg-teal text-white text-sm font-bold flex items-center justify-center">
                      {i + 1}
                    </span>
                    <span className="pt-0.5 text-ink">{step}</span>
                  </li>
                ))}
              </ol>
              <Link href="/reserve" className="inline-block mt-6">
                <Button variant="secondary">今すぐ予約する</Button>
              </Link>
            </div>

            <Card className="bg-cream border-none">
              <h2 className="text-xl font-bold text-navy mb-3">ご利用にあたってのお願い</h2>
              <ul className="space-y-2.5 text-sm text-ink leading-relaxed">
                <li>・近隣にお住まいの皆様へのご配慮をお願いいたします（演奏時間の厳守、静かな出入り）。</li>
                <li>・複数の方が触れる鍵盤です。衛生面にご配慮のうえご利用ください。</li>
                <li>・未成年の方がご利用の場合は、保護者の同意と当日の同伴が必要です。</li>
                <li>・当日、無断でのご欠席が続いた場合、以降のご予約を一定期間制限させていただく場合があります。</li>
                <li>・ピアノの破損や利用中の事故等に関する責任範囲は「利用規約」をご確認ください。</li>
              </ul>
              <div className="mt-4 flex gap-4 text-sm">
                <Link href="/terms" className="text-teal-dark font-semibold hover:underline">
                  利用規約を読む
                </Link>
                <Link href="/privacy" className="text-teal-dark font-semibold hover:underline">
                  プライバシーポリシー
                </Link>
              </div>
            </Card>
          </div>
        </Container>
      </section>
    </>
  );
}
