"use client";

import { useEffect, useState } from "react";
import { Badge, Button, Alert, Label } from "@/components/ui";
import { formatJapaneseDate } from "@/lib/dates";
import type { BusyRange } from "@/lib/store/types";
import { TimeRangeSelector } from "@/app/reserve/[date]/TimeRangeSelector";

type ReservationView = {
  id: string;
  date: string;
  slotStart: string;
  slotEnd: string;
  name: string;
  status: "confirmed" | "attended" | "cancelled" | "no_show";
};

type DateAvailability = {
  openTime: string;
  closeTime: string;
  granularityMinutes: number;
  maxUsageMinutes: number;
  busyRanges: BusyRange[];
  waitlistCount: number;
};

const STATUS_LABEL: Record<ReservationView["status"], { label: string; tone: "success" | "warning" | "danger" | "neutral" }> = {
  confirmed: { label: "予約確定・来場待ち", tone: "success" },
  attended: { label: "来場済み", tone: "neutral" },
  cancelled: { label: "キャンセル済み", tone: "danger" },
  no_show: { label: "無断キャンセル扱い", tone: "danger" },
};

const selectClass =
  "w-full rounded-[11px] border-[1.5px] border-navy/[0.16] bg-white px-4 py-3 text-sm text-ink";

export function ManagePanel({
  token,
  initialReservation,
  changeDeadlineHours,
}: {
  token: string;
  initialReservation: ReservationView;
  changeDeadlineHours: number;
}) {
  const [reservation, setReservation] = useState(initialReservation);
  const [mode, setMode] = useState<"idle" | "confirmCancel" | "reschedule">("idle");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: "success" | "danger"; text: string } | null>(null);

  const [dateOptions, setDateOptions] = useState<string[]>([]);
  const [newDate, setNewDate] = useState("");
  const [newDateAvailability, setNewDateAvailability] = useState<DateAvailability | null>(null);

  useEffect(() => {
    if (mode === "reschedule" && dateOptions.length === 0) {
      fetch("/api/availability")
        .then((r) => r.json())
        .then((d: { dates?: { date: string; available: boolean }[] }) =>
          setDateOptions((d.dates || []).filter((x) => x.available).map((x) => x.date))
        );
    }
  }, [mode, dateOptions.length]);

  useEffect(() => {
    if (!newDate) return;
    fetch(`/api/availability?date=${newDate}`)
      .then((r) => r.json())
      .then((d: { availability?: DateAvailability }) => setNewDateAvailability(d.availability ?? null));
  }, [newDate]);

  function handleDateChange(value: string) {
    setNewDate(value);
    setNewDateAvailability(null);
  }

  async function doCancel() {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/manage/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ tone: "danger", text: data.error || "キャンセルに失敗しました。" });
        return;
      }
      setReservation(data.reservation);
      setMode("idle");
      setMessage({ tone: "success", text: "予約をキャンセルしました。" });
    } finally {
      setBusy(false);
    }
  }

  async function doReschedule(slotStart: string, slotEnd: string) {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/manage/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reschedule", date: newDate, slotStart, slotEnd }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ tone: "danger", text: data.error || "変更に失敗しました。" });
        return;
      }
      setReservation(data.reservation);
      setMode("idle");
      setMessage({ tone: "success", text: "予約日時を変更しました。変更後の内容を記載したメールをお送りしました。" });
    } finally {
      setBusy(false);
    }
  }

  const statusInfo = STATUS_LABEL[reservation.status];
  const canChange = reservation.status === "confirmed";

  return (
    <div className="space-y-7">
      <div className="rounded-[22px] border border-navy/[0.09] bg-white p-6 sm:p-9 shadow-soft">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[12.5px] text-muted">予約番号 {reservation.id}</p>
          <Badge tone={statusInfo.tone}>{statusInfo.label}</Badge>
        </div>
        <p className="font-display text-[22px] font-bold text-navy">{formatJapaneseDate(reservation.date)}</p>
        <p className="mt-2 mb-7 text-sm text-muted">
          {reservation.slotStart}〜{reservation.slotEnd} ／ {reservation.name} 様
        </p>

        {message && (
          <div className="mb-5">
            <Alert tone={message.tone}>{message.text}</Alert>
          </div>
        )}

        {canChange && mode === "idle" && (
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setMode("reschedule")}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M4 20h4l10-10-4-4L4 16v4z" />
                <path d="M13 7l4 4" />
              </svg>
              日時を変更する
            </Button>
            <Button variant="danger" className="flex-1" onClick={() => setMode("confirmCancel")}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <circle cx="12" cy="12" r="9" />
                <path d="M9 9l6 6M15 9l-6 6" />
              </svg>
              キャンセルする
            </Button>
          </div>
        )}

        {mode === "confirmCancel" && (
          <div className="rounded-2xl border border-danger/25 bg-danger-soft p-5">
            <p className="text-sm text-ink mb-4">本当にこのご予約をキャンセルしますか？この操作は取り消せません。</p>
            <div className="flex gap-3">
              <Button variant="danger" onClick={doCancel} disabled={busy}>
                {busy ? "処理中…" : "はい、キャンセルする"}
              </Button>
              <Button variant="ghost" onClick={() => setMode("idle")} disabled={busy}>
                戻る
              </Button>
            </div>
          </div>
        )}

        {!canChange && mode === "idle" && (
          <p className="text-sm text-muted">この予約は現在、変更・キャンセルできる状態ではありません。</p>
        )}
      </div>

      {mode === "reschedule" && (
        <div className="rounded-[22px] bg-cream p-6 sm:p-8">
          <p className="mb-5 text-xs text-muted">
            ※ご利用{changeDeadlineHours}時間前を過ぎるとWeb上での変更はできなくなります。
          </p>
          <div className="mb-6">
            <Label htmlFor="newDate">変更後の日付</Label>
            <select
              id="newDate"
              className={selectClass}
              value={newDate}
              onChange={(e) => handleDateChange(e.target.value)}
            >
              <option value="">選択してください</option>
              {dateOptions.map((d) => (
                <option key={d} value={d}>
                  {formatJapaneseDate(d)}
                </option>
              ))}
            </select>
          </div>
          {newDate && newDateAvailability && (
            <div className="mb-6">
              <Label>変更後の利用時間</Label>
              <TimeRangeSelector
                key={newDate}
                date={newDate}
                openTime={newDateAvailability.openTime}
                closeTime={newDateAvailability.closeTime}
                granularityMinutes={newDateAvailability.granularityMinutes}
                maxUsageMinutes={newDateAvailability.maxUsageMinutes}
                busyRanges={newDateAvailability.busyRanges.filter(
                  (r) =>
                    newDate !== reservation.date ||
                    r.start !== reservation.slotStart ||
                    r.end !== reservation.slotEnd
                )}
                waitlistCount={newDateAvailability.waitlistCount}
                showWaitlistCta={false}
                confirmLabel={busy ? "処理中…" : "この内容に変更する"}
                confirmDisabled={busy}
                onConfirm={doReschedule}
              />
            </div>
          )}
          <Button variant="ghost" onClick={() => setMode("idle")} disabled={busy}>
            戻る
          </Button>
        </div>
      )}
    </div>
  );
}
