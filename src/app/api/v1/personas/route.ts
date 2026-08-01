import { prisma } from "@/lib/db";
import { requireAccountApiKey } from "@/lib/api-keys/require-account-key";
import { createPersonaFromBody } from "@/lib/personas/create";
import { serializePersonaListItem } from "@/lib/personas/serialize";

export const maxDuration = 120;

/** List personas for the account (account API key). Never returns chat keys. */
export async function GET(req: Request) {
  const auth = await requireAccountApiKey(req, { bucket: "management" });
  if (auth.error) return auth.error;
  const user = auth.user;

  const characters = await prisma.character.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      name: true,
      intensity: true,
      active: true,
      tagline: true,
      isPublic: true,
      isAdult: true,
      slug: true,
      createdAt: true,
      updatedAt: true,
      apiKey: true,
    },
  });

  return Response.json({
    personas: characters.map(serializePersonaListItem),
  });
}

/**
 * Create a persona with an account API key (vsk_…).
 * Modes:
 * - direct (default): name + soul/style/rules/context markdown
 * - generate: onboarding fields; server expands layers via LLM
 */
export async function POST(req: Request) {
  const auth = await requireAccountApiKey(req, { bucket: "create" });
  if (auth.error) return auth.error;
  const user = auth.user;

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return Response.json({ error: "JSON body required" }, { status: 400 });
  }

  const result = await createPersonaFromBody(user, body);
  if (!result.ok) {
    return Response.json(
      {
        error: result.error,
        details: "details" in result ? result.details : undefined,
      },
      { status: result.status },
    );
  }

  return Response.json(
    {
      persona: {
        id: result.character.id,
        name: result.character.name,
        mode: result.character.mode,
        layers: result.character.layers,
        chatApiKey: result.character.chatApiKey,
      },
    },
    { status: 201 },
  );
}
