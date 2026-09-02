import Link from "next/link";
import { config } from "@/lib/config";

export function Header() {
  return (
    <header className="border-b border-black/5 bg-white/90 backdrop-blur sticky top-0 z-40">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 flex items-center justify-between h-16">
        <Link href="/" className="flex items-center gap-2 font-bold text-navy focus-visible:outline-offset-4">
          <span
            aria-hidden
            className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-navy text-gold text-sm"
          >
            ♪
          </span>
          <span className="text-base sm:text-lg tracking-tight">{config.siteShortName}</span>
        </Link>
        <nav aria-label="メインナビゲーション" className="flex items-center gap-1 sm:gap-2 text-sm">
          <Link
            href="/reserve"
            className="rounded-full px-3 py-2 sm:px-4 font-semibold text-white bg-teal hover:bg-teal-dark transition-colors"
          >
            予約する
          </Link>
          <Link href="/terms" className="hidden sm:inline-block rounded-full px-3 py-2 text-navy hover:bg-cream">
            利用規約
          </Link>
          <Link href="/privacy" className="hidden sm:inline-block rounded-full px-3 py-2 text-navy hover:bg-cream">
            プライバシー
          </Link>
        </nav>
      </div>
    </header>
  );
}
