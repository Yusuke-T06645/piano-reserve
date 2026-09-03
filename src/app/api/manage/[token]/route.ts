import { NextResponse } from "next/server";
import { getStore } from "@/lib/store";
import { BookingError, cancelReservation, rescheduleReservation } from "@/lib/booking";
import { config } from "@/lib/config";

export const runtime = "nodejs";

export async function GET(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const reservation = await getStore().getReservationByManageToken(token);
  if (!reservation) return NextResponse.json({ error: "予約が見つかりません。" }, { status: 404 });
  return NextResponse.json({
    reservation,
    canSelfServiceChange: reservation.status === "confirmed",
    changeDeadlineHours: config.selfServiceChangeDeadlineHours,
  });
}

export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const reservation = await getStore().getReservationByManageToken(token);
  if (!reservation) return NextResponse.json({ error: "予約が見つかりません。" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  try {
    if (body.action === "cancel") {
      const updated = await cancelReservation(reservation.id, "user");
      return NextResponse.json({ reservation: updated });
    }
    if (body.action === "reschedule") {
      const updated = await rescheduleReservation(reservation.id, body.date, body.slotStart, body.slotEnd);
      return NextResponse.json({ reservation: updated });
    }
    return NextResponse.json({ error: "不明な操作です。" }, { status: 400 });
  } catch (err) {
    if (err instanceof BookingError) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: 400 });
    }
    console.error(err);
    return NextResponse.json({ error: "処理中にエラーが発生しました。" }, { status: 500 });
  }
}
