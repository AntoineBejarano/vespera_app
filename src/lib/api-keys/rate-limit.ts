import { redisGet, redisIncr, redisSet } from "@/lib/memory/redis";

export type ApiRateLimitResult =
  | { ok: true; remaining: number; limit: number }
  | { ok: false; remaining: 0; limit: number; retryAfterSec: number };

/**
 * Fixed-window rate limit (per minute) keyed by tenant + bucket.
 * Falls back to in-memory Redis shim when Upstash is unset (dev).
 */
export async function checkApiRateLimit(params: {
  userId: string;
  bucket: string;
  limitPerMinute: number;
}): Promise<ApiRateLimitResult> {
  const minute = Math.floor(Date.now() / 60_000);
  const key = `v1:rl:${params.bucket}:${params.userId}:${minute}`;
  const limit = Math.max(1, params.limitPerMinute);

  const next = await redisIncr(key);
  if (next === 1) {
    await redisSet(key, "1", 70);
  }

  if (next > limit) {
    const retryAfterSec = 60 - (Math.floor(Date.now() / 1000) % 60);
    return {
      ok: false,
      remaining: 0,
      limit,
      retryAfterSec: Math.max(1, retryAfterSec),
    };
  }

  return { ok: true, remaining: Math.max(limit - next, 0), limit };
}

/** Soft check without increment (for diagnostics). */
export async function peekApiRateLimit(params: {
  userId: string;
  bucket: string;
  limitPerMinute: number;
}) {
  const minute = Math.floor(Date.now() / 60_000);
  const key = `v1:rl:${params.bucket}:${params.userId}:${minute}`;
  const current = Number((await redisGet(key)) ?? "0");
  const limit = Math.max(1, params.limitPerMinute);
  return { used: current, remaining: Math.max(limit - current, 0), limit };
}

export const V1_RATE_LIMITS = {
  management: 120,
  create: 30,
  import: 10,
  knowledge: 60,
  chat: 90,
} as const;
