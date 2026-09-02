"use client";

import { useState } from "react";
import { Label, Button, Alert } from "@/components/ui";

const inputClass =
  "w-full rounded-[11px] border-[1.5px] border-navy/[0.16] px-4 py-3 text-sm text-ink focus-visible:outline-none focus:border-teal";

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
    <div className="px-4 sm:px-16 py-10 sm:py-14">
      <div className="mx-auto max-w-[680px]">
        <p className="text-center text-xs font-bold tracking-widest text-gold uppercase">MY RESERVATION</p>
        <h1 className="font-display mt-2.5 text-center text-2xl sm:text-[28px] font-bold text-navy">
          予約の確認・キャンセル
        </h1>
        <p className="mt-3 mb-11 text-center text-[13.5px] text-muted leading-[1.8]">
          確認メールが見つからない場合は、こちらから確認用リンクを再送できます。
        </p>

        <div className="rounded-[22px] border border-navy/[0.09] bg-white p-6 sm:p-9 shadow-soft">
          {done ? (
            <Alert tone="success">入力内容に一致するご予約があれば、確認用リンクをメールでお送りしました。</Alert>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <Label htmlFor="reservationId">予約番号</Label>
                <input
                  id="reservationId"
                  required
                  placeholder="RSV-XXXXXXXX"
                  className={inputClass}
                  value={reservationId}
                  onChange={(e) => setReservationId(e.target.value)}
                />
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
                />
              </div>
              <Button type="submit" size="lg" className="w-full" disabled={submitting}>
                {submitting ? "送信中…" : "確認用リンクを送る"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
