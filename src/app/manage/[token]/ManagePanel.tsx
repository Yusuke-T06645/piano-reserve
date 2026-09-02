"use client";

import { useEffect, useState } from "react";
import { Card, Badge, Button, Alert, Label } from "@/components/ui";
import { formatJapaneseDate } from "@/lib/dates";

type ReservationView = {
  id: string;
  date: string;
  slotStart: string;
  slotEnd: string;
  name: string;
  status: "confirmed" | "attended" | "cancelled" | "no_show";
};

const STATUS_LABEL: Record<ReservationView["status"], { label: string; tone: "success" | "warning" | "danger" | "neutral" }> = {
  confirmed: { label: "予約確定・来場待ち", tone: "success" },
  attended: { label: "来場済み", tone: "neutral" },
  cancelled: { label: "キャンセル済み", tone: "danger" },
  no_show: { label: "無断キャンセル扱い", tone: "danger" },
};

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
  const [slotOptions, setSlotOptions] = useState<{ start: string; end: string; available: number }[]>([]);
  const [newDate, setNewDate] = useState("");
  const [newSlot, setNewSlot] = useState("");

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
      .then((d: { slots?: { slotStart: string; slotEnd: string; available: number }[] }) =>
        setSlotOptions((d.slots || []).map((s) => ({ start: s.slotStart, end: s.slotEnd, available: s.available })))
      );
  }, [newDate]);

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

  async function doReschedule() {
    if (!newDate || !newSlot) return;
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/manage/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reschedule", date: newDate, slotStart: newSlot }),
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
    <Card>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted">予約番号 {reservation.id}</p>
        <Badge tone={statusInfo.tone}>{statusInfo.label}</Badge>
      </div>
      <p className="text-lg font-bold text-navy">{formatJapaneseDate(reservation.date)}</p>
      <p className="text-muted mb-6">
        {reservation.slotStart}〜{reservation.slotEnd} ／ {reservation.name} 様
      </p>

      {message && (
        <div className="mb-5">
          <Alert tone={message.tone}>{message.text}</Alert>
        </div>
      )}

      {canChange && mode === "idle" && (
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={() => setMode("reschedule")}>
            日時を変更する
          </Button>
          <Button variant="danger" onClick={() => setMode("confirmCancel")}>
            キャンセルする
          </Button>
        </div>
      )}

      {mode === "confirmCancel" && (
        <div className="rounded-xl border border-danger/30 bg-danger/5 p-4">
          <p className="text-sm text-ink mb-3">本当にこのご予約をキャンセルしますか？この操作は取り消せません。</p>
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

      {mode === "reschedule" && (
        <div className="rounded-xl border border-black/10 bg-cream p-4 space-y-4">
          <p className="text-xs text-muted">
            ※ご利用{changeDeadlineHours}時間前を過ぎるとWeb上での変更はできなくなります。
          </p>
          <div>
            <Label htmlFor="newDate">変更後の日付</Label>
            <select
              id="newDate"
              className="w-full rounded-lg border border-black/10 px-3 py-2.5"
              value={newDate}
              onChange={(e) => {
                setNewDate(e.target.value);
                setNewSlot("");
              }}
            >
              <option value="">選択してください</option>
              {dateOptions.map((d) => (
                <option key={d} value={d}>
                  {formatJapaneseDate(d)}
                </option>
              ))}
            </select>
          </div>
          {newDate && (
            <div>
              <Label htmlFor="newSlot">変更後の時間枠</Label>
              <select
                id="newSlot"
                className="w-full rounded-lg border border-black/10 px-3 py-2.5"
                value={newSlot}
                onChange={(e) => setNewSlot(e.target.value)}
              >
                <option value="">選択してください</option>
                {slotOptions.map((s) => (
                  <option key={s.start} value={s.start} disabled={s.available === 0 && s.start !== reservation.slotStart}>
                    {s.start}〜{s.end} {s.available === 0 ? "（満席）" : ""}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="flex gap-3">
            <Button onClick={doReschedule} disabled={busy || !newDate || !newSlot}>
              {busy ? "処理中…" : "この内容に変更する"}
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
    </Card>
  );
}
