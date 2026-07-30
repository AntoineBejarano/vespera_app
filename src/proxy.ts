import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ADULT_COOKIE, LEGAL_VERSION } from "@/lib/legal/constants";

function hasValidAdultCookie(request: NextRequest) {
  return request.cookies.get(ADULT_COOKIE)?.value === LEGAL_VERSION;
}

function isAgeExempt(pathname: string) {
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/handler") ||
    pathname.startsWith("/brand") ||
    pathname.startsWith("/icon") ||
    pathname.startsWith("/apple-icon")
  ) {
    return true;
  }

  if (
    pathname === "/age-gate" ||
    pathname === "/underage" ||
    pathname.startsWith("/legal")
  ) {
    return true;
  }

  return false;
}

/**
 * Soft auth redirects + hard adult access wall (cookie = current legal version).
 * Page/API layers still call getAppUser / ageVerifiedAt for account-level gates.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Legacy auth routes → same-domain Hexclave handler pages
  if (pathname === "/login" || pathname === "/register") {
    const url = request.nextUrl.clone();
    url.pathname =
      pathname === "/register" ? "/handler/sign-up" : "/handler/sign-in";
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (!isAgeExempt(pathname) && !hasValidAdultCookie(request)) {
    const url = request.nextUrl.clone();
    url.pathname = "/age-gate";
    const next = `${pathname}${request.nextUrl.search}`;
    url.search = "";
    if (next && next !== "/") {
      url.searchParams.set("next", next);
    }
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|.*\\..*).*)"],
};
