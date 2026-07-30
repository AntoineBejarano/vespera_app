import { prisma } from "@/lib/db";
import {
  telegramSendChatAction,
  telegramSendMessage,
  telegramSendPhoto,
} from "@/lib/telegram/api";
import { runCharacterReply } from "@/lib/chat/engine";
import { relationshipPhase } from "@/lib/persona/phases";
import {
  randomBetweenBubblesMs,
  randomReplyDelayMs,
  sleep,
} from "@/lib/chat/humanize";
import { resolveBotByWebhookSecret } from "@/lib/telegram/bots";
import { ensureTelegramPeer, type TelegramFrom } from "@/lib/telegram/peers";

export const maxDuration = 60;

type TelegramUpdate = {
  update_id: number;
  message?: {
    message_id: number;
    text?: string;
    chat: { id: number; type: string };
    from?: TelegramFrom;
  };
};

/**
 * Multi-tenant Telegram webhook.
 * N bots (DB or env) → same Character (girl) → N peers with isolated memory.
 * Bot resolved by x-telegram-bot-api-secret-token.
 */
export async function POST(req: Request) {
  const header = req.headers.get("x-telegram-bot-api-secret-token");
  const bot = await resolveBotByWebhookSecret(header);
  if (!bot) {
    // Distinguish misconfig vs forbidden
    if (!process.env.TELEGRAM_BOT_TOKEN && !(await prisma.telegramBot.count())) {
      return Response.json({ error: "Telegram not configured" }, { status: 503 });
    }
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const token = bot.token;
  const update = (await req.json()) as TelegramUpdate;
  const message = update.message;
  if (!message?.from?.id || !message.chat?.id) {
    return Response.json({ ok: true });
  }

  const from = message.from;
  const chatId = message.chat.id;
  const text = message.text?.trim() ?? "";

  try {
    const peerUserId = await ensureTelegramPeer({ botId: bot.id, from });
    const character = await prisma.character.findUnique({
      where: { id: bot.characterId },
    });

    if (text.startsWith("/start")) {
      const hi = from.first_name ? `hey ${from.first_name}` : "hey";
      await telegramSendMessage(
        chatId,
        character
          ? `${hi} — it's ${character.name}. text me whenever`
          : `${hi}. talk soon`,
        token,
      );
      return Response.json({ ok: true });
    }

    if (text === "/who" || text === "/status") {
      const rel = character
        ? await prisma.relationshipState.findUnique({
            where: {
              userId_characterId: {
                userId: peerUserId,
                characterId: character.id,
              },
            },
          })
        : null;
      const phase = rel
        ? relationshipPhase(rel.trust, rel.affection)
        : "—";
      await telegramSendMessage(
        chatId,
        [
          `telegram: ${from.first_name ?? "—"}${from.username ? ` @${from.username}` : ""}`,
          `girl: ${character?.name ?? "none"}`,
          `bot: @${bot.username}`,
          rel
            ? `${phase} · t ${rel.trust.toFixed(2)} · a ${rel.affection.toFixed(2)} · ${rel.mood}`
            : "no relationship state yet",
        ].join("\n"),
        token,
      );
      return Response.json({ ok: true });
    }

    if (!text || text.startsWith("/")) {
      await telegramSendMessage(chatId, "just text me", token);
      return Response.json({ ok: true });
    }

    if (!character) {
      await telegramSendMessage(
        chatId,
        "one sec — something's off, try later?",
        token,
      );
      return Response.json({ ok: true });
    }

    await telegramSendChatAction(chatId, "typing", token);
    await sleep(randomReplyDelayMs());

    const result = await runCharacterReply({
      userId: peerUserId,
      message: text,
      characterId: character.id,
      partner: {
        channel: "telegram",
        telegramFirstName: from.first_name ?? null,
        telegramLastName: from.last_name ?? null,
        telegramUsername: from.username ?? null,
      },
    });

    if (!result.ok) {
      await telegramSendMessage(
        chatId,
        result.status === 429
          ? "gonna sleep a bit, talk tomorrow?"
          : "one sec, brain blank — say that again?",
        token,
      );
      return Response.json({ ok: true });
    }

    if (!result.bubbles.length && !result.photo) {
      return Response.json({ ok: true });
    }

    const bubbles = result.bubbles;
    let photoSent = false;

    for (let i = 0; i < bubbles.length; i++) {
      await telegramSendChatAction(chatId, "typing", token);
      if (i > 0) await sleep(randomBetweenBubblesMs());
      await telegramSendMessage(chatId, bubbles[i]!, token);

      if (
        !photoSent &&
        result.photo &&
        (i === 0 || i === Math.min(1, bubbles.length - 1))
      ) {
        await sleep(randomBetweenBubblesMs());
        await telegramSendChatAction(chatId, "upload_photo", token);
        await sleep(400 + Math.random() * 900);
        try {
          await telegramSendPhoto(
            chatId,
            result.photo.url,
            result.photo.caption ?? undefined,
            token,
          );
          photoSent = true;
        } catch (err) {
          console.error("[telegram photo]", err);
        }
      }
    }

    if (result.photo && !photoSent) {
      await sleep(bubbles.length ? randomBetweenBubblesMs() : 400);
      await telegramSendChatAction(chatId, "upload_photo", token);
      try {
        await telegramSendPhoto(
          chatId,
          result.photo.url,
          result.photo.caption ?? undefined,
          token,
        );
      } catch (err) {
        console.error("[telegram photo]", err);
      }
    }

    return Response.json({ ok: true });
  } catch (error) {
    console.error("[telegram webhook]", error);
    try {
      await telegramSendMessage(
        chatId,
        "ugh something glitched — try again?",
        token,
      );
    } catch {
      /* ignore */
    }
    return Response.json({ ok: true });
  }
}
