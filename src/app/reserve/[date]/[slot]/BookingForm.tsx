"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Label, FieldError, Alert } from "@/components/ui";
import { formatJapaneseDate } from "@/lib/dates";

type Mode = "book" | "waitlist";

export function BookingForm({ date, slotStart, slotEnd, initialMode }: {
  date: string;
  slotStart: string;
  slotEnd: string;
  initialMode: Mode;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [waitlistDone, setWaitlistDone] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    ageCategory: "adult" as "adult" | "minor",
    guardianName: "",
    notes: "",
    agreedToTerms: false,
    agreedToNoise: false,
  });

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function validateClientSide(): boolean {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = "お名前を入力してください";
    if (!form.email.trim()) errs.email = "メールアドレスを入力してください";
    if (form.ageCategory === "minor" && !form.guardianName.trim())
      errs.guardianName = "保護者のお名前を入力してください";
    if (!form.agreedToTerms) errs.agreedToTerms = "利用規約への同意が必要です";
    if (!form.agreedToNoise) errs.agreedToNoise = "近隣への配慮事項への同意が必要です";
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);
    if (!validateClientSide()) return;

    setSubmitting(true);
    try {
      const endpoint = mode === "book" ? "/api/reservations" : "/api/waitlist";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, slotStart, ...form }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.code === "SLOT_FULL") {
          setMode("waitlist");
          setServerError("この枠は満席になりました。キャンセル待ちに切り替えてご登録いただけます。");
        } else {
          setServerError(data.error || "エラーが発生しました。");
        }
        return;
      }
      if (mode === "waitlist") {
        setWaitlistDone(true);
      } else {
        router.push(`/reserve/complete/${data.reservation.id}`);
      }
    } catch {
      setServerError("通信エラーが発生しました。時間をおいて再度お試しください。");
    } finally {
      setSubmitting(false);
    }
  }

  if (waitlistDone) {
    return (
      <Alert tone="success" title="キャンセル待ちを受け付けました">
        キャンセルが発生した場合、先着順で自動的にご予約が確定し、メールでご案内します。
      </Alert>
    );
  }

  return (
    <Card>
      <p className="text-sm text-muted mb-1">{formatJapaneseDate(date)}</p>
      <p className="text-lg font-bold text-navy mb-6">
        {slotStart}〜{slotEnd} {mode === "waitlist" && "（キャンセル待ち登録）"}
      </p>

      {serverError && (
        <div className="mb-5">
          <Alert tone="warning">{serverError}</Alert>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <div>
          <Label htmlFor="name">お名前 *</Label>
          <input
            id="name"
            className="w-full rounded-lg border border-black/10 px-3 py-2.5 focus-visible:outline-none focus:border-teal"
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            aria-invalid={!!fieldErrors.name}
            aria-describedby={fieldErrors.name ? "name-error" : undefined}
            autoComplete="name"
          />
          {fieldErrors.name && <FieldError><span id="name-error">{fieldErrors.name}</span></FieldError>}
        </div>

        <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <Label htmlFor="email">メールアドレス *</Label>
            <input
              id="email"
              type="email"
              className="w-full rounded-lg border border-black/10 px-3 py-2.5 focus-visible:outline-none focus:border-teal"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              aria-invalid={!!fieldErrors.email}
              autoComplete="email"
            />
            {fieldErrors.email && <FieldError>{fieldErrors.email}</FieldError>}
            <p className="mt-1 text-xs text-muted">予約確認・QRコードの送付に使用します</p>
          </div>
          <div>
            <Label htmlFor="phone">電話番号（任意）</Label>
            <input
              id="phone"
              type="tel"
              className="w-full rounded-lg border border-black/10 px-3 py-2.5 focus-visible:outline-none focus:border-teal"
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
              autoComplete="tel"
            />
          </div>
        </div>

        <fieldset>
          <legend className="block text-sm font-semibold text-navy mb-1.5">ご利用者の区分 *</legend>
          <div className="flex gap-4">
            <label className="inline-flex items-center gap-2">
              <input
                type="radio"
                name="ageCategory"
                checked={form.ageCategory === "adult"}
                onChange={() => update("ageCategory", "adult")}
              />
              成人
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="radio"
                name="ageCategory"
                checked={form.ageCategory === "minor"}
                onChange={() => update("ageCategory", "minor")}
              />
              未成年
            </label>
          </div>
        </fieldset>

        {form.ageCategory === "minor" && (
          <div>
            <Label htmlFor="guardianName">保護者のお名前 *</Label>
            <input
              id="guardianName"
              className="w-full rounded-lg border border-black/10 px-3 py-2.5 focus-visible:outline-none focus:border-teal"
              value={form.guardianName}
              onChange={(e) => update("guardianName", e.target.value)}
              aria-invalid={!!fieldErrors.guardianName}
            />
            {fieldErrors.guardianName && <FieldError>{fieldErrors.guardianName}</FieldError>}
            <p className="mt-1 text-xs text-muted">未成年の方がご利用の場合、当日は保護者の同伴が必要です</p>
          </div>
        )}

        <div>
          <Label htmlFor="notes">備考（任意）</Label>
          <textarea
            id="notes"
            rows={3}
            className="w-full rounded-lg border border-black/10 px-3 py-2.5 focus-visible:outline-none focus:border-teal"
            value={form.notes}
            onChange={(e) => update("notes", e.target.value)}
          />
        </div>

        <div className="space-y-3 rounded-xl bg-cream p-4">
          <label className="flex items-start gap-2.5 text-sm">
            <input
              type="checkbox"
              className="mt-0.5"
              checked={form.agreedToTerms}
              onChange={(e) => update("agreedToTerms", e.target.checked)}
            />
            <span>
              <a href="/terms" target="_blank" className="text-teal-dark underline">
                利用規約
              </a>
              （キャンセルポリシー・免責事項を含む）に同意します *
            </span>
          </label>
          {fieldErrors.agreedToTerms && <FieldError>{fieldErrors.agreedToTerms}</FieldError>}

          <label className="flex items-start gap-2.5 text-sm">
            <input
              type="checkbox"
              className="mt-0.5"
              checked={form.agreedToNoise}
              onChange={(e) => update("agreedToNoise", e.target.checked)}
            />
            <span>近隣への配慮事項（演奏時間の厳守、静粛な出入り等）を守ります *</span>
          </label>
          {fieldErrors.agreedToNoise && <FieldError>{fieldErrors.agreedToNoise}</FieldError>}
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={submitting}>
          {submitting ? "送信中…" : mode === "book" ? "この内容で予約する" : "キャンセル待ちに登録する"}
        </Button>
      </form>
    </Card>
  );
}
