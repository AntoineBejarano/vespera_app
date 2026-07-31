import { randomBytes } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAppUser, getAppUser } from "@/lib/session";
import {
  ensurePlatformOperatorAttestation,
  isPlatformOperatorRequiredError,
} from "@/lib/legal/operator";

type Params = { params: Promise<{ id: string }> };

const postSchema = z.object({
  platformOperatorAccepted: z.boolean().optional(),
});

/** Reveal or rotate API key for a persona */
export async function GET(_req: Request, { params }: Params) {
  const user = await requireAppUser().catch(() => null);
  if (!user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }
  const { id } = await params;

  const character = await prisma.character.findFirst({
    where: { id, userId: user.id },
    select: { id: true, name: true, apiKey: true },
  });
  if (!character) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  return Response.json({
    characterId: character.id,
    name: character.name,
    apiKey: character.apiKey,
    endpoint: "/api/v1/chat",
    usage: {
      header: "X-Api-Key: <apiKey>",
      body: {
        message: "hey",
        peerId: "optional-stable-id",
        endUserAgeAttested: true,
      },
      operatorDuties:
        "You must verify end users are 18+ before chat and pass endUserAgeAttested:true. You are responsible for your integrator audience.",
    },
  });
}

export async function POST(req: Request, { params }: Params) {
  const user = await requireAppUser().catch(() => null);
  if (!user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }
  const { id } = await params;

  const body = postSchema.safeParse(await req.json().catch(() => ({})));
  const platformOperatorAccepted = body.success
    ? body.data.platformOperatorAccepted
    : undefined;

  const character = await prisma.character.findFirst({
    where: { id, userId: user.id },
  });
  if (!character) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  try {
    await ensurePlatformOperatorAttestation({
      userId: user.id,
      user,
      platformOperatorAccepted,
    });
  } catch (err) {
    if (isPlatformOperatorRequiredError(err)) {
      return Response.json({ error: err.message, code: err.code }, { status: 403 });
    }
    throw err;
  }

  const apiKey = `vesp_${randomBytes(24).toString("hex")}`;
  await prisma.character.update({
    where: { id },
    data: { apiKey },
  });

  return Response.json({
    characterId: id,
    apiKey,
    endpoint: "/api/v1/chat",
  });
}
