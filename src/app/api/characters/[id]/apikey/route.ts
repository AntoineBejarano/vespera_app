import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAppUser } from "@/lib/session";
import {
  chatKeyDisplay,
  generateChatApiKeySecret,
  setCharacterChatKey,
} from "@/lib/api-keys/chat-keys";
import {
  ensurePlatformOperatorAttestation,
  isPlatformOperatorRequiredError,
} from "@/lib/legal/operator";
import { getOrCreateActiveWorkspaceId } from "@/lib/workspace/ensure";
import {
  requireWorkspacePermission,
  workspaceAuthResponse,
} from "@/lib/workspace/permissions";

type Params = { params: Promise<{ id: string }> };

const postSchema = z.object({
  platformOperatorAccepted: z.boolean().optional(),
});

/** Metadata only — no permanent reveal. */
export async function GET(_req: Request, { params }: Params) {
  const user = await requireAppUser().catch(() => null);
  if (!user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }
  const { id } = await params;
  const workspaceId = await getOrCreateActiveWorkspaceId(user);

  try {
    await requireWorkspacePermission(user.id, workspaceId, "chat_keys.manage");
  } catch (err) {
    const res = workspaceAuthResponse(err);
    if (res) return res;
    throw err;
  }

  const character = await prisma.character.findFirst({
    where: { id, workspaceId, archivedAt: null },
    select: {
      id: true,
      name: true,
      apiKey: true,
      apiKeyPrefix: true,
      apiKeyLastFour: true,
      apiKeyHash: true,
    },
  });
  if (!character) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  return Response.json({
    characterId: character.id,
    name: character.name,
    ...chatKeyDisplay(character),
    endpoint: "/api/v1/chat",
    usage: {
      header: "X-Api-Key: <apiKey>",
      note: "Secret is shown only once on create or rotate.",
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
  const workspaceId = await getOrCreateActiveWorkspaceId(user);

  try {
    await requireWorkspacePermission(user.id, workspaceId, "chat_keys.manage");
  } catch (err) {
    const res = workspaceAuthResponse(err);
    if (res) return res;
    throw err;
  }

  const body = postSchema.safeParse(await req.json().catch(() => ({})));
  const platformOperatorAccepted = body.success
    ? body.data.platformOperatorAccepted
    : undefined;

  const character = await prisma.character.findFirst({
    where: { id, workspaceId, archivedAt: null },
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

  const { raw: apiKey } = generateChatApiKeySecret();
  await setCharacterChatKey(id, apiKey);

  return Response.json({
    characterId: id,
    apiKey,
    endpoint: "/api/v1/chat",
    note: "Copy now — this secret will not be shown again.",
  });
}
