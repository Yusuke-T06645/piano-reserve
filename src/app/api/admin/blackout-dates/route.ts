import { NextResponse } from "next/server";
import { getStore } from "@/lib/store";
import { requireAdmin, UnauthorizedError } from "@/lib/auth";
import { blackoutDateSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    await requireAdmin(req);
  } catch (err) {
    if (err instanceof UnauthorizedError) return NextResponse.json({ error: err.message }, { status: 401 });
    throw err;
  }
  const dates = await getStore().listBlackoutDates();
  return NextResponse.json({ dates });
}

export async function POST(req: Request) {
  try {
    await requireAdmin(req);
  } catch (err) {
    if (err instanceof UnauthorizedError) return NextResponse.json({ error: err.message }, { status: 401 });
    throw err;
  }
  const json = await req.json().catch(() => null);
  const parsed = blackoutDateSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "入力内容が正しくありません。" }, { status: 400 });
  await getStore().addBlackoutDate(parsed.data);
  return NextResponse.json({ ok: true }, { status: 201 });
}

export async function DELETE(req: Request) {
  try {
    await requireAdmin(req);
  } catch (err) {
    if (err instanceof UnauthorizedError) return NextResponse.json({ error: err.message }, { status: 401 });
    throw err;
  }
  const url = new URL(req.url);
  const date = url.searchParams.get("date");
  if (!date) return NextResponse.json({ error: "date パラメータが必要です。" }, { status: 400 });
  await getStore().removeBlackoutDate(date);
  return NextResponse.json({ ok: true });
}
