import { z } from "zod";
import {
  findOwnedCharacter,
  requireAccountApiKey,
} from "@/lib/api-keys/require-account-key";
import {
  chatKeyDisplay,
  generateChatApiKeySecret,
  setCharacterChatKey,
} from "@/lib/api-keys/chat-keys";
import {
  ensurePlatformOperatorAttestation,
  isPlatformOperatorRequiredError,
} from "@/lib/legal/operator";
import {
  requireWorkspacePermission,
  workspaceAuthResponse,
} from "@/lib/workspace/permissions";

type Params = { params: Promise<{ id: string }> };

const rotateSchema = z.object({
  platformOperatorAccepted: z.boolean().optional(),
});

/** Metadata only — secret is never revealed after create/rotate. */
export async function GET(req: Request, { params }: Params) {
  const auth = await requireAccountApiKey(req, { bucket: "management" });
  if (auth.error) return auth.error;
  const { id } = await params;

  try {
    await requireWorkspacePermission(
      auth.user.id,
      auth.workspaceId,
      "chat_keys.manage",
    );
  } catch (err) {
    const res = workspaceAuthResponse(err);
    if (res) return res;
    throw err;
  }

  const character = await findOwnedCharacter(auth.workspaceId, id);
  if (!character) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const display = chatKeyDisplay(character);
  return Response.json({
    characterId: character.id,
    name: character.name,
    ...display,
    endpoint: "/api/v1/chat",
    usage: {
      header: "X-Api-Key: <chatApiKey>",
      note: "Secret is shown only once on create or rotate.",
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

/** Rotate chat key — returns secret once; invalidates previous vesp_ key. */
export async function POST(req: Request, { params }: Params) {
  const auth = await requireAccountApiKey(req, { bucket: "management" });
  if (auth.error) return auth.error;
  const { id } = await params;

  try {
    await requireWorkspacePermission(
      auth.user.id,
      auth.workspaceId,
      "chat_keys.manage",
    );
  } catch (err) {
    const res = workspaceAuthResponse(err);
    if (res) return res;
    throw err;
  }

  const body = rotateSchema.safeParse(await req.json().catch(() => ({})));
  const platformOperatorAccepted = body.success
    ? body.data.platformOperatorAccepted
    : undefined;

  const character = await findOwnedCharacter(auth.workspaceId, id);
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

  const { raw: chatApiKey } = generateChatApiKeySecret();
  await setCharacterChatKey(character.id, chatApiKey);

  return Response.json({
    characterId: id,
    chatApiKey,
    endpoint: "/api/v1/chat",
    note: "Copy now — this secret will not be shown again.",
  });
}
