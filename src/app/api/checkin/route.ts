import { NextResponse } from "next/server";
import { getStore } from "@/lib/store";
import { requireAdmin, UnauthorizedError } from "@/lib/auth";

export const runtime = "nodejs";

/**
 * 当日の受付QRコードチェックイン処理。
 * 1回目の呼び出し(confirm未指定)は「照合」のみ行い、画面に氏名・時間枠を表示する。
 * 管理者が内容を確認して「来場確認」ボタンを押すと confirm:true で再度呼び出され、
 * ステータスが確定的に更新される(要件: QRチェックインフローの具体的実現)。
 */
export async function POST(req: Request) {
  try {
    await requireAdmin(req);
  } catch (err) {
    if (err instanceof UnauthorizedError) return NextResponse.json({ error: err.message }, { status: 401 });
    throw err;
  }

  const body = await req.json().catch(() => ({}));
  const token: string | undefined = body.token;
  const confirm: boolean = body.confirm === true;
  if (!token) return NextResponse.json({ error: "QRコードを読み取れませんでした。" }, { status: 400 });

  const store = getStore();
  const reservation = await store.getReservationByCheckinToken(token);
  if (!reservation) {
    return NextResponse.json({ error: "該当する予約が見つかりませんでした。QRコードをご確認ください。" }, { status: 404 });
  }

  if (reservation.status === "attended") {
    return NextResponse.json({ reservation, alreadyProcessed: true, message: "対応済みです（来場確認済み）。" });
  }
  if (reservation.status === "cancelled") {
    return NextResponse.json({ reservation, error: "この予約はキャンセルされています。" }, { status: 409 });
  }
  if (reservation.status === "no_show") {
    return NextResponse.json({ reservation, error: "この予約は無断キャンセル扱いになっています。管理者にご確認ください。" }, { status: 409 });
  }

  if (!confirm) {
    return NextResponse.json({ reservation, needsConfirmation: true });
  }

  const updated = await store.updateReservation(reservation.id, {
    status: "attended",
    checkedInAt: new Date().toISOString(),
  });
  return NextResponse.json({ reservation: updated, checkedIn: true });
}
