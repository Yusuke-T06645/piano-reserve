import Link from "next/link";
import { config } from "@/lib/config";

export function Header() {
  return (
    <header className="sticky top-0 z-40 h-16 sm:h-[72px] flex items-center justify-between px-4 sm:px-6 lg:px-16 bg-white/95 backdrop-blur-sm border-b border-navy/[0.08]">
      <Link href="/" className="flex min-h-11 items-center gap-3 focus-visible:outline-offset-4">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-navy text-gold-light">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M9 18V5l10-2v13" />
            <circle cx="6.5" cy="18" r="2.5" />
            <circle cx="16.5" cy="16" r="2.5" />
          </svg>
        </span>
        <span className="flex flex-col leading-tight">
          <span className="font-display text-[18px] sm:text-[20px] font-medium text-navy">{config.siteShortName}</span>
          <span className="hidden md:block text-[13px] text-muted">{config.siteName}</span>
        </span>
      </Link>
      <nav aria-label="メインナビゲーション" className="flex items-center gap-1">
        <Link href="/terms" className="hidden md:inline-flex min-h-11 items-center rounded-lg px-4 text-[15px] text-navy transition-colors hover:bg-cream">
          利用規約
        </Link>
        <Link href="/privacy" className="hidden md:inline-flex min-h-11 items-center rounded-lg px-4 text-[15px] text-navy transition-colors hover:bg-cream">
          プライバシー
        </Link>
        <Link
          href="/reserve"
          className="ml-2 inline-flex min-h-11 items-center rounded-[10px] bg-teal-dark px-5 text-[15px] font-medium text-white transition-colors hover:bg-navy"
        >
          予約する
        </Link>
      </nav>
    </header>
  );
}
