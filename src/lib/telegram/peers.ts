import { prisma } from "@/lib/db";
import { hashForEmail } from "@/lib/telegram/bots";

export type TelegramFrom = {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
};

export type EnsuredPeer = {
  userId: string;
  peerId: string;
  ageAttestedAt: Date | null;
};

/**
 * Find or create an isolated User for this (bot, telegram person).
 * Age is NOT auto-verified — peer must attest 18+ in Telegram first.
 */
export async function ensureTelegramPeer(params: {
  botId: string;
  from: TelegramFrom;
}): Promise<EnsuredPeer> {
  const telegramUserId = String(params.from.id);
  const existing = await prisma.telegramPeer.findUnique({
    where: {
      botId_telegramUserId: {
        botId: params.botId,
        telegramUserId,
      },
    },
    include: { user: true },
  });

  if (existing) {
    await prisma.telegramPeer.update({
      where: { id: existing.id },
      data: {
        telegramFirstName: params.from.first_name?.trim() || null,
        telegramLastName: params.from.last_name?.trim() || null,
        telegramUsername: params.from.username?.trim() || null,
      },
    });
    await prisma.user.update({
      where: { id: existing.userId },
      data: {
        telegramFirstName: params.from.first_name?.trim() || null,
        telegramLastName: params.from.last_name?.trim() || null,
        telegramUsername: params.from.username?.trim() || null,
        name:
          existing.user.name ||
          params.from.first_name ||
          existing.user.name,
      },
    });
    return {
      userId: existing.userId,
      peerId: existing.id,
      ageAttestedAt: existing.ageAttestedAt,
    };
  }

  const stubEmail = `tg_${hashForEmail(params.botId, telegramUserId)}@peers.vespera.local`;

  const user = await prisma.user.create({
    data: {
      email: stubEmail,
      name: params.from.first_name || "Telegram",
      isTelegramPeer: true,
      ageVerifiedAt: null,
      adultConsentAt: null,
      telegramFirstName: params.from.first_name?.trim() || null,
      telegramLastName: params.from.last_name?.trim() || null,
      telegramUsername: params.from.username?.trim() || null,
      settings: {
        create: {
          language: "en",
          adultConsent: false,
          dailyLimit: 200,
        },
      },
    },
  });

  const peer = await prisma.telegramPeer.create({
    data: {
      botId: params.botId,
      userId: user.id,
      telegramUserId,
      telegramFirstName: params.from.first_name?.trim() || null,
      telegramLastName: params.from.last_name?.trim() || null,
      telegramUsername: params.from.username?.trim() || null,
      ageAttestedAt: null,
    },
  });

  return {
    userId: user.id,
    peerId: peer.id,
    ageAttestedAt: null,
  };
}

const AFFIRM =
  /^(i\s*(am|'m)\s*18(\+|(\s*or\s*older))?|yes|y|18\+|i\s*agree|agree|adulto|soy\s*mayor|tengo\s*18)$/i;

export function isAgeAttestMessage(text: string) {
  return AFFIRM.test(text.trim());
}

export async function attestTelegramPeerAge(peerId: string, userId: string) {
  const now = new Date();
  await prisma.$transaction([
    prisma.telegramPeer.update({
      where: { id: peerId },
      data: { ageAttestedAt: now },
    }),
    prisma.user.update({
      where: { id: userId },
      data: {
        ageVerifiedAt: now,
        adultConsentAt: now,
        settings: {
          upsert: {
            create: { adultConsent: true, language: "en", dailyLimit: 200 },
            update: { adultConsent: true },
          },
        },
      },
    }),
  ]);
}
