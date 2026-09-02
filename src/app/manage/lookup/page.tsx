"use client";

import { useState } from "react";
import { Container, Card, SectionTitle, Label, Button, Alert } from "@/components/ui";

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
    <Container className="py-10 sm:py-14 max-w-lg">
      <SectionTitle
        title="予約の確認・キャンセル"
        description="確認メールが見つからない場合は、こちらから確認用リンクを再送できます。"
      />
      <Card>
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
                className="w-full rounded-lg border border-black/10 px-3 py-2.5"
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
                className="w-full rounded-lg border border-black/10 px-3 py-2.5"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "送信中…" : "確認用リンクを送る"}
            </Button>
          </form>
        )}
      </Card>
    </Container>
  );
}
