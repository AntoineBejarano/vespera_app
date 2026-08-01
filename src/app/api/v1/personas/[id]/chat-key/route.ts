import { randomBytes } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/db";
import {
  findOwnedCharacter,
  requireAccountApiKey,
} from "@/lib/api-keys/require-account-key";
import {
  ensurePlatformOperatorAttestation,
  isPlatformOperatorRequiredError,
} from "@/lib/legal/operator";

type Params = { params: Promise<{ id: string }> };

const rotateSchema = z.object({
  platformOperatorAccepted: z.boolean().optional(),
});

/** Reveal chat key (vesp_…) for a persona you own. */
export async function GET(req: Request, { params }: Params) {
  const auth = await requireAccountApiKey(req, { bucket: "management" });
  if (auth.error) return auth.error;
  const { id } = await params;

  const character = await findOwnedCharacter(auth.user.id, id);
  if (!character) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  return Response.json({
    characterId: character.id,
    name: character.name,
    chatApiKey: character.apiKey,
    endpoint: "/api/v1/chat",
    usage: {
      header: "X-Api-Key: <chatApiKey>",
      body: {
        message: "hey",
        peerId: "optional-stable-id",
        endUserAgeAttested: true,
      },
      operatorDuties:
        "You must verify end users are 18+ before chat and pass endUserAgeAttested:true.",
    },
  });
}

/** Rotate chat key — invalidates the previous vesp_ key. */
export async function POST(req: Request, { params }: Params) {
  const auth = await requireAccountApiKey(req, { bucket: "management" });
  if (auth.error) return auth.error;
  const { id } = await params;

  const body = rotateSchema.safeParse(await req.json().catch(() => ({})));
  const platformOperatorAccepted = body.success
    ? body.data.platformOperatorAccepted
    : undefined;

  const character = await findOwnedCharacter(auth.user.id, id);
  if (!character) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  try {
    await ensurePlatformOperatorAttestation({
      userId: auth.user.id,
      user: auth.user,
      platformOperatorAccepted,
    });
  } catch (err) {
    if (isPlatformOperatorRequiredError(err)) {
      return Response.json(
        { error: err.message, code: err.code },
        { status: 403 },
      );
    }
    throw err;
  }

  const chatApiKey = `vesp_${randomBytes(24).toString("hex")}`;
  await prisma.character.update({
    where: { id: character.id },
    data: { apiKey: chatApiKey },
  });

  return Response.json({
    characterId: id,
    chatApiKey,
    endpoint: "/api/v1/chat",
  });
}
