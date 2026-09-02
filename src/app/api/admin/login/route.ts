import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { adminLoginSchema } from "@/lib/validation";
import { getStore } from "@/lib/store";
import { ADMIN_COOKIE_NAME, ADMIN_SESSION_MAX_AGE_SECONDS, createAdminSessionToken } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = adminLoginSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "メールアドレスとパスワードを入力してください。" }, { status: 400 });
  }
  const { email, password } = parsed.data;
  const admin = await getStore().getAdminByEmail(email);
  if (!admin || !bcrypt.compareSync(password, admin.passwordHash)) {
    return NextResponse.json({ error: "メールアドレスまたはパスワードが正しくありません。" }, { status: 401 });
  }
  const token = await createAdminSessionToken(admin.email);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ADMIN_SESSION_MAX_AGE_SECONDS,
  });
  return res;
}
