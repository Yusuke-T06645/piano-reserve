"use client";

import { useState } from "react";
import { Label, Button, Alert } from "@/components/ui";
import { config } from "@/lib/config";

const inputClass =
  "w-full rounded-[11px] border-[1.5px] border-navy/30 px-4 py-3 text-base text-ink focus-visible:outline-none focus:border-teal";

export default function ManageLookupPage() {
  const [reservationId, setReservationId] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await fetch("/api/manage/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reservationId, email }),
      });
      setDone(true);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="px-4 sm:px-6 lg:px-16 py-10 sm:py-14">
      <div className="mx-auto max-w-[680px]">
        <p className="text-center text-[13px] font-bold tracking-widest text-gold-ink uppercase">MY RESERVATION</p>
        <h1 className="font-display mt-2.5 text-center text-2xl sm:text-[28px] font-bold text-navy">
          予約の確認・変更・キャンセル
        </h1>
        <p className="mt-3 mb-9 text-center text-[16px] text-muted leading-[1.8]">
          確認メールが見つからない場合は、こちらから確認用リンクを再送できます。
          リンクから、ご予約内容の確認・日時の変更・キャンセルができます。
        </p>

        <div className="rounded-[22px] border border-navy/[0.09] bg-white p-5 sm:p-9 shadow-soft">
          {done ? (
            <Alert tone="success">
              入力内容に一致するご予約があれば、確認用リンクをメールでお送りしました。
              数分待っても届かない場合は、迷惑メールフォルダをご確認のうえ、下記の問い合わせ先までご連絡ください。
            </Alert>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="reservationId">予約番号</Label>
                <input
                  id="reservationId"
                  required
                  placeholder="RSV-XXXXXXXX"
                  className={inputClass}
                  value={reservationId}
                  onChange={(e) => setReservationId(e.target.value)}
                  aria-describedby="reservationId-hint"
                />
                <p id="reservationId-hint" className="mt-2 text-[14px] leading-[1.7] text-muted">
                  予約完了画面と予約確認メールに記載されている「RSV-」で始まる番号です。
                </p>
              </div>
              <div>
                <Label htmlFor="email">メールアドレス</Label>
                <input
                  id="email"
                  type="email"
                  required
                  className={inputClass}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-describedby="email-hint"
                />
                <p id="email-hint" className="mt-2 text-[14px] leading-[1.7] text-muted">
                  ご予約時にご入力いただいたメールアドレスをご入力ください。
                </p>
              </div>
              <Button type="submit" size="lg" className="w-full" disabled={submitting}>
                {submitting ? "送信中…" : "確認用リンクを送る"}
              </Button>
            </form>
          )}
        </div>

        {/* 予約番号・確認メールを紛失した場合の案内 */}
        <div className="mt-6 rounded-[22px] border border-navy/[0.09] bg-cream p-5 sm:p-7">
          <h2 className="text-[17px] font-bold text-navy">予約番号や確認メールが分からない場合</h2>
          <ul className="mt-4 space-y-3.5 text-[15px] leading-[1.9] text-ink">
            <li className="flex gap-2.5">
              <span aria-hidden className="mt-[0.65em] h-2 w-2 shrink-0 rounded-full bg-gold" />
              <span>
                まず、ご予約時のメールアドレスの受信トレイと迷惑メールフォルダで「{config.siteShortName}」を検索してください。
                予約確認メールに、予約番号と確認用リンクが記載されています。
              </span>
            </li>
            <li className="flex gap-2.5">
              <span aria-hidden className="mt-[0.65em] h-2 w-2 shrink-0 rounded-full bg-gold" />
              <span>
                予約番号が分からない場合は、ご本人確認のうえ運営でお調べします。お名前・ご予約日・ご予約時のメールアドレスを添えて、
                <a href={`mailto:${config.supportEmail}`} className="font-bold text-teal-dark underline">
                  {config.supportEmail}
                </a>
                {config.supportPhone && `（電話: ${config.supportPhone}）`}
                までご連絡ください（対応は平日の営業時間内となります）。
              </span>
            </li>
            <li className="flex gap-2.5">
              <span aria-hidden className="mt-[0.65em] h-2 w-2 shrink-0 rounded-full bg-gold" />
              <span>
                当日、QRコードや予約番号をご提示いただけない場合も、受付でお名前をお伝えいただければご利用いただけます。
              </span>
            </li>
            <li className="flex gap-2.5">
              <span aria-hidden className="mt-[0.65em] h-2 w-2 shrink-0 rounded-full bg-gold" />
              <span>
                ご予約内容の保護のため、メールアドレスだけで予約内容を画面に表示することはいたしません。
                確認用リンクは、ご登録のメールアドレス宛にのみ送信されます。
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
