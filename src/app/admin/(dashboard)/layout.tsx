import Link from "next/link";
import { cookies } from "next/headers";
import { ADMIN_COOKIE_NAME, verifyAdminSessionToken } from "@/lib/auth";
import { Alert } from "@/components/ui";
import { LogoutButton } from "./LogoutButton";
import { AdminNav } from "./AdminNav";

async function getAdminEmail(): Promise<string | null> {
  const store = await cookies();
  const token = store.get(ADMIN_COOKIE_NAME)?.value;
  if (!token) return null;
  const session = await verifyAdminSessionToken(token);
  return session?.email ?? null;
}

/**
 * RESEND_API_KEY 未設定時はメールが実送信されず(コンソール/一時ファイル出力のみ)、
 * 利用者・管理者ともにメールが一切届かない状態になる。気づきにくい設定漏れのため、
 * 管理画面に常時警告を出す(docs/DEPLOYMENT.md の「2. メール送信(Resend)の設定」参照)。
 */
function getEmailConfigWarning(): string | null {
  if (!process.env.RESEND_API_KEY) {
    return "メール送信が未設定です（RESEND_API_KEY が未設定）。予約確認・リマインダー等のメールは実際には送信されていません。Vercelの環境変数に RESEND_API_KEY / MAIL_FROM を設定し、再デプロイしてください。";
  }
  if (!process.env.ADMIN_NOTIFY_EMAIL) {
    return "管理者への新規予約・キャンセル通知の送信先（ADMIN_NOTIFY_EMAIL）が未設定です。Vercelの環境変数に設定してください。";
  }
  return null;
}

export default async function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const email = await getAdminEmail();
  const emailConfigWarning = getEmailConfigWarning();

  return (
    <div className="min-h-full flex flex-col lg:flex-row bg-cream">
      {/* モバイル・タブレット用の上部ヘッダー(横幅が狭い端末ではサイドバーを常時表示せず、
          代わりにこちらを表示する。QRチェックインページをスマホで使えるようにするための対応) */}
      <div className="lg:hidden bg-linear-to-br from-navy-dark via-navy to-teal-dark">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <Link href="/" className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gold text-navy-dark">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M9 18V5l10-2v13" />
                <circle cx="6.5" cy="18" r="2.5" />
                <circle cx="16.5" cy="16" r="2.5" />
              </svg>
            </span>
            <span className="truncate text-[13.5px] font-bold text-white">ピアノひろば 管理画面</span>
          </Link>
          <LogoutButton />
        </div>
        <AdminNav variant="mobile" />
      </div>

      <aside className="hidden lg:flex w-[248px] shrink-0 flex-col bg-linear-to-br from-navy-dark via-navy to-teal-dark p-5">
        <Link href="/" className="flex items-center gap-3 px-1.5 mb-9">
          <span className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full bg-gold text-navy-dark">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M9 18V5l10-2v13" />
              <circle cx="6.5" cy="18" r="2.5" />
              <circle cx="16.5" cy="16" r="2.5" />
            </svg>
          </span>
          <span className="leading-tight">
            <span className="block font-display text-[15px] font-bold text-white">ピアノひろば</span>
            <span className="block mt-0.5 text-[10.5px] text-white/50">管理画面</span>
          </span>
        </Link>

        <AdminNav />

        <div className="mt-auto pt-5 border-t border-white/10">
          {email && (
            <div className="flex items-center gap-2.5 px-3.5 py-2.5 text-[12.5px] text-white/50">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="shrink-0">
                <circle cx="12" cy="8" r="4" />
                <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
              </svg>
              <span className="truncate">{email}</span>
            </div>
          )}
          <div className="px-3.5 py-2.5">
            <LogoutButton />
          </div>
        </div>
      </aside>

      <main className="flex-1 px-4 sm:px-6 lg:px-12 py-6 sm:py-10 lg:py-11 min-w-0">
        {emailConfigWarning && (
          <div className="mb-6">
            <Alert tone="danger" title="メール送信の設定を確認してください">
              {emailConfigWarning}
            </Alert>
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
