import { prisma } from "@/lib/db";
import {
  extractBearerOrApiKey,
  resolveUserFromApiKey,
  USER_API_KEY_PREFIX,
} from "@/lib/api-keys/user-keys";
import { createPersonaFromBody } from "@/lib/personas/create";

export const maxDuration = 120;

async function requireKeyUser(req: Request) {
  const raw = extractBearerOrApiKey(req);
  if (!raw) {
    return {
      error: Response.json(
        {
          error: `Missing API key. Use header X-Api-Key: ${USER_API_KEY_PREFIX}… (account key from Settings).`,
        },
        { status: 401 },
      ),
    };
  }
  if (raw.startsWith("vesp_") && !raw.startsWith(USER_API_KEY_PREFIX)) {
    return {
      error: Response.json(
        {
          error:
            "This looks like a persona chat key (vesp_…). Use an account key (vsk_…) from Settings → API keys to create personas.",
        },
        { status: 401 },
      ),
    };
  }
  const user = await resolveUserFromApiKey(raw);
  if (!user) {
    return {
      error: Response.json({ error: "Invalid or revoked API key" }, { status: 401 }),
    };
  }
  return { user };
}

/** List personas for the account (account API key). */
export async function GET(req: Request) {
  const auth = await requireKeyUser(req);
  if ("error" in auth && auth.error) return auth.error;
  const user = auth.user!;

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
    personas: characters.map((c) => ({
      id: c.id,
      name: c.name,
      intensity: c.intensity,
      active: c.active,
      tagline: c.tagline,
      isPublic: c.isPublic,
      isAdult: c.isAdult,
      slug: c.slug,
      hasChatApiKey: Boolean(c.apiKey),
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    })),
  });
}

/**
 * Create a persona with an account API key (vsk_…).
 * Modes:
 * - direct (default): name + soul/style/rules/context markdown
 * - generate: onboarding fields; server expands layers via LLM
 */
export async function POST(req: Request) {
  const auth = await requireKeyUser(req);
  if ("error" in auth && auth.error) return auth.error;
  const user = auth.user!;

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return Response.json({ error: "JSON body required" }, { status: 400 });
  }

  const result = await createPersonaFromBody(user, body);
  if (!result.ok) {
    return Response.json(
      { error: result.error, details: "details" in result ? result.details : undefined },
      { status: result.status },
    );
  }

  return Response.json({
    persona: {
      id: result.character.id,
      name: result.character.name,
      mode: result.character.mode,
      layers: result.character.layers,
      chatApiKey: result.character.chatApiKey,
    },
  });
}
