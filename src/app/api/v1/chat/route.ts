import { createHash } from "crypto";
import { prisma } from "@/lib/db";
import { runCharacterReply } from "@/lib/chat/engine";
import {
  checkApiRateLimit,
  V1_RATE_LIMITS,
} from "@/lib/api-keys/rate-limit";

export const maxDuration = 60;

class AgeAttestRequiredError extends Error {
  status = 403;
  constructor() {
    super(
      "endUserAgeAttested:true required — integrator must collect 18+ attestation before chat",
    );
  }
}

/**
 * Public persona chat API.
 * Auth: X-Api-Key = Character.apiKey (vesp_…)
 * Optional peerId: stable string to isolate memory per end-user.
 * Rate-limited per character owner; peers are tenant-isolated synthetic users.
 */
export async function POST(req: Request) {
  const apiKey =
    req.headers.get("x-api-key") ||
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
    "";

  if (!apiKey) {
    return Response.json({ error: "Missing X-Api-Key" }, { status: 401 });
  }

  if (apiKey.startsWith("vsk_")) {
    return Response.json(
      {
        error:
          "Account keys (vsk_…) cannot chat. Use the persona chat key (vesp_…) returned on create.",
      },
      { status: 401 },
    );
  }

  const { findCharacterByChatKey } = await import("@/lib/api-keys/chat-keys");
  const character = await findCharacterByChatKey(apiKey);
  if (!character) {
    return Response.json({ error: "Invalid API key" }, { status: 401 });
  }

  const rl = await checkApiRateLimit({
    userId: character.userId,
    bucket: `chat:${character.id}`,
    limitPerMinute: V1_RATE_LIMITS.chat,
  });
  if (!rl.ok) {
    return Response.json(
      {
        error: "Rate limit exceeded. Slow down and retry.",
        limitPerMinute: rl.limit,
        retryAfterSec: rl.retryAfterSec,
      },
      {
        status: 429,
        headers: { "Retry-After": String(rl.retryAfterSec) },
      },
    );
  }

  const body = await req.json().catch(() => ({}));
  const message = String(body.message ?? "").trim();
  if (!message) {
    return Response.json({ error: "message required" }, { status: 400 });
  }
  if (message.length > 8000) {
    return Response.json(
      { error: "message too long (max 8000 chars)" },
      { status: 400 },
    );
  }

  const peerId = String(body.peerId ?? body.userId ?? "default").slice(0, 80);
  const endUserAgeAttested = Boolean(
    body.endUserAgeAttested ?? body.ageAttested,
  );

  let peerUserId: string;
  try {
    peerUserId = await ensureApiPeer(
      character.id,
      character.userId,
      peerId,
      endUserAgeAttested,
    );
  } catch (err) {
    if (err instanceof AgeAttestRequiredError) {
      return Response.json({ error: err.message }, { status: 403 });
    }
    throw err;
  }

  const result = await runCharacterReply({
    userId: peerUserId,
    message,
    characterId: character.id,
    partner: {
      channel: "web",
      externalCustomerId: `api:${character.id}:${peerId}`,
      telegramFirstName: body.displayName
        ? String(body.displayName).slice(0, 40)
        : null,
    },
  });

  if (!result.ok) {
    if (result.paywall) {
      return Response.json(result.paywall, { status: result.status });
    }
    return Response.json({ error: result.error }, { status: result.status });
  }

  return Response.json(
    {
      characterId: character.id,
      characterName: character.name,
      text: result.text,
      bubbles: result.bubbles,
      photo: result.photo,
      peerId,
    },
    {
      headers: {
        "X-Vesperer-Age-Attestation":
          "Integrator must verify end users are 18+ before chat; false attestation may violate law and Terms.",
        "X-RateLimit-Remaining": String(rl.remaining),
      },
    },
  );
}

async function ensureApiPeer(
  characterId: string,
  ownerUserId: string,
  peerId: string,
  endUserAgeAttested: boolean,
) {
  // Peer identity is scoped to (character, peerId) — never shared across personas.
  const hash = createHash("sha256")
    .update(`api:${characterId}:${peerId}`)
    .digest("hex")
    .slice(0, 24);
  const email = `api_${hash}@peers.vespera.local`;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    if (!existing.ageVerifiedAt) {
      if (!endUserAgeAttested) {
        throw new AgeAttestRequiredError();
      }
      const now = new Date();
      await prisma.user.update({
        where: { id: existing.id },
        data: {
          ageVerifiedAt: now,
          adultConsentAt: now,
          settings: {
            upsert: {
              create: { adultConsent: true, language: "en", dailyLimit: 500 },
              update: { adultConsent: true },
            },
          },
        },
      });
    }
    return existing.id;
  }

  if (!endUserAgeAttested) {
    throw new AgeAttestRequiredError();
  }

  const now = new Date();
  const user = await prisma.user.create({
    data: {
      email,
      name: peerId === "default" ? "API peer" : peerId,
      isTelegramPeer: true,
      ageVerifiedAt: now,
      adultConsentAt: now,
      settings: {
        create: {
          language: "en",
          adultConsent: true,
          dailyLimit: 500,
          howToAddress: peerId === "default" ? null : peerId.slice(0, 40),
        },
      },
    },
  });

  void ownerUserId;

  return user.id;
}
