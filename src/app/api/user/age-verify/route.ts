import { prisma } from "@/lib/db";
import { getAppUser } from "@/lib/session";
import { LEGAL_VERSION } from "@/lib/legal/constants";

/** Legal + AI transparency attestation (standard) or adult gate (After Dark). */
export async function POST(req: Request) {
  const user = await getAppUser();
  if (!user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const zone = body.zone === "adult" ? "adult" : "standard";

  if (!body.tosAccepted || !body.privacyAccepted) {
    return Response.json(
      { error: "Terms and Privacy acceptance required" },
      { status: 400 },
    );
  }

  if (zone === "adult") {
    if (!body.ageConfirmed || !body.adultConsent) {
      return Response.json(
        { error: "Age confirmation and adult consent required" },
        { status: 400 },
      );
    }
  } else if (!body.aiDisclosureAccepted) {
    return Response.json(
      { error: "AI transparency acknowledgment required" },
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
      tosAcceptedAt: now,
      privacyAcceptedAt: now,
      legalVersionAccepted: LEGAL_VERSION,
      adultConsentAt: zone === "adult" ? now : user.adultConsentAt,
      settings: {
        upsert: {
          create: {
            adultConsent: zone === "adult",
            language: "en",
          },
          update: {
            ...(zone === "adult" ? { adultConsent: true } : {}),
          },
        },
      },
    },
  });

  return Response.json({
    ok: true,
    userId: updated.id,
    legalVersion: LEGAL_VERSION,
    zone,
  });
}
