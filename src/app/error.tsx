"use client"; // Error boundaries must be Client Components

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui";
import { config } from "@/lib/config";

/**
 * 予約台帳(Google Sheets)の一時的な読み取りエラー等で画面を表示できなかったときの案内。
 * Next.js既定の英語のエラー画面ではなく、再読み込みと問い合わせ先を日本語で案内する。
 */
export default function Error({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="px-4 sm:px-6 lg:px-16 py-16 sm:py-24">
      <div className="mx-auto max-w-[640px] rounded-[22px] border border-navy/[0.09] bg-white p-7 sm:p-10 shadow-soft">
        <h1 className="font-display text-xl sm:text-2xl font-bold text-navy">ページを表示できませんでした</h1>
        <p className="mt-4 text-[16px] leading-[1.8] text-ink">
          アクセスが集中しているか、一時的なエラーが発生しています。お手数ですが、少し時間をおいてから「もう一度読み込む」を押してください。
        </p>
        <p className="mt-3 text-[15px] leading-[1.8] text-muted">
          解決しない場合は
          <a href={`mailto:${config.supportEmail}`} className="font-bold text-teal-dark underline">
            {config.supportEmail}
          </a>
          までお問い合わせください。
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Button onClick={() => retry()}>もう一度読み込む</Button>
          <Link
            href="/"
            className="inline-flex min-h-11 items-center justify-center rounded-full border-[1.5px] border-navy/25 px-5 text-[15px] font-bold text-navy"
          >
            トップページへ戻る
          </Link>
        </div>
        {error.digest && <p className="mt-6 text-xs text-muted">エラー番号: {error.digest}</p>}
      </div>
    </div>
  );
}
