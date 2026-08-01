import type { NextRequest } from "next/server";
import { SITE_URL } from "@/lib/site";

/**
 * Public browser origin for redirects behind Railway/Docker.
 *
 * Next binds on HOSTNAME=0.0.0.0 (and Railway may use PORT=8080). If redirects
 * use request.nextUrl.origin blindly, users get sent to https://0.0.0.0:8080/…
 */
export function publicOrigin(request: NextRequest | Request): string {
  const headers = request.headers;
  const forwardedHost = firstHeader(headers.get("x-forwarded-host"));
  const host = firstHeader(headers.get("host"));
  const proto =
    firstHeader(headers.get("x-forwarded-proto")) ||
    (process.env.NODE_ENV === "production" ? "https" : "http");

  const candidate = forwardedHost || host;
  if (candidate && !isInternalBindHost(candidate)) {
    return `${proto}://${candidate}`;
  }

  const fromEnv =
    process.env.APP_URL?.replace(/\/$/, "") ||
    process.env.AUTH_URL?.replace(/\/$/, "") ||
    process.env.NEXTAUTH_URL?.replace(/\/$/, "");
  if (fromEnv && !isInternalBindHost(fromEnv)) {
    return fromEnv;
  }

  return SITE_URL;
}

export function publicUrl(
  request: NextRequest | Request,
  path: string,
): URL {
  return new URL(path, publicOrigin(request));
}

function firstHeader(value: string | null): string | null {
  if (!value) return null;
  return value.split(",")[0]?.trim() || null;
}

function isInternalBindHost(value: string): boolean {
  const host = value
    .replace(/^https?:\/\//, "")
    .split("/")[0]
    ?.toLowerCase();
  if (!host) return true;
  return (
    host.startsWith("0.0.0.0") ||
    host.startsWith("127.0.0.1") ||
    host.startsWith("localhost") && process.env.NODE_ENV === "production"
  );
}
