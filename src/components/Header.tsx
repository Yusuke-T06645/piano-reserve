import Link from "next/link";
import { config } from "@/lib/config";
import { PianoKeyDivider } from "@/components/ui";

export function Header() {
  return (
    <div className="sticky top-0 z-40">
      <header className="h-[72px] sm:h-[88px] flex items-center justify-between px-4 sm:px-16 bg-white border-b border-navy/[0.09]">
        <Link href="/" className="flex items-center gap-3 focus-visible:outline-offset-4">
          <span className="flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-full bg-navy text-gold-light">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M9 18V5l10-2v13" />
              <circle cx="6.5" cy="18" r="2.5" />
              <circle cx="16.5" cy="16" r="2.5" />
            </svg>
          </span>
          <span className="flex flex-col leading-tight">
            <span className="font-display text-lg sm:text-xl font-bold text-navy tracking-wide">
              {config.siteShortName}
            </span>
            <span className="hidden sm:block text-[11px] text-muted tracking-wide">{config.siteName}</span>
          </span>
        </Link>
        <nav aria-label="メインナビゲーション" className="flex items-center gap-1 sm:gap-1.5">
          <Link href="/terms" className="hidden sm:inline-block rounded-full px-4 py-2.5 text-[13px] font-medium text-navy hover:bg-cream">
            利用規約
          </Link>
          <Link href="/privacy" className="hidden sm:inline-block rounded-full px-4 py-2.5 text-[13px] font-medium text-navy hover:bg-cream">
            プライバシー
          </Link>
          <Link
            href="/reserve"
            className="ml-1 sm:ml-2 rounded-full px-4 py-2.5 sm:px-6 sm:py-[11px] text-[13px] font-bold text-white bg-linear-to-br from-teal to-teal-dark shadow-[0_8px_18px_-8px_rgba(31,85,96,0.5)] hover:brightness-105 transition-all"
          >
            予約する
          </Link>
        </nav>
      </header>
      <PianoKeyDivider />
    </div>
  );
}
