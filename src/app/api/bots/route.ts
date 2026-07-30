import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/users";
import {
  generateWebhookSecret,
  maskToken,
  setTelegramWebhook,
} from "@/lib/telegram/bots";
import { z } from "zod";
import { requireAppUser, getAppUser } from "@/lib/session";

export async function GET() {
  const user = await requireAppUser().catch(() => null);
  if (!user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  const bots = await prisma.telegramBot.findMany({
    where: { ownerUserId: user.id },
    include: {
      character: { select: { id: true, name: true } },
      _count: { select: { peers: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return Response.json({
    bots: bots.map((b) => ({
      id: b.id,
      username: b.username,
      label: b.label,
      active: b.active,
      characterId: b.characterId,
      characterName: b.character.name,
      peerCount: b._count.peers,
      tokenMasked: maskToken(b.token),
      webhookSecretMasked: maskToken(b.webhookSecret),
      createdAt: b.createdAt,
    })),
  });
}

const createSchema = z.object({
  token: z.string().min(20),
  username: z.string().min(3).max(64),
  characterId: z.string().min(1),
  label: z.string().max(80).optional(),
  setWebhook: z.boolean().optional(),
});

export async function POST(req: Request) {
  const user = await requireAppUser().catch(() => null);
  if (!user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }
  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) {
    return Response.json({ error: "Invalid data" }, { status: 400 });
  }

  const character = await prisma.character.findFirst({
    where: { id: parsed.data.characterId, userId: user.id },
  });
  if (!character) {
    return Response.json({ error: "Character not found" }, { status: 404 });
  }

  const username = parsed.data.username.replace(/^@/, "");
  const webhookSecret = generateWebhookSecret();

  try {
    const bot = await prisma.telegramBot.create({
      data: {
        ownerUserId: user.id,
        characterId: character.id,
        token: parsed.data.token.trim(),
        username,
        webhookSecret,
        label: parsed.data.label?.trim() || null,
        active: true,
      },
    });

    let webhook: { url: string } | null = null;
    if (parsed.data.setWebhook !== false) {
      try {
        const wh = await setTelegramWebhook({
          token: bot.token,
          secret: bot.webhookSecret,
        });
        webhook = { url: wh.url };
      } catch (err) {
        console.error("[bots setWebhook]", err);
        return Response.json({
          bot: {
            id: bot.id,
            username: bot.username,
            characterId: bot.characterId,
          },
          warning:
            err instanceof Error
              ? `Bot saved but webhook failed: ${err.message}`
              : "Bot saved but webhook failed",
        });
      }
    }

    return Response.json({
      bot: {
        id: bot.id,
        username: bot.username,
        characterId: bot.characterId,
        characterName: character.name,
        tokenMasked: maskToken(bot.token),
      },
      webhook,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error";
    if (msg.includes("Unique") || msg.includes("unique")) {
      return Response.json(
        { error: "That bot token already exists" },
        { status: 409 },
      );
    }
    return Response.json({ error: msg }, { status: 500 });
  }
}

const patchSchema = z.object({
  botId: z.string(),
  active: z.boolean().optional(),
  characterId: z.string().optional(),
  label: z.string().max(80).nullable().optional(),
  reWebhook: z.boolean().optional(),
});

export async function PATCH(req: Request) {
  const user = await requireAppUser().catch(() => null);
  if (!user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }
  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) {
    return Response.json({ error: "Invalid data" }, { status: 400 });
  }

  const bot = await prisma.telegramBot.findFirst({
    where: { id: parsed.data.botId, ownerUserId: user.id },
  });
  if (!bot) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  if (parsed.data.characterId) {
    const character = await prisma.character.findFirst({
      where: { id: parsed.data.characterId, userId: user.id },
    });
    if (!character) {
      return Response.json({ error: "Character not found" }, { status: 404 });
    }
  }

  const updated = await prisma.telegramBot.update({
    where: { id: bot.id },
    data: {
      ...(parsed.data.active !== undefined
        ? { active: parsed.data.active }
        : {}),
      ...(parsed.data.characterId
        ? { characterId: parsed.data.characterId }
        : {}),
      ...(parsed.data.label !== undefined ? { label: parsed.data.label } : {}),
    },
  });

  if (parsed.data.reWebhook) {
    await setTelegramWebhook({
      token: updated.token,
      secret: updated.webhookSecret,
    });
  }

  return Response.json({ ok: true });
}

export async function DELETE(req: Request) {
  const user = await requireAppUser().catch(() => null);
  if (!user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const botId = searchParams.get("botId");
  if (!botId) {
    return Response.json({ error: "botId required" }, { status: 400 });
  }

  await prisma.telegramBot.deleteMany({
    where: { id: botId, ownerUserId: user.id },
  });
  return Response.json({ ok: true });
}
