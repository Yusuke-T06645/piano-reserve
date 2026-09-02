import { SignJWT, jwtVerify } from "jose";

const COOKIE_NAME = "admin_session";
const SESSION_HOURS = 12;

function getSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET || "dev-only-insecure-secret-change-me";
  return new TextEncoder().encode(secret);
}

export async function createAdminSessionToken(email: string): Promise<string> {
  return new SignJWT({ email, role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_HOURS}h`)
    .sign(getSecret());
}

export async function verifyAdminSessionToken(token: string): Promise<{ email: string } | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (payload.role !== "admin" || typeof payload.email !== "string") return null;
    return { email: payload.email };
  } catch {
    return null;
  }
}

export const ADMIN_COOKIE_NAME = COOKIE_NAME;
export const ADMIN_SESSION_MAX_AGE_SECONDS = SESSION_HOURS * 3600;

export class UnauthorizedError extends Error {}

/** APIルート内で管理者セッションを検証するためのヘルパー。未認証なら例外を投げる。 */
export async function requireAdmin(req: Request): Promise<{ email: string }> {
  const cookieHeader = req.headers.get("cookie") || "";
  const match = cookieHeader.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
  if (!match) throw new UnauthorizedError("管理者ログインが必要です。");
  const session = await verifyAdminSessionToken(decodeURIComponent(match[1]));
  if (!session) throw new UnauthorizedError("セッションが無効です。再度ログインしてください。");
  return session;
}
