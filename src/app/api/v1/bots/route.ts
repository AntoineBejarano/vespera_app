import { z } from "zod";
import { prisma } from "@/lib/db";
import {
  findOwnedCharacter,
  requireAccountApiKey,
} from "@/lib/api-keys/require-account-key";
import {
  generateWebhookSecret,
  maskToken,
  setTelegramWebhook,
} from "@/lib/telegram/bots";
import {
  ensurePlatformOperatorAttestation,
  isPlatformOperatorRequiredError,
} from "@/lib/legal/operator";

const createSchema = z.object({
  token: z.string().min(20).max(200),
  username: z.string().min(3).max(64),
  characterId: z.string().min(1),
  label: z.string().max(80).optional(),
  setWebhook: z.boolean().optional(),
  platformOperatorAccepted: z.boolean().optional(),
});

const patchSchema = z.object({
  botId: z.string().min(1),
  active: z.boolean().optional(),
  characterId: z.string().optional(),
  label: z.string().max(80).nullable().optional(),
  reWebhook: z.boolean().optional(),
});

/** List Telegram bots owned by the account (tokens masked). */
export async function GET(req: Request) {
  const auth = await requireAccountApiKey(req, { bucket: "management" });
  if (auth.error) return auth.error;

  const bots = await prisma.telegramBot.findMany({
    where: { workspaceId: auth.workspaceId },
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
      createdAt: b.createdAt,
    })),
  });
}

/** Bind a BotFather token to a persona you own. */
export async function POST(req: Request) {
  const auth = await requireAccountApiKey(req, { bucket: "management" });
  if (auth.error) return auth.error;

  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid data", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const character = await findOwnedCharacter(
    auth.workspaceId,
    parsed.data.characterId,
  );
  if (!character) {
    return Response.json({ error: "Character not found" }, { status: 404 });
  }

  try {
    await ensurePlatformOperatorAttestation({
      userId: auth.user.id,
      user: auth.user,
      platformOperatorAccepted: parsed.data.platformOperatorAccepted,
    });
  } catch (err) {
    if (isPlatformOperatorRequiredError(err)) {
      return Response.json(
        { error: err.message, code: err.code },
        { status: 403 },
      );
    }
    throw err;
  }

  const username = parsed.data.username.replace(/^@/, "");
  const webhookSecret = generateWebhookSecret();

  try {
    const bot = await prisma.telegramBot.create({
      data: {
        workspaceId: auth.workspaceId,
        ownerUserId: auth.user.id,
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
        console.error("[v1 bots setWebhook]", err);
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

    return Response.json(
      {
        bot: {
          id: bot.id,
          username: bot.username,
          characterId: bot.characterId,
          characterName: character.name,
          tokenMasked: maskToken(bot.token),
        },
        webhook,
      },
      { status: 201 },
    );
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

/** Update a bot you own. */
export async function PATCH(req: Request) {
  const auth = await requireAccountApiKey(req, { bucket: "management" });
  if (auth.error) return auth.error;

  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Invalid data" }, { status: 400 });
  }

  const bot = await prisma.telegramBot.findFirst({
    where: { id: parsed.data.botId, workspaceId: auth.workspaceId },
  });
  if (!bot) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  if (parsed.data.characterId) {
    const character = await findOwnedCharacter(
      auth.workspaceId,
      parsed.data.characterId,
    );
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

/** Delete a bot you own. */
export async function DELETE(req: Request) {
  const auth = await requireAccountApiKey(req, { bucket: "management" });
  if (auth.error) return auth.error;

  const { searchParams } = new URL(req.url);
  const botId = searchParams.get("botId");
  if (!botId) {
    return Response.json({ error: "botId required" }, { status: 400 });
  }

  const result = await prisma.telegramBot.deleteMany({
    where: { id: botId, workspaceId: auth.workspaceId },
  });
  if (result.count === 0) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  return Response.json({ ok: true });
}
