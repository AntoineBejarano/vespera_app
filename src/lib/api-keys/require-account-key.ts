import type { User } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import {
  extractBearerOrApiKey,
  resolveAccountKeyContext,
  USER_API_KEY_PREFIX,
} from "@/lib/api-keys/user-keys";
import {
  checkApiRateLimit,
  V1_RATE_LIMITS,
} from "@/lib/api-keys/rate-limit";

export type AccountKeyAuth =
  | { user: User; workspaceId: string; error?: undefined }
  | { user?: undefined; workspaceId?: undefined; error: Response };

function rateLimitResponse(retryAfterSec: number, limit: number) {
  return Response.json(
    {
      error: "Rate limit exceeded. Slow down and retry.",
      limitPerMinute: limit,
      retryAfterSec,
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfterSec),
        "X-RateLimit-Limit": String(limit),
      },
    },
  );
}

/**
 * Resolve account API key (vsk_…) for management routes.
 * Workspace is derived from the key itself — never from X-Workspace-Id.
 */
export async function requireAccountApiKey(
  req: Request,
  opts?: {
    /** Rate-limit bucket name (default: management). */
    bucket?: keyof typeof V1_RATE_LIMITS | string;
    limitPerMinute?: number;
  },
): Promise<AccountKeyAuth> {
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
            "This looks like a persona chat key (vesp_…). Use an account key (vsk_…) from Settings → API keys for management endpoints.",
        },
        { status: 401 },
      ),
    };
  }

  if (!raw.startsWith(USER_API_KEY_PREFIX)) {
    return {
      error: Response.json(
        {
          error: `Invalid key type. Management endpoints require ${USER_API_KEY_PREFIX}… account keys.`,
        },
        { status: 401 },
      ),
    };
  }

  const ctx = await resolveAccountKeyContext(raw);
  if (!ctx) {
    return {
      error: Response.json(
        { error: "Invalid or revoked API key" },
        { status: 401 },
      ),
    };
  }

  const bucket = opts?.bucket ?? "management";
  const limit =
    opts?.limitPerMinute ??
    (bucket in V1_RATE_LIMITS
      ? V1_RATE_LIMITS[bucket as keyof typeof V1_RATE_LIMITS]
      : V1_RATE_LIMITS.management);

  const rl = await checkApiRateLimit({
    userId: ctx.user.id,
    bucket: String(bucket),
    limitPerMinute: limit,
  });

  if (!rl.ok) {
    return { error: rateLimitResponse(rl.retryAfterSec, rl.limit) };
  }

  return { user: ctx.user, workspaceId: ctx.workspaceId };
}

/** Own a character in the workspace or return null (no cross-tenant enumeration). */
export async function findOwnedCharacter(workspaceId: string, id: string) {
  return prisma.character.findFirst({
    where: { id, workspaceId, archivedAt: null },
  });
}

/** Own a knowledge pack in the workspace or return null. */
export async function findOwnedKnowledgePack(workspaceId: string, id: string) {
  return prisma.knowledgePack.findFirst({
    where: { id, workspaceId, archivedAt: null },
  });
}
