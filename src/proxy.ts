import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  AFTER_DARK_URL,
  isAfterDarkHost,
  isMainSiteHost,
  normalizeHost,
} from "@/lib/hosts";
import { publicOrigin } from "@/lib/request-origin";
import { SITE_DOMAIN, SITE_URL } from "@/lib/site";

function isAgeExempt(pathname: string) {
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/handler") ||
    pathname.startsWith("/auth/continue") ||
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
    pathname === "/business" ||
    pathname.startsWith("/business/") ||
    pathname === "/technology" ||
    pathname === "/voice" ||
    pathname === "/explore" ||
    pathname === "/ai-characters" ||
    pathname === "/historical-ai" ||
    pathname === "/ai-tutors" ||
    pathname === "/ai-employees" ||
    pathname === "/character-tools" ||
    pathname.startsWith("/meet/") ||
    pathname.startsWith("/learn/") ||
    pathname.startsWith("/hire/") ||
    pathname.startsWith("/create/") ||
    pathname.startsWith("/characters/") ||
    pathname.startsWith("/historical-figures/") ||
    pathname.startsWith("/use-cases/") ||
    pathname.startsWith("/integrations/") ||
    pathname.startsWith("/c/") ||
    pathname.startsWith("/p/") ||
    pathname === "/registry" ||
    pathname === "/chai-character-creator" ||
    pathname === "/chai-character-backup" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    pathname.startsWith("/sitemap/") ||
    pathname === "/llms.txt" ||
    pathname === "/llm.txt" ||
    pathname === "/llms-full.txt" ||
    pathname === "/skill" ||
    pathname === "/skill.md" ||
    pathname.startsWith("/skill/") ||
    pathname === "/developers" ||
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
 * Soft auth redirects + host routing.
 * Apex SFW: no mandatory age-gate cookie (AI transparency is in-product).
 * After Dark host: public partner landing only; app routes bounce to landing.
 */
function publicNextUrl(request: NextRequest) {
  // Rebuild from public origin so Docker/Railway HOSTNAME=0.0.0.0 never leaks
  // into absolute Location headers.
  return new URL(
    `${request.nextUrl.pathname}${request.nextUrl.search}`,
    publicOrigin(request),
  );
}

function redirectAwayFromWww(pathname: string, search: string) {
  return NextResponse.redirect(`${SITE_URL}${pathname}${search}`, 301);
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const host = normalizeHost(
    request.headers.get("x-forwarded-host") || request.headers.get("host"),
  );

  if (host === `www.${SITE_DOMAIN}`) {
    return redirectAwayFromWww(pathname, search);
  }

  // Soft ?auth= on homepage → handler (no client Hexclave on `/`)
  if (pathname === "/") {
    const auth = request.nextUrl.searchParams.get("auth");
    if (auth === "signin" || auth === "signup") {
      const url = publicNextUrl(request);
      url.pathname = auth === "signup" ? "/handler/sign-up" : "/handler/sign-in";
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  // Legacy auth routes → same-domain Hexclave handler pages
  if (pathname === "/login" || pathname === "/register") {
    const url = publicNextUrl(request);
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
      const url = publicNextUrl(request);
      url.pathname = pathname.replace(/^\/after-dark/, "") || "/";
      return NextResponse.redirect(url, 308);
    }

    if (pathname === "/") {
      const url = request.nextUrl.clone();
      url.pathname = "/after-dark";
      return NextResponse.rewrite(url);
    }

    // Partner invite-only: keep legal/report/brand public; send app routes to landing
    if (
      !isAgeExempt(pathname) &&
      !pathname.startsWith("/handler") &&
      !pathname.startsWith("/auth/")
    ) {
      const url = publicNextUrl(request);
      url.pathname = "/";
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  // Apex: no mandatory access-cookie wall (AI transparency is in-product).

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-vesperer-path", `${pathname}${search}`);
  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|.*\\..*).*)"],
};
