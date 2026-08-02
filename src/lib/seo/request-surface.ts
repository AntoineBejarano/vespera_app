import { headers } from "next/headers";
import {
  AFTER_DARK_HOST,
  AFTER_DARK_URL,
  isAfterDarkHost,
  normalizeHost,
} from "@/lib/hosts";
import { SITE_DOMAIN, SITE_URL } from "@/lib/site";

export type SiteSurface = "apex" | "after-dark";

export type RequestSurface = {
  surface: SiteSurface;
  /** Absolute origin without trailing slash */
  origin: string;
  /** Hostname only (no scheme) for robots Host */
  host: string;
};

/**
 * Resolve marketing surface from the incoming Host.
 * Defaults to apex when headers are unavailable (build / static fallback).
 */
export async function getRequestSurface(): Promise<RequestSurface> {
  try {
    const h = await headers();
    const raw = h.get("x-forwarded-host") ?? h.get("host");
    const host = normalizeHost(raw);
    if (isAfterDarkHost(host)) {
      return {
        surface: "after-dark",
        origin: AFTER_DARK_URL,
        host: AFTER_DARK_HOST,
      };
    }
  } catch {
    // headers() unavailable outside a request — apex is safe default
  }

  return {
    surface: "apex",
    origin: SITE_URL,
    host: SITE_DOMAIN,
  };
}
