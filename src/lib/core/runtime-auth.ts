import { prisma } from "@/lib/db";
import { findCharacterByChatKey } from "@/lib/api-keys/chat-keys";
import {
  extractBearerOrApiKey,
  resolveAccountKeyContext,
  USER_API_KEY_PREFIX,
} from "@/lib/api-keys/user-keys";
import {
  checkApiRateLimit,
  V1_RATE_LIMITS,
} from "@/lib/api-keys/rate-limit";
import { denyAdultEnvelope } from "@/lib/core/isolation";
import { isAfterDarkHost } from "@/lib/hosts";

export type RuntimeCharacter = {
  id: string;
  name: string;
  userId: string;
  workspaceId: string;
  isAdult: boolean;
};

export type RuntimeAuth =
  | {
      character: RuntimeCharacter;
      userId: string;
      workspaceId: string;
    }
  | { error: Response };

function hostFromRequest(req: Request) {
  return req.headers.get("x-forwarded-host") ?? req.headers.get("host");
}

/**
 * Auth for runtime pull endpoints: persona chat key (vesp_) or account key (vsk_)
 * scoped to a character in the same workspace.
 */
export async function requireRuntimeAuth(
  req: Request,
  characterIdFromBody?: string | null,
): Promise<RuntimeAuth> {
  const host = hostFromRequest(req);
  if (isAfterDarkHost(host)) {
    return {
      error: Response.json(
        { error: "After Dark host cannot use the external runtime API." },
        { status: 403 },
      ),
    };
  }

  const raw = extractBearerOrApiKey(req);
  if (!raw) {
    return {
      error: Response.json({ error: "Missing API key." }, { status: 401 }),
    };
  }

  let character: RuntimeCharacter | null = null;

  if (raw.startsWith("vesp_")) {
    const found = await findCharacterByChatKey(raw);
    if (!found) {
      return {
        error: Response.json({ error: "Invalid API key" }, { status: 401 }),
      };
    }
    character = found;
  } else if (raw.startsWith(USER_API_KEY_PREFIX)) {
    const ctx = await resolveAccountKeyContext(raw);
    if (!ctx) {
      return {
        error: Response.json(
          { error: "Invalid or revoked API key" },
          { status: 401 },
        ),
      };
    }
    const id = characterIdFromBody?.trim();
    if (!id) {
      return {
        error: Response.json(
          { error: "characterId required when using an account key (vsk_)." },
          { status: 400 },
        ),
      };
    }
    character = await prisma.character.findFirst({
      where: { id, workspaceId: ctx.workspaceId, archivedAt: null },
      select: {
        id: true,
        name: true,
        userId: true,
        workspaceId: true,
        isAdult: true,
      },
    });
    if (!character) {
      return {
        error: Response.json({ error: "Not found" }, { status: 404 }),
      };
    }
  } else {
    return {
      error: Response.json({ error: "Invalid key type." }, { status: 401 }),
    };
  }

  const blocked = denyAdultEnvelope(character);
  if (blocked) {
    return {
      error: Response.json({ error: blocked.error }, { status: blocked.status }),
    };
  }

  const rl = await checkApiRateLimit({
    userId: character.userId,
    bucket: `runtime:${character.id}`,
    limitPerMinute: V1_RATE_LIMITS.runtime,
  });
  if (!rl.ok) {
    return {
      error: Response.json(
        {
          error: "Rate limit exceeded. Slow down and retry.",
          limitPerMinute: rl.limit,
          retryAfterSec: rl.retryAfterSec,
        },
        {
          status: 429,
          headers: { "Retry-After": String(rl.retryAfterSec) },
        },
      ),
    };
  }

  return {
    character,
    userId: character.userId,
    workspaceId: character.workspaceId,
  };
}
