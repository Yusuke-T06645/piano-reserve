"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Button, Label, Alert } from "@/components/ui";
import { formatJapaneseDate } from "@/lib/dates";

export function BlackoutManager({
  existing,
  eligibleDates,
}: {
  existing: { date: string; reason: string }[];
  eligibleDates: string[];
}) {
  const router = useRouter();
  const [date, setDate] = useState("");
  const [reason, setReason] = useState("定期調律のため");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/blackout-dates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, reason }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "登録に失敗しました。");
        return;
      }
      setDate("");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function remove(d: string) {
    setBusy(true);
    try {
      await fetch(`/api/admin/blackout-dates?date=${d}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="font-bold text-navy mb-3">休止日を追加する（調律日等）</h2>
        <p className="text-sm text-muted mb-4">
          第1・第3金曜日のうち、定期調律や点検などで開放を休止する日を登録すると、予約カレンダーから自動的に非表示になります。
        </p>
        {error && (
          <div className="mb-4">
            <Alert tone="danger">{error}</Alert>
          </div>
        )}
        <form onSubmit={add} className="grid sm:grid-cols-[1fr_1fr_auto] gap-3 items-end">
          <div>
            <Label htmlFor="date">休止する開放日</Label>
            <select
              id="date"
              required
              className="w-full rounded-lg border border-black/10 px-3 py-2.5"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            >
              <option value="">選択してください</option>
              {eligibleDates.map((d) => (
                <option key={d} value={d}>
                  {formatJapaneseDate(d)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="reason">理由</Label>
            <input
              id="reason"
              className="w-full rounded-lg border border-black/10 px-3 py-2.5"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={busy || !date}>
            追加する
          </Button>
        </form>
      </Card>

      <Card>
        <h2 className="font-bold text-navy mb-3">現在の休止日一覧</h2>
        {existing.length === 0 ? (
          <p className="text-sm text-muted">登録されている休止日はありません。</p>
        ) : (
          <ul className="divide-y divide-black/5">
            {existing.map((b) => (
              <li key={b.date} className="py-3 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-navy">{formatJapaneseDate(b.date)}</p>
                  <p className="text-sm text-muted">{b.reason}</p>
                </div>
                <Button size="sm" variant="ghost" disabled={busy} onClick={() => remove(b.date)}>
                  取り消す
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
