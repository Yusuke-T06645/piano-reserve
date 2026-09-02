import Link from "next/link";
import { config } from "@/lib/config";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-black/5 bg-cream">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-10 text-sm text-muted flex flex-col sm:flex-row gap-4 sm:justify-between">
        <div>
          <p className="font-semibold text-navy">{config.orgName}</p>
          <p className="mt-1">{config.siteName}</p>
        </div>
        <nav aria-label="フッターナビゲーション" className="flex flex-wrap gap-x-6 gap-y-2">
          <Link href="/terms" className="hover:text-navy hover:underline">
            利用規約
          </Link>
          <Link href="/privacy" className="hover:text-navy hover:underline">
            プライバシーポリシー
          </Link>
          <Link href="/manage/lookup" className="hover:text-navy hover:underline">
            予約の確認・キャンセル
          </Link>
          <a href={`mailto:${config.supportEmail}`} className="hover:text-navy hover:underline">
            お問い合わせ
          </a>
        </nav>
      </div>
    </footer>
  );
}
