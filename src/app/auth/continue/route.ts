import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getAppUser } from "@/lib/session";
import { needsAccountAgeGate } from "@/lib/legal/gate";
import {
  accessCookieOptions,
  accountAgeGateHref,
  safeNextPath,
} from "@/lib/legal/access-cookie";
import {
  ADULT_CONSENT_COOKIE,
  ADULT_COOKIE,
  LEGAL_VERSION,
} from "@/lib/legal/constants";

/**
 * Single post-auth landing for Hexclave afterSignIn / afterSignUp.
 *
 * - Account already attested → re-issue access cookie, go to destination
 * - Browser already clickwrapped (cookie) but account not yet → persist once, continue
 * - Otherwise → age-gate once with `next` preserved
 */
export async function GET(req: NextRequest) {
  const url = req.nextUrl;
  const next = safeNextPath(url.searchParams.get("next")) || "/personas";
  const user = await getAppUser();

  if (!user) {
    const signIn = new URL("/handler/sign-in", url.origin);
    signIn.searchParams.set(
      "after_auth_return_to",
      `/auth/continue?next=${encodeURIComponent(next)}`,
    );
    return NextResponse.redirect(signIn);
  }

  const hasValidAccessCookie =
    req.cookies.get(ADULT_COOKIE)?.value === LEGAL_VERSION;
  const hasAdultConsentCookie =
    req.cookies.get(ADULT_CONSENT_COOKIE)?.value === LEGAL_VERSION;

  if (needsAccountAgeGate(user)) {
    if (!hasValidAccessCookie) {
      return NextResponse.redirect(
        new URL(accountAgeGateHref(next, "standard"), url.origin),
      );
    }

    // Pre-auth age-gate already collected clickwrap — attach it to the account.
    const now = new Date();
    await prisma.user.update({
      where: { id: user.id },
      data: {
        ageVerifiedAt: now,
        tosAcceptedAt: now,
        privacyAcceptedAt: now,
        legalVersionAccepted: LEGAL_VERSION,
        ...(hasAdultConsentCookie ? { adultConsentAt: now } : {}),
        ...(hasAdultConsentCookie
          ? {
              settings: {
                upsert: {
                  create: { adultConsent: true, language: "en" },
                  update: { adultConsent: true },
                },
              },
            }
          : {}),
      },
    });
  }

  const res = NextResponse.redirect(new URL(next, url.origin));
  res.cookies.set(accessCookieOptions());
  return res;
}
