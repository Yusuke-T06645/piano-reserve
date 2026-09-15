"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Label, FieldError, Alert } from "@/components/ui";
import { formatJapaneseDate } from "@/lib/dates";
import { config } from "@/lib/config";

type Mode = "book" | "waitlist";

const inputClass =
  "w-full rounded-[11px] border-[1.5px] border-navy/30 px-4 py-3 text-base text-ink focus-visible:outline-none focus:border-teal";

const FIELD_LABELS: Record<string, string> = {
  name: "お名前",
  email: "メールアドレス",
  guardianName: "保護者のお名前",
  agreedToTerms: "利用規約への同意",
  agreedToNoise: "近隣への配慮事項への同意",
};

/** 日時を選びなおして戻ってきたときのために、入力内容をブラウザ内に一時保存する */
const DRAFT_KEY = "piano-reserve:booking-draft";

type FormState = {
  name: string;
  email: string;
  phone: string;
  ageCategory: "adult" | "minor";
  guardianName: string;
  notes: string;
  agreedToTerms: boolean;
  agreedToNoise: boolean;
  photoConsent: boolean;
};

const EMPTY_FORM: FormState = {
  name: "",
  email: "",
  phone: "",
  ageCategory: "adult",
  guardianName: "",
  notes: "",
  agreedToTerms: false,
  agreedToNoise: false,
  photoConsent: false,
};

function parseDraft(raw: string | null): FormState {
  if (!raw) return EMPTY_FORM;
  try {
    return { ...EMPTY_FORM, ...(JSON.parse(raw) as Partial<FormState>) };
  } catch {
    return EMPTY_FORM;
  }
}

/** sessionStorageは書き換わらない前提なので購読は何もしない */
function subscribeToDraft() {
  return () => {};
}

function readDraftJson(): string | null {
  try {
    return sessionStorage.getItem(DRAFT_KEY);
  } catch {
    return null;
  }
}

type BookingFormProps = {
  date: string;
  slotStart: string;
  slotEnd: string;
  initialMode: Mode;
};

/**
 * 「日時を変更する」で戻ってきた場合に備え、保存済みの入力内容を読み出してから本体を描画する。
 * サーバー描画時は常に空の状態を返し、ハイドレーション後に保存内容があればフォームを作り直す。
 */
export function BookingForm(props: BookingFormProps) {
  const draftJson = useSyncExternalStore(subscribeToDraft, readDraftJson, () => null);
  return <BookingFormFields key={draftJson ? "draft" : "empty"} initialForm={parseDraft(draftJson)} {...props} />;
}

function BookingFormFields({
  date,
  slotStart,
  slotEnd,
  initialMode,
  initialForm,
}: BookingFormProps & { initialForm: FormState }) {
  const router = useRouter();
  const errorSummaryRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<Mode>(initialMode);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [waitlistDone, setWaitlistDone] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState<FormState>(initialForm);
  const [edited, setEdited] = useState(false);

  // 入力された内容だけをブラウザ内(sessionStorage)に保存する。
  // 日時を選びなおして戻ってきたときに、同じ内容を復元するために使う。
  useEffect(() => {
    if (!edited) return;
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(form));
    } catch {
      // プライベートブラウズ等で保存できない場合は何もしない(入力は続けられる)
    }
  }, [form, edited]);

  function clearDraft() {
    try {
      sessionStorage.removeItem(DRAFT_KEY);
    } catch {
      // 保存できていない場合は削除も不要
    }
  }

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setEdited(true);
    // 入力し直したエラーは、その場で消して現在の状態と一致させる
    setFieldErrors((errs) => {
      if (!errs[key]) return errs;
      const next = { ...errs };
      delete next[key];
      return next;
    });
  }

  function validateClientSide(): boolean {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = "お名前が未入力です。当日の受付でお呼びするお名前をご入力ください。";
    if (!form.email.trim()) {
      errs.email = "メールアドレスが未入力です。予約確認メールをお届けするアドレスをご入力ください。";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      errs.email = "メールアドレスの形式が正しくありません（例: you@example.com）。@とドメイン名をご確認ください。";
    }
    if (form.ageCategory === "minor" && !form.guardianName.trim())
      errs.guardianName = "保護者のお名前が未入力です。未成年の方のご利用には保護者の方のお名前が必要です。";
    if (!form.agreedToTerms) errs.agreedToTerms = "利用規約への同意が必要です。内容をご確認のうえチェックを入れてください。";
    if (!form.agreedToNoise)
      errs.agreedToNoise = "近隣への配慮事項への同意が必要です。内容をご確認のうえチェックを入れてください。";
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);
    if (!validateClientSide()) {
      // フォーカスをエラー一覧に移し、スクリーンリーダーにもエラー発生を通知する
      requestAnimationFrame(() => errorSummaryRef.current?.focus());
      return;
    }

    setSubmitting(true);
    try {
      const endpoint = mode === "book" ? "/api/reservations" : "/api/waitlist";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, slotStart, slotEnd, ...form }),
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
      clearDraft();
      if (mode === "waitlist") {
        setWaitlistDone(true);
      } else {
        const params = new URLSearchParams();
        if (data.confirmationToken) params.set("ct", data.confirmationToken);
        params.set("mail", data.emailSent ? "ok" : "failed");
        router.push(`/reserve/complete/${data.reservation.id}?${params.toString()}`);
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

  const durationMinutes = slotDurationMinutes(slotStart, slotEnd);

  /** 確定直前に内容を確認するためのカード（送信ボタンの直前に置く） */
  const confirmCard = (
    <section
      aria-labelledby="booking-summary-heading"
      className="rounded-[20px] border-[1.5px] border-teal/30 bg-teal-soft/60 p-5 sm:p-6"
    >
      <h2 id="booking-summary-heading" className="text-[16px] font-bold text-navy">
        {mode === "book" ? "ご予約内容の確認" : "キャンセル待ちの登録内容"}
      </h2>
      <dl className="mt-4 space-y-3 text-[16px] leading-[1.7] text-ink">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <dt className="w-[92px] shrink-0 text-[14px] font-bold text-muted">利用日</dt>
          <dd className="font-display text-[18px] font-bold text-navy">{formatJapaneseDate(date)}</dd>
        </div>
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <dt className="w-[92px] shrink-0 text-[14px] font-bold text-muted">時間</dt>
          <dd className="font-display text-[18px] font-bold text-navy">
            {slotStart} 〜 {slotEnd}
          </dd>
        </div>
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <dt className="w-[92px] shrink-0 text-[14px] font-bold text-muted">利用時間</dt>
          <dd>{durationMinutes}分</dd>
        </div>
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <dt className="w-[92px] shrink-0 text-[14px] font-bold text-muted">料金</dt>
          <dd>無料</dd>
        </div>
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <dt className="w-[92px] shrink-0 text-[14px] font-bold text-muted">会場</dt>
          <dd>{config.venueName}</dd>
        </div>
      </dl>
      <p className="mt-4">
        <Link
          href={`/reserve/${date}`}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-full border-[1.5px] border-teal-dark px-4 text-[15px] font-bold text-teal-dark hover:bg-white"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M19 12H5M11 18l-6-6 6-6" />
          </svg>
          日時を変更する
        </Link>
        <span className="mt-2 block text-[14px] leading-[1.7] text-muted">
          入力済みの内容は保持されますので、日時を選びなおしてからこの画面にお戻りください。
        </span>
      </p>
    </section>
  );

  return (
    <div className="grid lg:grid-cols-[1fr_340px] gap-8 items-start">
      {/* 入力 → 同意 → 内容確認 → 確定ボタン の順に並べる */}
      <div className="rounded-[22px] border border-navy/[0.09] bg-white p-5 sm:p-10 shadow-soft">
        {serverError && (
          <div className="mb-6">
            <Alert tone="warning">{serverError}</Alert>
          </div>
        )}

        {Object.keys(fieldErrors).length > 0 && (
          <div
            ref={errorSummaryRef}
            tabIndex={-1}
            role="alert"
            className="mb-6 rounded-2xl border border-danger/40 bg-danger-soft p-5 focus-visible:outline-none"
          >
            <p className="font-bold text-danger text-[16px] mb-2.5">
              入力内容をご確認ください（{Object.keys(fieldErrors).length}件）
            </p>
            <ul className="space-y-2 text-[15px] leading-[1.7] text-danger">
              {Object.entries(fieldErrors).map(([field, message]) => (
                <li key={field}>
                  <a href={`#${field}`} className="font-bold underline hover:no-underline">
                    {FIELD_LABELS[field] || field}
                  </a>
                  : {message}
                </li>
              ))}
            </ul>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-6">
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
            <FieldError id="name-error">{fieldErrors.name}</FieldError>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
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
                aria-describedby={fieldErrors.email ? "email-error email-hint" : "email-hint"}
                autoComplete="email"
              />
              <FieldError id="email-error">{fieldErrors.email}</FieldError>
              <p id="email-hint" className="mt-2 text-[14px] leading-[1.7] text-muted">
                予約確認・QRコードの送付に使用します
              </p>
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
            <legend className="block text-[15px] font-bold text-navy mb-2.5">
              ご利用者の区分 <span className="text-danger">*</span>
            </legend>
            <div className="flex flex-wrap gap-x-7 gap-y-2">
              <label className="inline-flex min-h-11 items-center gap-2.5 text-[16px] text-ink">
                <input
                  type="radio"
                  name="ageCategory"
                  className="h-5 w-5"
                  checked={form.ageCategory === "adult"}
                  onChange={() => update("ageCategory", "adult")}
                />
                成人
              </label>
              <label className="inline-flex min-h-11 items-center gap-2.5 text-[16px] text-ink">
                <input
                  type="radio"
                  name="ageCategory"
                  className="h-5 w-5"
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
                aria-describedby={fieldErrors.guardianName ? "guardianName-error guardianName-hint" : "guardianName-hint"}
              />
              <FieldError id="guardianName-error">{fieldErrors.guardianName}</FieldError>
              <p id="guardianName-hint" className="mt-2 text-[14px] text-muted leading-[1.7]">
                安全確認とトラブル発生時のご連絡のため、保護者の方のお名前をご記入ください。当日は保護者の方が会場に同伴し、ご利用中も同席をお願いいたします。
              </p>
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

          {/* 同意事項 */}
          <div className="rounded-2xl bg-cream p-5 flex flex-col gap-3">
            <label htmlFor="agreedToTerms" className="flex items-start gap-2.5 text-[15px] text-ink leading-[1.8]">
              <input
                id="agreedToTerms"
                type="checkbox"
                className="mt-1 h-5 w-5 shrink-0"
                checked={form.agreedToTerms}
                onChange={(e) => update("agreedToTerms", e.target.checked)}
                aria-invalid={!!fieldErrors.agreedToTerms}
                aria-describedby={fieldErrors.agreedToTerms ? "agreedToTerms-error" : undefined}
              />
              <span>
                <a href="/terms" target="_blank" className="font-bold text-teal-dark underline">
                  利用規約
                </a>
                （キャンセルポリシー・免責事項を含む）に同意します <span className="text-danger">*</span>
              </span>
            </label>
            <FieldError id="agreedToTerms-error">{fieldErrors.agreedToTerms}</FieldError>

            <label htmlFor="agreedToNoise" className="flex items-start gap-2.5 text-[15px] text-ink leading-[1.8]">
              <input
                id="agreedToNoise"
                type="checkbox"
                className="mt-1 h-5 w-5 shrink-0"
                checked={form.agreedToNoise}
                onChange={(e) => update("agreedToNoise", e.target.checked)}
                aria-invalid={!!fieldErrors.agreedToNoise}
                aria-describedby={fieldErrors.agreedToNoise ? "agreedToNoise-error" : undefined}
              />
              <span>近隣への配慮事項（演奏時間の厳守、静粛な出入り等）を守ります <span className="text-danger">*</span></span>
            </label>
            <FieldError id="agreedToNoise-error">{fieldErrors.agreedToNoise}</FieldError>
          </div>

          <div className="rounded-2xl border border-navy/[0.09] bg-white p-5 flex flex-col gap-2.5">
            <p className="text-[15px] font-bold text-navy">撮影・広報でのご使用について（任意）</p>
            <p className="text-[14px] text-muted leading-[1.8]">
              当日、会場の様子や演奏の写真を撮影し、当社の広報活動（ウェブサイト・SNS・パンフレット等）に使用させていただく場合があります。ご同意いただけない場合も、ご予約・ご利用には影響ございません。
            </p>
            <label htmlFor="photoConsent" className="flex items-start gap-2.5 text-[15px] text-ink leading-[1.8]">
              <input
                id="photoConsent"
                type="checkbox"
                className="mt-1 h-5 w-5 shrink-0"
                checked={form.photoConsent}
                onChange={(e) => update("photoConsent", e.target.checked)}
              />
              <span>写真撮影および広報活動での使用に同意します</span>
            </label>
          </div>

          {/* 確定直前の内容確認 */}
          {confirmCard}

          <div>
            <Button type="submit" size="lg" className="w-full" disabled={submitting}>
              {submitting ? "送信中…" : mode === "book" ? "予約を確定する" : "キャンセル待ちに登録する"}
            </Button>
            <p className="mt-2.5 text-center text-[14px] leading-[1.7] text-muted">
              {mode === "book"
                ? "このボタンを押すとご予約が確定し、確認メールをお送りします。"
                : "このボタンを押すとキャンセル待ちの登録が完了します。"}
            </p>
          </div>
        </form>
      </div>

      {/* 補足情報 */}
      <div className="flex flex-col gap-5">
        <div className="rounded-[20px] border border-navy/[0.09] bg-white p-6">
          <p className="mb-3.5 text-[15px] font-bold text-navy">当日のお願い</p>
          <ul className="space-y-2.5 text-[14px] text-ink leading-[1.8]">
            <li className="flex gap-2">
              <span aria-hidden className="mt-[0.65em] h-2 w-2 shrink-0 rounded-full bg-gold" />演奏時間の厳守にご協力ください
            </li>
            <li className="flex gap-2">
              <span aria-hidden className="mt-[0.65em] h-2 w-2 shrink-0 rounded-full bg-gold" />鍵盤ご利用時は衛生面にご配慮ください
            </li>
            <li className="flex gap-2">
              <span aria-hidden className="mt-[0.65em] h-2 w-2 shrink-0 rounded-full bg-gold" />未成年の方は保護者の同伴が必要です
            </li>
          </ul>
        </div>

        <div className="rounded-[20px] border border-navy/[0.09] bg-white p-6">
          <p className="mb-3 text-[15px] font-bold text-navy">当日の受付方法</p>
          <p className="text-[14px] text-ink leading-[1.8]">{config.venueChecklist}</p>
        </div>
      </div>
    </div>
  );
}

function slotDurationMinutes(start: string, end: string): number {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  return eh * 60 + em - (sh * 60 + sm);
}
