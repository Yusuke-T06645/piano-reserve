import { Container, SectionTitle, Card } from "@/components/ui";
import { config } from "@/lib/config";

export const metadata = { title: `利用規約 | ${config.siteShortName}` };

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-lg font-bold text-navy mb-2">{title}</h2>
      <div className="space-y-2 text-sm leading-relaxed text-ink">{children}</div>
    </section>
  );
}

export default function TermsPage() {
  return (
    <Container className="py-10 sm:py-14 max-w-3xl">
      <SectionTitle title="利用規約" description={`最終改定日: 2026年9月2日（${config.orgName}）`} />
      <Card>
        <p className="text-sm text-muted mb-8">
          本規約は、{config.orgName}（以下「当社」といいます）が提供する「{config.siteName}」（以下「本サービス」といいます）の
          グランドピアノ利用に関するご案内です。本サービスをご利用いただく場合、本規約に同意いただいたものとします。
        </p>

        <Section title="第1条（利用対象・予約）">
          <p>1. 本サービスは、当社が所有するグランドピアノを地域の方々に無料で開放するものです。</p>
          <p>2. ご利用には、事前のWeb予約が必要です。予約は、毎月第1・第3金曜日 {config.openTime}〜{config.closeTime} の間で、{config.granularityMinutes}分単位・1回最大{config.maxUsageMinutes}分の範囲で受け付けます。</p>
          <p>3. お一人様、1ヶ月あたり{config.monthlyBookingLimitPerEmail}回までのご利用とさせていただきます。</p>
          <p>4. 未成年の方がご利用になる場合は、保護者の同意を得たうえで、当日は保護者が同伴するものとします。</p>
        </Section>

        <Section title="第2条（当日のご利用）">
          <p>1. 当日は、予約完了時に発行されるQRコードを受付にてご提示ください。</p>
          <p>2. ご利用時間を超過しての演奏はご遠慮いただきます。次にご利用のお客様がいらっしゃる場合があります。</p>
          <p>3. 近隣にお住まいの皆様へのご配慮をお願いいたします（演奏時間の厳守、来退場時の静粛の保持等）。</p>
          <p>4. 複数の方が触れる鍵盤であるため、衛生面に配慮のうえご利用ください。当社は可能な範囲で鍵盤の消毒等の衛生管理を行いますが、ご利用者様ご自身での手指の消毒等にもご協力をお願いいたします。</p>
        </Section>

        <Section title="第3条（キャンセル・変更、無断キャンセルの取扱い）">
          <p>1. ご予約のキャンセル・日時変更は、予約確認メールに記載のページからお手続きいただけます。ご利用{config.selfServiceChangeDeadlineHours}時間前を過ぎた変更については、{config.supportEmail}まで直接ご連絡ください。</p>
          <p>2. ご都合が悪くなった場合は、他の方がご利用いただける可能性があるため、できるだけ早めのキャンセルにご協力をお願いいたします。</p>
          <p>
            3. 事前のご連絡なく当日ご来場されなかった場合（無断キャンセル）が
            {config.noShowRollingWindowMonths}ヶ月以内に{config.noShowStrikeLimit}回に達した場合、以降{config.noShowPenaltyMonths}ヶ月間、新規のご予約をお断りする場合があります。
          </p>
        </Section>

        <Section title="第4条（免責事項）">
          <p>1. 当社は、本サービスのご利用に関して、次の各号に定める損害については、当社に故意又は重大な過失がある場合を除き、責任を負わないものとします。</p>
          <p>　(1) ピアノの通常の使用の範囲を超えた操作・取り扱いによりピアノが損傷した場合の損害</p>
          <p>　(2) ご利用中の事故・怪我等により利用者様または第三者に生じた損害</p>
          <p>　(3) 天災その他不可抗力による開放日の休止・変更により生じた損害</p>
          <p>2. 利用者様の故意又は過失によりピアノその他当社の設備を破損させた場合、当社は利用者様に対して修理費用等の損害賠償を請求できるものとします。</p>
          <p>3. 本条の内容は、公開前に法務担当者・弁護士等による確認を経たうえで確定させることを推奨します。</p>
        </Section>

        <Section title="第5条（個人情報の取扱い）">
          <p>
            ご予約の際にご提供いただく個人情報は、当社の
            <a href="/privacy" className="text-teal-dark underline">
              プライバシーポリシー
            </a>
            に従い適切に取り扱います。
          </p>
        </Section>

        <Section title="第6条（本規約の変更）">
          <p>当社は、必要と判断した場合には、利用者様への事前の通知なく本規約を変更できるものとします。変更後の規約は、本ページに掲載した時点より効力を生じるものとします。</p>
        </Section>

        <Section title="第7条（お問い合わせ）">
          <p>
            本サービスに関するお問い合わせは、{config.supportEmail} までご連絡ください。
          </p>
        </Section>
      </Card>
    </Container>
  );
}
