"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, Button } from "@/components/ui";

type Status = "confirmed" | "attended" | "cancelled" | "no_show";

const STATUS_LABEL: Record<Status, { label: string; tone: "success" | "warning" | "danger" | "neutral" }> = {
  confirmed: { label: "来場待ち", tone: "success" },
  attended: { label: "来場済み", tone: "neutral" },
  cancelled: { label: "キャンセル", tone: "danger" },
  no_show: { label: "無断キャンセル", tone: "danger" },
};

export function ReservationRow({
  id,
  slotStart,
  slotEnd,
  name,
  email,
  phone,
  ageCategory,
  status,
}: {
  id: string;
  slotStart: string;
  slotEnd: string;
  name: string;
  email: string;
  phone?: string;
  ageCategory: string;
  status: Status;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function act(action: "cancel" | "mark_no_show" | "mark_attended") {
    setBusy(true);
    try {
      const res = await fetch(`/api/reservations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) router.refresh();
    } finally {
      setBusy(false);
    }
  }

  const info = STATUS_LABEL[status];

  return (
    <tr className="border-b border-navy/[0.09] last:border-0">
      <td className="py-3 pr-4 font-bold text-navy whitespace-nowrap">
        {slotStart}〜{slotEnd}
      </td>
      <td className="py-3 pr-4">
        <p className="font-medium text-ink">{name}</p>
        <p className="text-xs text-muted">
          {email} {phone ? `／ ${phone}` : ""} {ageCategory === "minor" ? "（未成年）" : ""}
        </p>
      </td>
      <td className="py-3 pr-4">
        <Badge tone={info.tone}>{info.label}</Badge>
      </td>
      <td className="py-3 text-right">
        {status === "confirmed" && (
          <div className="flex gap-2 justify-end flex-wrap">
            <Button size="sm" variant="outline" disabled={busy} onClick={() => act("mark_attended")}>
              来場確認
            </Button>
            <Button size="sm" variant="ghost" disabled={busy} onClick={() => act("mark_no_show")}>
              ノーショー
            </Button>
            <Button size="sm" variant="danger" disabled={busy} onClick={() => act("cancel")}>
              キャンセル
            </Button>
          </div>
        )}
      </td>
    </tr>
  );
}
