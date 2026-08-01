/**
 * Host helpers for the After Dark (XXX) subdomain.
 * Same Railway deploy serves both vesperer.com and xxx.vesperer.com.
 */

export const AFTER_DARK_HOST =
  process.env.NEXT_PUBLIC_AFTER_DARK_HOST?.replace(/:\d+$/, "").toLowerCase() ||
  "xxx.vesperer.com";

export const AFTER_DARK_URL =
  process.env.NEXT_PUBLIC_AFTER_DARK_URL?.replace(/\/$/, "") ||
  `https://${AFTER_DARK_HOST}`;

/** Strip port from Host header. */
export function normalizeHost(host: string | null | undefined): string {
  return (host ?? "").split(":")[0]?.toLowerCase() ?? "";
}

/** True when the request is on the After Dark / XXX host. */
export function isAfterDarkHost(host: string | null | undefined): boolean {
  const h = normalizeHost(host);
  if (!h) return false;
  if (h === AFTER_DARK_HOST) return true;
  // Local subdomain testing: xxx.localhost
  if (h === "xxx.localhost") return true;
  return false;
}

/** Apex / www main marketing host (not XXX). */
export function isMainSiteHost(host: string | null | undefined): boolean {
  const h = normalizeHost(host);
  if (!h) return true;
  if (isAfterDarkHost(h)) return false;
  // Keep /after-dark usable without hopping to the prod XXX subdomain.
  if (h === "localhost" || h === "127.0.0.1") return false;
  if (h.endsWith(".railway.app")) return false;
  return true;
}
