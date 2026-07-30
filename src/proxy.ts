import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const publicPaths = ["/", "/login", "/register", "/age-gate"];

function sessionCookieName(request: NextRequest) {
  // Auth.js v5 cookie names (not legacy next-auth.*)
  const proto =
    request.headers.get("x-forwarded-proto") ??
    request.nextUrl.protocol.replace(":", "");
  const secure = proto === "https";
  return secure
    ? "__Secure-authjs.session-token"
    : "authjs.session-token";
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon")
  ) {
    return NextResponse.next();
  }

  const isPublic = publicPaths.includes(pathname);
  const cookieName = sessionCookieName(request);
  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
    secureCookie: cookieName.startsWith("__Secure-"),
    cookieName,
    salt: cookieName,
  });

  if (!isPublic && !pathname.startsWith("/api") && !token) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  if (token && (pathname === "/login" || pathname === "/register")) {
    const url = request.nextUrl.clone();
    url.pathname = "/personas";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|.*\\..*).*)"],
};
