import { NextResponse } from "next/server";
import { reservationFormSchema } from "@/lib/validation";
import { assertCanBook, BookingError, joinWaitlist } from "@/lib/booking";
import { isDateBookable } from "@/lib/availability";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = reservationFormSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "入力内容に誤りがあります。", issues: parsed.error.issues }, { status: 400 });
  }
  const { data } = parsed;
  if (!(await isDateBookable(data.date))) {
    return NextResponse.json({ error: "この日は開放日ではありません。" }, { status: 400 });
  }
  try {
    await assertCanBook(data.email, data.date);
    const entry = await joinWaitlist(data);
    return NextResponse.json({ waitlistEntry: entry }, { status: 201 });
  } catch (err) {
    if (err instanceof BookingError) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: 400 });
    }
    console.error(err);
    return NextResponse.json({ error: "キャンセル待ちの登録中にエラーが発生しました。" }, { status: 500 });
  }
}
