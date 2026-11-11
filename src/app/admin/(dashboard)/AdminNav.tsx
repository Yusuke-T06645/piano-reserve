"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { SiteIcon, type SiteIconName } from "@/components/icons";

const links: { href: string; label: string; icon: SiteIconName }[] = [
  {
    href: "/admin",
    label: "予約一覧ダッシュボード",
    icon: "dashboard",
  },
  {
    href: "/admin/blackout-dates",
    label: "休止日管理",
    icon: "calendarBlock",
  },
  {
    href: "/admin/checkin",
    label: "来場QRチェックイン",
    icon: "scan",
  },
];

export function AdminNav({ variant = "sidebar" }: { variant?: "sidebar" | "mobile" }) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="管理者ナビゲーション"
      className={clsx(
        variant === "sidebar" ? "flex flex-col gap-1" : "flex flex-wrap items-stretch gap-1.5 px-3 py-2"
      )}
    >
      {links.map((link) => {
        const active = link.href === "/admin" ? pathname === "/admin" : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={clsx(
              "flex items-center gap-3 rounded-md font-medium transition-colors",
              variant === "sidebar" ? "px-3.5 py-3 text-[13.5px]" : "shrink-0 px-3 py-2 text-[12.5px] whitespace-nowrap",
              active ? "bg-gold-light/16 text-gold-light font-bold" : "text-white/68 hover:bg-white/10 hover:text-white"
            )}
          >
            <SiteIcon name={link.icon} size="md" className="shrink-0" />
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
