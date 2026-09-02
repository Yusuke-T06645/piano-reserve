import { NextResponse } from "next/server";
import { getStore } from "@/lib/store";
import { requireAdmin, UnauthorizedError } from "@/lib/auth";
import { cancelReservation } from "@/lib/booking";

export const runtime = "nodejs";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin(req);
  } catch (err) {
    if (err instanceof UnauthorizedError) return NextResponse.json({ error: err.message }, { status: 401 });
    throw err;
  }
  const { id } = await params;
  const reservation = await getStore().getReservation(id);
  if (!reservation) return NextResponse.json({ error: "予約が見つかりません。" }, { status: 404 });
  return NextResponse.json({ reservation });
}

/** 管理者による手動ステータス変更(来場済み手動マーク・ノーショー確定・管理者キャンセル等) */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin(req);
  } catch (err) {
    if (err instanceof UnauthorizedError) return NextResponse.json({ error: err.message }, { status: 401 });
    throw err;
  }
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const store = getStore();

  if (body.action === "cancel") {
    try {
      const updated = await cancelReservation(id, "admin");
      return NextResponse.json({ reservation: updated });
    } catch (err) {
      const message = err instanceof Error ? err.message : "処理に失敗しました。";
      return NextResponse.json({ error: message }, { status: 400 });
    }
  }

  if (body.action === "mark_no_show") {
    const reservation = await store.getReservation(id);
    if (!reservation) return NextResponse.json({ error: "予約が見つかりません。" }, { status: 404 });
    const updated = await store.updateReservation(id, { status: "no_show" });
    await store.addNoShowStrike({ email: reservation.email, reservationId: id, date: reservation.date });
    return NextResponse.json({ reservation: updated });
  }

  if (body.action === "mark_attended") {
    const updated = await store.updateReservation(id, { status: "attended", checkedInAt: new Date().toISOString() });
    return NextResponse.json({ reservation: updated });
  }

  return NextResponse.json({ error: "不明な操作です。" }, { status: 400 });
}
