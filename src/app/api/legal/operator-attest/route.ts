import { prisma } from "@/lib/db";
import { getAppUser } from "@/lib/session";
import {
  PLATFORM_OPERATOR_VERSION,
  hasPlatformOperatorAttestation,
} from "@/lib/legal/operator";

export async function GET() {
  const user = await getAppUser();
  if (!user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  return Response.json({
    attested: hasPlatformOperatorAttestation(user),
    version: PLATFORM_OPERATOR_VERSION,
    acceptedVersion: user.platformOperatorVersion,
    acceptedAt: user.platformOperatorAcceptedAt,
  });
}

export async function POST(req: Request) {
  const user = await getAppUser();
  if (!user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  if (!body.platformOperatorAccepted) {
    return Response.json(
      { error: "Platform Operator Responsibilities acceptance required" },
      { status: 400 },
    );
  }

  if (
    body.platformOperatorVersion &&
    body.platformOperatorVersion !== PLATFORM_OPERATOR_VERSION
  ) {
    return Response.json(
      { error: "Operator terms version mismatch — refresh and accept again" },
      { status: 409 },
    );
  }

  const now = new Date();
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      platformOperatorAcceptedAt: now,
      platformOperatorVersion: PLATFORM_OPERATOR_VERSION,
    },
  });

  return Response.json({
    ok: true,
    version: PLATFORM_OPERATOR_VERSION,
    acceptedAt: updated.platformOperatorAcceptedAt,
  });
}
