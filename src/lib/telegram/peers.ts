import { prisma } from "@/lib/db";
import { hashForEmail } from "@/lib/telegram/bots";

export type TelegramFrom = {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
};

/**
 * Find or create an isolated User for this (bot, telegram person).
 * Same girl (character) can talk to N peers — each gets own memory/relationship.
 */
export async function ensureTelegramPeer(params: {
  botId: string;
  from: TelegramFrom;
}) {
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
    return existing.userId;
  }

  const stubEmail = `tg_${hashForEmail(params.botId, telegramUserId)}@peers.vespera.local`;

  const user = await prisma.user.create({
    data: {
      email: stubEmail,
      name: params.from.first_name || "Telegram",
      isTelegramPeer: true,
      ageVerifiedAt: new Date(),
      adultConsentAt: new Date(),
      telegramFirstName: params.from.first_name?.trim() || null,
      telegramLastName: params.from.last_name?.trim() || null,
      telegramUsername: params.from.username?.trim() || null,
      settings: {
        create: {
          language: "en",
          adultConsent: true,
          dailyLimit: 200,
        },
      },
    },
  });

  await prisma.telegramPeer.create({
    data: {
      botId: params.botId,
      userId: user.id,
      telegramUserId,
      telegramFirstName: params.from.first_name?.trim() || null,
      telegramLastName: params.from.last_name?.trim() || null,
      telegramUsername: params.from.username?.trim() || null,
    },
  });

  return user.id;
}
