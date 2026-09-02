import { NextResponse } from "next/server";
import { markPastReservationsAsNoShow } from "@/lib/noshow";

export const runtime = "nodejs";

/** Vercel Cron等から1日数回呼び出す想定。Authorization: Bearer <CRON_SECRET> で保護。 */
export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const count = await markPastReservationsAsNoShow();
  return NextResponse.json({ markedNoShow: count });
}
