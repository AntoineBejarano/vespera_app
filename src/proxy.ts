import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ADULT_COOKIE, LEGAL_VERSION } from "@/lib/legal/constants";
import {
  AFTER_DARK_URL,
  isAfterDarkHost,
  isMainSiteHost,
  normalizeHost,
} from "@/lib/hosts";

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

  // Public marketing + SEO surfaces (authenticated product routes stay gated).
  if (
    pathname === "/" ||
    pathname === "/after-dark" ||
    pathname === "/bring" ||
    pathname === "/technology" ||
    pathname === "/voice" ||
    pathname === "/docs" ||
    pathname.startsWith("/docs/") ||
    pathname === "/help" ||
    pathname.startsWith("/help/") ||
    pathname === "/explore" ||
    pathname.startsWith("/meet/") ||
    pathname.startsWith("/learn/") ||
    pathname.startsWith("/hire/") ||
    pathname.startsWith("/create/") ||
    pathname.startsWith("/characters/") ||
    pathname.startsWith("/historical-figures/") ||
    pathname.startsWith("/use-cases/") ||
    pathname.startsWith("/c/") ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    pathname.startsWith("/sitemap/") ||
    pathname === "/opengraph-image" ||
    pathname === "/twitter-image" ||
    pathname === "/age-gate" ||
    pathname === "/underage" ||
    pathname === "/report" ||
    pathname.startsWith("/legal")
  ) {
    return true;
  }

  return false;
}

function afterDarkPublicUrl(pathname: string, search: string) {
  // Canonical XXX home is `/` (internally rewritten to /after-dark).
  const path =
    pathname === "/after-dark" || pathname.startsWith("/after-dark/")
      ? pathname.replace(/^\/after-dark/, "") || "/"
      : pathname;
  return `${AFTER_DARK_URL}${path}${search}`;
}

/**
 * Soft auth redirects + hard adult access wall (cookie = current legal version).
 * Host routing: xxx.vesperer.com serves After Dark; apex redirects /after-dark → XXX.
 * Page/API layers still call getAppUser / ageVerifiedAt for account-level gates.
 */
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const host = normalizeHost(request.headers.get("host"));

  // Legacy auth routes → same-domain Hexclave handler pages
  if (pathname === "/login" || pathname === "/register") {
    const url = request.nextUrl.clone();
    url.pathname =
      pathname === "/register" ? "/handler/sign-up" : "/handler/sign-in";
    url.search = "";
    return NextResponse.redirect(url);
  }

  // Main site → permanent redirect After Dark path to XXX subdomain
  if (
    isMainSiteHost(host) &&
    (pathname === "/after-dark" || pathname.startsWith("/after-dark/"))
  ) {
    return NextResponse.redirect(afterDarkPublicUrl(pathname, search), 308);
  }

  // XXX subdomain: canonicalize /after-dark → /, rewrite / → /after-dark
  if (isAfterDarkHost(host)) {
    if (pathname === "/after-dark" || pathname.startsWith("/after-dark/")) {
      const url = request.nextUrl.clone();
      url.pathname = pathname.replace(/^\/after-dark/, "") || "/";
      return NextResponse.redirect(url, 308);
    }

    if (pathname === "/") {
      const url = request.nextUrl.clone();
      url.pathname = "/after-dark";
      return NextResponse.rewrite(url);
    }
  }

  if (!isAgeExempt(pathname) && !hasValidAdultCookie(request)) {
    const url = request.nextUrl.clone();
    url.pathname = "/age-gate";
    url.searchParams.set("zone", "standard");
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
