"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const links = [
  {
    href: "/admin",
    label: "予約一覧ダッシュボード",
    icon: (
      <>
        <rect x="3" y="3" width="8" height="8" rx="1.5" />
        <rect x="13" y="3" width="8" height="8" rx="1.5" />
        <rect x="3" y="13" width="8" height="8" rx="1.5" />
        <rect x="13" y="13" width="8" height="8" rx="1.5" />
      </>
    ),
  },
  {
    href: "/admin/blackout-dates",
    label: "休止日管理",
    icon: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="3" />
        <path d="M8 3v4M16 3v4M3 10h18" />
        <circle cx="15.5" cy="15.5" r="3.2" />
        <path d="M13.8 13.8l3.4 3.4" />
      </>
    ),
  },
  {
    href: "/admin/checkin",
    label: "来場QRチェックイン",
    icon: (
      <>
        <path d="M4 8V5a1 1 0 0 1 1-1h3M20 8V5a1 1 0 0 0-1-1h-3M4 16v3a1 1 0 0 0 1 1h3M20 16v3a1 1 0 0 1-1 1h-3" />
        <rect x="9" y="9" width="6" height="6" rx="1" />
      </>
    ),
  },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="管理者ナビゲーション" className="flex flex-col gap-1">
      {links.map((link) => {
        const active = link.href === "/admin" ? pathname === "/admin" : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={clsx(
              "flex items-center gap-3 rounded-[11px] px-3.5 py-3 text-[13.5px] font-medium transition-colors",
              active ? "bg-gold-light/16 text-gold-light font-bold" : "text-white/68 hover:bg-white/10 hover:text-white"
            )}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="shrink-0">
              {link.icon}
            </svg>
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
