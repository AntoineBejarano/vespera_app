import {
  ADULT_CONSENT_COOKIE,
  ADULT_COOKIE,
  ADULT_COOKIE_MAX_AGE_SEC,
  LEGAL_VERSION,
} from "./constants";

/** Shared Set-Cookie options for the product access / legal clickwrap cookie. */
export function accessCookieOptions(value: string = LEGAL_VERSION) {
  return {
    name: ADULT_COOKIE,
    value,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ADULT_COOKIE_MAX_AGE_SEC,
  };
}

export function adultConsentCookieOptions(value: string = LEGAL_VERSION) {
  return {
    name: ADULT_CONSENT_COOKIE,
    value,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ADULT_COOKIE_MAX_AGE_SEC,
  };
}

/** Safe internal path for post-auth / age-gate `next` params. */
export function safeNextPath(raw: string | null | undefined): string | null {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return null;
  if (
    raw.startsWith("/age-gate") ||
    raw.startsWith("/underage") ||
    raw.startsWith("/auth/continue") ||
    raw.startsWith("/handler")
  ) {
    return null;
  }
  return raw;
}

export function accountAgeGateHref(
  nextPath: string,
  zone: "standard" | "adult" = "standard",
) {
  const params = new URLSearchParams({ zone });
  const next = safeNextPath(nextPath);
  if (next) params.set("next", next);
  return `/age-gate?${params.toString()}`;
}
