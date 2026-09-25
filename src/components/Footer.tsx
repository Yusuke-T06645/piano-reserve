import Link from "next/link";
import { config } from "@/lib/config";

export function Footer() {
  return (
    <footer className="mt-16 bg-linear-to-br from-navy-dark via-navy to-teal-dark">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 pt-12 sm:pt-14 pb-8">
        <div className="grid sm:grid-cols-[1.4fr_1fr_1fr] gap-8 sm:gap-12">
          <div>
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gold text-navy-dark">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M9 18V5l10-2v13" />
                  <circle cx="6.5" cy="18" r="2.5" />
                  <circle cx="16.5" cy="16" r="2.5" />
                </svg>
              </span>
              <span className="font-display text-[17px] font-bold text-white">{config.siteShortName}</span>
            </div>
            <p className="mt-4 text-[15px] text-white/85 leading-[1.8] max-w-sm">
              {config.orgName}が地域貢献の一環として運営する、グランドピアノ開放事業です。
            </p>
          </div>
          <div>
            <p className="mb-4 text-[13px] font-bold tracking-widest text-gold-light uppercase">リンク</p>
            <div className="flex flex-col gap-3">
              <Link href="/terms" className="inline-flex min-h-11 items-center text-[15px] text-white/85 hover:text-white">
                利用規約
              </Link>
              <Link href="/privacy" className="inline-flex min-h-11 items-center text-[15px] text-white/85 hover:text-white">
                プライバシーポリシー
              </Link>
              <Link href="/manage/lookup" className="inline-flex min-h-11 items-center text-[15px] text-white/85 hover:text-white">
                予約の確認・変更・キャンセル
              </Link>
            </div>
          </div>
          <div>
            <p className="mb-4 text-[13px] font-bold tracking-widest text-gold-light uppercase">お問い合わせ</p>
            <a
              href={`mailto:${config.supportEmail}`}
              className="inline-flex min-h-11 items-center gap-2.5 text-[15px] text-white/85 hover:text-white"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="shrink-0">
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <path d="M3 7l9 6 9-6" />
              </svg>
              {config.supportEmail}
            </a>
          </div>
        </div>
        <div className="mt-10 pt-5 border-t border-white/15 text-[13px] text-white/75">
          © {config.orgName} グランドピアノ開放事業
        </div>
      </div>
    </footer>
  );
}
