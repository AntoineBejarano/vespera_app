import { NextResponse } from "next/server";
import {
  ADULT_COOKIE,
  ADULT_COOKIE_MAX_AGE_SEC,
  LEGAL_VERSION,
} from "@/lib/legal/constants";

/**
 * Standard product access (non-XXX): Terms, Privacy, AI transparency — no adult consent.
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  if (!body.tosAccepted || !body.privacyAccepted || !body.aiDisclosureAccepted) {
    return NextResponse.json(
      {
        error:
          "Terms, Privacy, and AI transparency acknowledgment are required",
      },
      { status: 400 },
    );
  }

  if (body.legalVersion && body.legalVersion !== LEGAL_VERSION) {
    return NextResponse.json(
      { error: "Legal version mismatch — refresh and accept again" },
      { status: 409 },
    );
  }

  const res = NextResponse.json({
    ok: true,
    legalVersion: LEGAL_VERSION,
    zone: "standard",
  });

  res.cookies.set({
    name: ADULT_COOKIE,
    value: LEGAL_VERSION,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ADULT_COOKIE_MAX_AGE_SEC,
  });

  return res;
}
