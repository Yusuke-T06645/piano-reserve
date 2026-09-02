import { Container, SectionTitle, Card } from "@/components/ui";
import { config } from "@/lib/config";

export const metadata = { title: `プライバシーポリシー | ${config.siteShortName}` };

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-lg font-bold text-navy mb-2">{title}</h2>
      <div className="space-y-2 text-sm leading-relaxed text-ink">{children}</div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <Container className="py-10 sm:py-14 max-w-3xl">
      <SectionTitle title="プライバシーポリシー" description={`最終改定日: 2026年9月2日（${config.orgName}）`} />
      <Card>
        <p className="text-sm text-muted mb-8">
          {config.orgName}（以下「当社」といいます）は、「{config.siteName}」（以下「本サービス」といいます）における
          個人情報の取扱いについて、以下のとおりプライバシーポリシー（以下「本ポリシー」といいます）を定めます。
        </p>

        <Section title="1. 取得する情報">
          <p>本サービスのご予約にあたり、当社は以下の情報を取得します。</p>
          <p>・お名前、メールアドレス、電話番号（任意）</p>
          <p>・未成年の方がご利用の場合、保護者のお名前</p>
          <p>・ご予約日時、備考欄にご入力いただいた内容</p>
          <p>取得する情報は、本サービスの提供に必要な最小限の項目に限定しています。ご住所、お支払い情報等は取得しません。</p>
        </Section>

        <Section title="2. 利用目的">
          <p>取得した情報は、以下の目的の範囲内で利用します。</p>
          <p>・ご予約の管理、当日の来場確認（QRコードによるチェックイン）のため</p>
          <p>・予約確認・リマインド・キャンセル等に関するご連絡のため</p>
          <p>・無断キャンセルへの対応など、公平な運用のための記録として</p>
          <p>・本サービスの改善のための統計的な分析のため（個人を特定しない形に加工した上で利用します）</p>
        </Section>

        <Section title="3. 第三者提供">
          <p>
            当社は、法令に基づく場合を除き、あらかじめご本人の同意を得ることなく個人情報を第三者に提供することはありません。
          </p>
        </Section>

        <Section title="4. 業務委託先（クラウドサービスの利用）">
          <p>
            当社は、本サービスの運用にあたり、以下のようなクラウドサービス事業者に個人情報の取扱いを委託する場合があります。
            委託先とは適切な契約を締結し、安全管理措置を求めます。
          </p>
          <p>・予約情報の管理: Google スプレッドシート等（Google LLC）</p>
          <p>・メール配信: Resend等のメール配信サービス</p>
          <p>・サイトのホスティング: Vercel等のクラウドホスティングサービス</p>
        </Section>

        <Section title="5. 保管期間">
          <p>
            取得した個人情報は、ご利用日から{config.piiRetentionMonths}ヶ月を経過した時点で、お名前・連絡先等の特定の個人を識別できる情報を削除又は匿名化します。
          </p>
        </Section>

        <Section title="6. 安全管理措置">
          <p>当社は、個人情報への不正アクセス、漏えい、滅失又はき損の防止のため、通信の暗号化（SSL/TLS）、管理画面へのアクセス制限等の合理的な安全管理措置を講じます。</p>
        </Section>

        <Section title="7. ご本人からの開示等の請求">
          <p>
            ご本人から、保有する個人情報の開示、訂正、削除等のご請求があった場合は、法令に従い、合理的な範囲で速やかに対応します。
            ご請求は {config.supportEmail} までご連絡ください。
          </p>
        </Section>

        <Section title="8. Cookie等の利用">
          <p>
            管理者向け画面ではログイン状態を維持するためのCookieを利用します。利用者向け予約画面では、広告目的でのCookie等は使用していません。
          </p>
        </Section>

        <Section title="9. 本ポリシーの改定">
          <p>当社は、必要に応じて本ポリシーを改定することがあります。改定後の内容は、本ページに掲載した時点より効力を生じるものとします。</p>
        </Section>

        <Section title="10. お問い合わせ窓口">
          <p>本ポリシーに関するお問い合わせは、{config.supportEmail}（{config.orgName}）までご連絡ください。</p>
        </Section>
      </Card>
    </Container>
  );
}
