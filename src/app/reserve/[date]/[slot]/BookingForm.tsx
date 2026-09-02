"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Label, FieldError, Alert } from "@/components/ui";
import { formatJapaneseDate } from "@/lib/dates";

type Mode = "book" | "waitlist";

const inputClass =
  "w-full rounded-[11px] border-[1.5px] border-navy/[0.16] px-4 py-3 text-sm text-ink focus-visible:outline-none focus:border-teal";

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
    <div className="grid lg:grid-cols-[1fr_360px] gap-8 items-start">
      {/* Form card */}
      <div className="rounded-[22px] border border-navy/[0.09] bg-white p-6 sm:p-10 shadow-soft">
        {serverError && (
          <div className="mb-6">
            <Alert tone="warning">{serverError}</Alert>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          <div>
            <Label htmlFor="name">
              お名前 <span className="text-danger">*</span>
            </Label>
            <input
              id="name"
              className={inputClass}
              placeholder="山田 花子"
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
              <Label htmlFor="email">
                メールアドレス <span className="text-danger">*</span>
              </Label>
              <input
                id="email"
                type="email"
                className={inputClass}
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                aria-invalid={!!fieldErrors.email}
                autoComplete="email"
              />
              {fieldErrors.email && <FieldError>{fieldErrors.email}</FieldError>}
              <p className="mt-2 text-[11.5px] text-muted">予約確認・QRコードの送付に使用します</p>
            </div>
            <div>
              <Label htmlFor="phone">電話番号（任意）</Label>
              <input
                id="phone"
                type="tel"
                className={inputClass}
                placeholder="090-1234-5678"
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
                autoComplete="tel"
              />
            </div>
          </div>

          <fieldset>
            <legend className="block text-sm font-bold text-navy mb-2.5">
              ご利用者の区分 <span className="text-danger">*</span>
            </legend>
            <div className="flex gap-7">
              <label className="inline-flex items-center gap-2.5 text-sm text-ink">
                <input
                  type="radio"
                  name="ageCategory"
                  className="h-[18px] w-[18px]"
                  checked={form.ageCategory === "adult"}
                  onChange={() => update("ageCategory", "adult")}
                />
                成人
              </label>
              <label className="inline-flex items-center gap-2.5 text-sm text-ink">
                <input
                  type="radio"
                  name="ageCategory"
                  className="h-[18px] w-[18px]"
                  checked={form.ageCategory === "minor"}
                  onChange={() => update("ageCategory", "minor")}
                />
                未成年
              </label>
            </div>
          </fieldset>

          {form.ageCategory === "minor" && (
            <div>
              <Label htmlFor="guardianName">
                保護者のお名前 <span className="text-danger">*</span>
              </Label>
              <input
                id="guardianName"
                className={inputClass}
                value={form.guardianName}
                onChange={(e) => update("guardianName", e.target.value)}
                aria-invalid={!!fieldErrors.guardianName}
              />
              {fieldErrors.guardianName && <FieldError>{fieldErrors.guardianName}</FieldError>}
              <p className="mt-2 text-[11.5px] text-muted">未成年の方がご利用の場合、当日は保護者の同伴が必要です</p>
            </div>
          )}

          <div>
            <Label htmlFor="notes">備考（任意）</Label>
            <textarea
              id="notes"
              rows={3}
              className={`${inputClass} resize-none`}
              placeholder="連弾希望など、ご要望がございましたらご記入ください"
              value={form.notes}
              onChange={(e) => update("notes", e.target.value)}
            />
          </div>

          <div className="rounded-2xl bg-cream p-5 flex flex-col gap-3.5">
            <label className="flex items-start gap-2.5 text-[13px] text-ink leading-[1.7]">
              <input
                type="checkbox"
                className="mt-0.5 h-[18px] w-[18px] shrink-0"
                checked={form.agreedToTerms}
                onChange={(e) => update("agreedToTerms", e.target.checked)}
              />
              <span>
                <a href="/terms" target="_blank" className="font-bold text-teal-dark underline">
                  利用規約
                </a>
                （キャンセルポリシー・免責事項を含む）に同意します <span className="text-danger">*</span>
              </span>
            </label>
            {fieldErrors.agreedToTerms && <FieldError>{fieldErrors.agreedToTerms}</FieldError>}

            <label className="flex items-start gap-2.5 text-[13px] text-ink leading-[1.7]">
              <input
                type="checkbox"
                className="mt-0.5 h-[18px] w-[18px] shrink-0"
                checked={form.agreedToNoise}
                onChange={(e) => update("agreedToNoise", e.target.checked)}
              />
              <span>近隣への配慮事項（演奏時間の厳守、静粛な出入り等）を守ります <span className="text-danger">*</span></span>
            </label>
            {fieldErrors.agreedToNoise && <FieldError>{fieldErrors.agreedToNoise}</FieldError>}
          </div>

          <Button type="submit" size="lg" className="w-full" disabled={submitting}>
            {submitting ? "送信中…" : mode === "book" ? "この内容で予約する" : "キャンセル待ちに登録する"}
          </Button>
        </form>
      </div>

      {/* Summary sidebar */}
      <div className="flex flex-col gap-5">
        <div className="rounded-[20px] bg-linear-to-br from-navy to-teal-dark p-7 text-white shadow-elevated">
          <p className="text-[11px] font-bold tracking-widest text-gold-light uppercase">ご予約内容</p>
          <p className="font-display mt-4 text-[19px] font-bold">{formatJapaneseDate(date)}</p>
          <p className="mt-1.5 text-sm text-white/75">
            {slotStart}〜{slotEnd}
            {mode === "waitlist" && "（キャンセル待ち登録）"}
          </p>
          <div className="mt-5 pt-[18px] border-t border-white/15 flex items-center gap-2.5 text-[12.5px] text-white/75">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3.5 2" />
            </svg>
            ご利用時間 {slotEndMinutes(slotStart, slotEnd)}分
          </div>
        </div>

        <div className="rounded-[20px] border border-navy/[0.09] bg-white p-6">
          <p className="mb-3.5 text-[13px] font-bold text-navy">当日のお願い</p>
          <ul className="space-y-2.5 text-[12.5px] text-muted leading-[1.7]">
            <li className="flex gap-2">
              <span className="text-gold">●</span>演奏時間の厳守にご協力ください
            </li>
            <li className="flex gap-2">
              <span className="text-gold">●</span>鍵盤ご利用時は衛生面にご配慮ください
            </li>
            <li className="flex gap-2">
              <span className="text-gold">●</span>未成年の方は保護者の同伴が必要です
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function slotEndMinutes(start: string, end: string): number {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  return eh * 60 + em - (sh * 60 + sm);
}
