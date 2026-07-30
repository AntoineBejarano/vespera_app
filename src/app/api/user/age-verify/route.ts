import { prisma } from "@/lib/db";
import { getAppUser } from "@/lib/session";

/** Confirm 18+ after Hexclave sign-up */
export async function POST(req: Request) {
  const user = await getAppUser();
  if (!user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  if (!body.ageConfirmed || !body.adultConsent) {
    return Response.json(
      { error: "Age confirmation and adult consent required" },
      { status: 400 },
    );
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      ageVerifiedAt: new Date(),
      adultConsentAt: new Date(),
    },
  });

  return Response.json({
    ok: true,
    userId: updated.id,
  });
}
