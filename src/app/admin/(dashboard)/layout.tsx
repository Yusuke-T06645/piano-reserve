import Link from "next/link";
import { cookies } from "next/headers";
import { ADMIN_COOKIE_NAME, verifyAdminSessionToken } from "@/lib/auth";
import { LogoutButton } from "./LogoutButton";
import { AdminNav } from "./AdminNav";

async function getAdminEmail(): Promise<string | null> {
  const store = await cookies();
  const token = store.get(ADMIN_COOKIE_NAME)?.value;
  if (!token) return null;
  const session = await verifyAdminSessionToken(token);
  return session?.email ?? null;
}

export default async function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const email = await getAdminEmail();

  return (
    <div className="min-h-full flex bg-cream">
      <aside className="w-[248px] shrink-0 flex flex-col bg-linear-to-br from-navy-dark via-navy to-teal-dark p-5">
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

      <main className="flex-1 px-6 sm:px-12 py-10 sm:py-11 min-w-0">{children}</main>
    </div>
  );
}
