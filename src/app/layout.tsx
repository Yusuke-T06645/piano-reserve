import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { config } from "@/lib/config";

export const metadata: Metadata = {
  title: `${config.siteShortName} | ${config.siteName}`,
  description: `${config.orgName}が所有するグランドピアノを地域に開放。毎月第1・第3金曜16:00〜17:00、Web上で簡単に予約できます。`,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ja" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-white text-ink">
        <a href="#main-content" className="skip-link">
          本文へスキップ
        </a>
        <Header />
        <main id="main-content" className="flex-1 w-full">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
