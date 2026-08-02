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
import { publicUrl } from "@/lib/request-origin";

/**
 * Single post-auth landing for Hexclave afterSignIn / afterSignUp.
 *
 * - Account already attested → re-issue access cookie, go to destination
 * - Browser already clickwrapped (cookie) but account not yet → persist once, continue
 * - Otherwise → age-gate once with `next` preserved
 */
export async function GET(req: NextRequest) {
  const next = safeNextPath(req.nextUrl.searchParams.get("next")) || "/personas";
  const user = await getAppUser();

  if (!user) {
    const signIn = publicUrl(req, "/handler/sign-in");
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
        publicUrl(req, accountAgeGateHref(next, "standard")),
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

  const res = NextResponse.redirect(publicUrl(req, next));
  res.cookies.set(accessCookieOptions());
  return res;
}
