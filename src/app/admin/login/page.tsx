"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Container, Card, SectionTitle, Label, Button, Alert } from "@/components/ui";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "ログインに失敗しました。");
        return;
      }
      router.push(params.get("next") || "/admin");
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      {error && (
        <div className="mb-5">
          <Alert tone="danger">{error}</Alert>
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <Label htmlFor="email">管理者メールアドレス</Label>
          <input
            id="email"
            type="email"
            required
            autoFocus
            className="w-full rounded-lg border border-black/10 px-3 py-2.5"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="password">パスワード</Label>
          <input
            id="password"
            type="password"
            required
            className="w-full rounded-lg border border-black/10 px-3 py-2.5"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? "ログイン中…" : "ログイン"}
        </Button>
      </form>
    </Card>
  );
}

export default function AdminLoginPage() {
  return (
    <Container className="py-14 sm:py-20 max-w-md">
      <SectionTitle title="管理者ログイン" description="予約管理・当日受付には管理者ログインが必要です。" />
      <Suspense>
        <LoginForm />
      </Suspense>
    </Container>
  );
}
