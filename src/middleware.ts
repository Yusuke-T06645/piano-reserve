import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME, verifyAdminSessionToken } from "@/lib/auth";

export const config = {
  matcher: ["/admin/:path*"],
};

export async function middleware(req: NextRequest) {
  if (req.nextUrl.pathname.startsWith("/admin/login")) {
    return NextResponse.next();
  }
  const token = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
  const session = token ? await verifyAdminSessionToken(token) : null;
  if (!session) {
    const loginUrl = new URL("/admin/login", req.url);
    loginUrl.searchParams.set("next", req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
}
