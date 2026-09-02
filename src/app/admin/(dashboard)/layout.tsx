import Link from "next/link";
import { Container } from "@/components/ui";
import { LogoutButton } from "./LogoutButton";

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-cream min-h-full">
      <div className="bg-navy text-white">
        <Container className="flex items-center justify-between h-14">
          <nav aria-label="管理者ナビゲーション" className="flex gap-1 text-sm">
            <Link href="/admin" className="rounded-full px-3 py-1.5 hover:bg-white/10">
              予約一覧
            </Link>
            <Link href="/admin/checkin" className="rounded-full px-3 py-1.5 hover:bg-white/10">
              QR受付
            </Link>
            <Link href="/admin/blackout-dates" className="rounded-full px-3 py-1.5 hover:bg-white/10">
              開放日の休止設定
            </Link>
          </nav>
          <LogoutButton />
        </Container>
      </div>
      <Container className="py-8 sm:py-10">{children}</Container>
    </div>
  );
}
