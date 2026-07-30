import { createHash } from "crypto";
import { prisma } from "@/lib/db";
import { runCharacterReply } from "@/lib/chat/engine";

export const maxDuration = 60;

/**
 * Public persona chat API.
 * Auth: X-Api-Key = Character.apiKey
 * Optional peerId: stable string to isolate memory per end-user.
 */
export async function POST(req: Request) {
  const apiKey =
    req.headers.get("x-api-key") ||
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
    "";

  if (!apiKey) {
    return Response.json({ error: "Missing X-Api-Key" }, { status: 401 });
  }

  const character = await prisma.character.findFirst({
    where: { apiKey },
  });
  if (!character) {
    return Response.json({ error: "Invalid API key" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const message = String(body.message ?? "").trim();
  if (!message) {
    return Response.json({ error: "message required" }, { status: 400 });
  }

  const peerId = String(body.peerId ?? body.userId ?? "default").slice(0, 80);
  const peerUserId = await ensureApiPeer(character.id, character.userId, peerId);

  const result = await runCharacterReply({
    userId: peerUserId,
    message,
    characterId: character.id,
    partner: {
      channel: "web",
      telegramFirstName: body.displayName ? String(body.displayName).slice(0, 40) : null,
    },
  });

  if (!result.ok) {
    return Response.json(
      { error: result.error },
      { status: result.status },
    );
  }

  return Response.json({
    characterId: character.id,
    characterName: character.name,
    text: result.text,
    bubbles: result.bubbles,
    photo: result.photo,
    peerId,
  });
}

async function ensureApiPeer(
  characterId: string,
  ownerUserId: string,
  peerId: string,
) {
  const hash = createHash("sha256")
    .update(`api:${characterId}:${peerId}`)
    .digest("hex")
    .slice(0, 24);
  const email = `api_${hash}@peers.vespera.local`;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return existing.id;

  const user = await prisma.user.create({
    data: {
      email,
      name: peerId === "default" ? "API peer" : peerId,
      isTelegramPeer: true,
      ageVerifiedAt: new Date(),
      adultConsentAt: new Date(),
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

  // Touch ownership context (unused but keeps audit trail via character owner)
  void ownerUserId;
  void characterId;

  return user.id;
}
