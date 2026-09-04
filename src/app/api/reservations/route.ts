import { NextResponse } from "next/server";
import { BookingError, createReservation } from "@/lib/booking";
import { reservationFormSchema } from "@/lib/validation";
import { requireAdmin, UnauthorizedError } from "@/lib/auth";
import { getStore, type ReservationStatus } from "@/lib/store";
import { signConfirmationToken } from "@/lib/confirmationToken";

const VALID_STATUSES: ReservationStatus[] = ["confirmed", "attended", "cancelled", "no_show"];

export const runtime = "nodejs";

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = reservationFormSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "入力内容に誤りがあります。", issues: parsed.error.issues }, { status: 400 });
  }
  try {
    const result = await createReservation(parsed.data);
    if ("reservation" in result) {
      const confirmationToken = await signConfirmationToken(result.reservation);
      return NextResponse.json({ ...result, confirmationToken }, { status: 201 });
    }
    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    if (err instanceof BookingError) {
      const status = err.code === "SLOT_FULL" ? 409 : 400;
      return NextResponse.json({ error: err.message, code: err.code }, { status });
    }
    console.error(err);
    return NextResponse.json({ error: "予約処理中にエラーが発生しました。" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    await requireAdmin(req);
  } catch (err) {
    if (err instanceof UnauthorizedError) return NextResponse.json({ error: err.message }, { status: 401 });
    throw err;
  }
  const url = new URL(req.url);
  const date = url.searchParams.get("date") ?? undefined;
  const statusParam = url.searchParams.get("status");
  const status = VALID_STATUSES.find((s) => s === statusParam);
  const store = getStore();
  const reservations = await store.listReservations({ date, status });
  return NextResponse.json({ reservations });
}
