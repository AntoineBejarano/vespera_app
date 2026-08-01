import { NextResponse } from "next/server";
import {
  accessCookieOptions,
  adultConsentCookieOptions,
} from "@/lib/legal/access-cookie";
import {
  ADULT_CONSENT_COOKIE,
  ADULT_COOKIE,
  LEGAL_VERSION,
} from "@/lib/legal/constants";

/**
 * Public endpoint: records browser adult + legal clickwrap via httpOnly cookie.
 * Authenticated DB attestation remains POST /api/user/age-verify.
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  if (
    !body.ageConfirmed ||
    !body.adultConsent ||
    !body.tosAccepted ||
    !body.privacyAccepted
  ) {
    return NextResponse.json(
      {
        error:
          "Age confirmation, adult consent, Terms, and Privacy acceptance required",
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
  });

  res.cookies.set(accessCookieOptions());
  res.cookies.set(adultConsentCookieOptions());

  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set({
    ...accessCookieOptions(""),
    name: ADULT_COOKIE,
    value: "",
    maxAge: 0,
  });
  res.cookies.set({
    ...adultConsentCookieOptions(""),
    name: ADULT_CONSENT_COOKIE,
    value: "",
    maxAge: 0,
  });
  return res;
}
