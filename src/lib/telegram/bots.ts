import { prisma } from "@/lib/db";
import { createHash, randomBytes } from "crypto";

export type ResolvedBot = {
  id: string;
  token: string;
  username: string;
  webhookSecret: string;
  characterId: string;
  ownerUserId: string;
  label: string | null;
};

/** Prefer DB bot matched by webhook secret; fall back to env single-bot. */
export async function resolveBotByWebhookSecret(
  secretHeader: string | null,
): Promise<ResolvedBot | null> {
  if (!secretHeader) return null;

  const fromDb = await prisma.telegramBot.findFirst({
    where: { webhookSecret: secretHeader, active: true },
  });
  if (fromDb) {
    return {
      id: fromDb.id,
      token: fromDb.token,
      username: fromDb.username,
      webhookSecret: fromDb.webhookSecret,
      characterId: fromDb.characterId,
      ownerUserId: fromDb.ownerUserId,
      label: fromDb.label,
    };
  }

  // Legacy env bot
  const envSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
  const envToken = process.env.TELEGRAM_BOT_TOKEN;
  const envUser = process.env.TELEGRAM_BOT_USERNAME?.replace(/^@/, "");
  if (envSecret && envToken && secretHeader === envSecret) {
    return ensureEnvBotRow(envToken, envUser ?? "env_bot", envSecret);
  }

  return null;
}

/**
 * Ensure the legacy env bot exists as a TelegramBot row (linked to owner's active character).
 */
async function ensureEnvBotRow(
  token: string,
  username: string,
  webhookSecret: string,
): Promise<ResolvedBot | null> {
  const existing = await prisma.telegramBot.findUnique({ where: { token } });
  if (existing?.active) {
    return {
      id: existing.id,
      token: existing.token,
      username: existing.username,
      webhookSecret: existing.webhookSecret,
      characterId: existing.characterId,
      ownerUserId: existing.ownerUserId,
      label: existing.label,
    };
  }

  // Find an admin with an active character to attach
  const activeChar = await prisma.character.findFirst({
    where: { active: true },
    orderBy: { updatedAt: "desc" },
  });
  if (!activeChar) return null;

  const bot = await prisma.telegramBot.upsert({
    where: { token },
    create: {
      workspaceId: activeChar.workspaceId,
      ownerUserId: activeChar.userId,
      characterId: activeChar.id,
      token,
      username,
      webhookSecret,
      label: "env-default",
      active: true,
    },
    update: {
      webhookSecret,
      username,
      active: true,
    },
  });

  return {
    id: bot.id,
    token: bot.token,
    username: bot.username,
    webhookSecret: bot.webhookSecret,
    characterId: bot.characterId,
    ownerUserId: bot.ownerUserId,
    label: bot.label,
  };
}

export function generateWebhookSecret() {
  return randomBytes(24).toString("hex");
}

export function maskToken(token: string) {
  if (token.length < 12) return "***";
  return `${token.slice(0, 6)}…${token.slice(-4)}`;
}

export async function setTelegramWebhook(params: {
  token: string;
  secret: string;
  appUrl?: string;
}) {
  const base =
    params.appUrl?.replace(/\/$/, "") ||
    process.env.APP_URL?.replace(/\/$/, "") ||
    process.env.AUTH_URL?.replace(/\/$/, "");
  if (!base) throw new Error("APP_URL missing");

  const url = `${base}/api/telegram`;
  const res = await fetch(
    `https://api.telegram.org/bot${params.token}/setWebhook`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url,
        secret_token: params.secret,
        drop_pending_updates: true,
      }),
    },
  );
  const data = await res.json();
  if (!data.ok) {
    throw new Error(data.description || "setWebhook failed");
  }
  return { url, result: data };
}

export function hashForEmail(botId: string, telegramUserId: string) {
  return createHash("sha256")
    .update(`${botId}:${telegramUserId}`)
    .digest("hex")
    .slice(0, 24);
}
