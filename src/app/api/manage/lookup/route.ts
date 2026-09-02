import { NextResponse } from "next/server";
import { z } from "zod";
import { getStore } from "@/lib/store";
import { sendManageLink } from "@/lib/notifications";

export const runtime = "nodejs";

const schema = z.object({
  reservationId: z.string().trim().min(1),
  email: z.string().trim().email(),
});

/**
 * 予約確認リンクを紛失した利用者向けの再送機能。
 * セキュリティ上、予約が見つかったかどうかに関わらず常に同じ成功メッセージを返す
 * (メールアドレスの在不在を第三者が推測できないようにするため)。
 */
export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "予約番号とメールアドレスを入力してください。" }, { status: 400 });
  }
  const { reservationId, email } = parsed.data;
  const reservation = await getStore().getReservation(reservationId.trim().toUpperCase());
  if (reservation && reservation.email.toLowerCase() === email.toLowerCase()) {
    await sendManageLink(reservation);
  }
  return NextResponse.json({
    ok: true,
    message: "入力内容に一致するご予約があれば、確認用リンクをメールでお送りしました。",
  });
}
