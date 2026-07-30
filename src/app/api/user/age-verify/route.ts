import { prisma } from "@/lib/db";
import { getAppUser } from "@/lib/session";
import { LEGAL_VERSION } from "@/lib/legal/constants";

/** Confirm 18+ + legal clickwrap after Hexclave sign-up / account gate */
export async function POST(req: Request) {
  const user = await getAppUser();
  if (!user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  if (
    !body.ageConfirmed ||
    !body.adultConsent ||
    !body.tosAccepted ||
    !body.privacyAccepted
  ) {
    return Response.json(
      {
        error:
          "Age confirmation, adult consent, Terms, and Privacy acceptance required",
      },
      { status: 400 },
    );
  }

  if (body.legalVersion && body.legalVersion !== LEGAL_VERSION) {
    return Response.json(
      { error: "Legal version mismatch — refresh and accept again" },
      { status: 409 },
    );
  }

  const now = new Date();
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      ageVerifiedAt: now,
      adultConsentAt: now,
      tosAcceptedAt: now,
      privacyAcceptedAt: now,
      legalVersionAccepted: LEGAL_VERSION,
      settings: {
        upsert: {
          create: {
            adultConsent: true,
            language: "en",
          },
          update: {
            adultConsent: true,
          },
        },
      },
    },
  });

  return Response.json({
    ok: true,
    userId: updated.id,
    legalVersion: LEGAL_VERSION,
  });
}
