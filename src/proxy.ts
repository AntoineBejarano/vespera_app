import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const publicPaths = new Set([
  "/",
  "/login",
  "/register",
  "/age-gate",
  "/pricing",
]);

/**
 * Soft gate — Hexclave hosted auth handles sign-in.
 * Page/API layers call getAppUser for real protection.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/handler")
  ) {
    return NextResponse.next();
  }

  // Legacy auth routes → same-domain Hexclave handler pages
  if (pathname === "/login" || pathname === "/register") {
    const url = request.nextUrl.clone();
    url.pathname =
      pathname === "/register" ? "/handler/sign-up" : "/handler/sign-in";
    url.search = "";
    return NextResponse.redirect(url);
  }

  void publicPaths;
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|.*\\..*).*)"],
};
