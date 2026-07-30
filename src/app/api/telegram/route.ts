import { prisma } from "@/lib/db";
import { consumeTelegramLinkToken } from "@/lib/telegram/link";
import {
  telegramSendChatAction,
  telegramSendMessage,
  telegramSendPhoto,
} from "@/lib/telegram/api";
import { runCharacterReply } from "@/lib/chat/engine";
import { getActiveCharacter } from "@/lib/users";
import { relationshipPhase } from "@/lib/persona/phases";
import {
  randomBetweenBubblesMs,
  randomReplyDelayMs,
  sleep,
} from "@/lib/chat/humanize";

export const maxDuration = 60;

type TelegramUpdate = {
  update_id: number;
  message?: {
    message_id: number;
    text?: string;
    chat: { id: number; type: string };
    from?: { id: number; first_name?: string; username?: string };
  };
};

/**
 * Telegram webhook — product surface.
 * Replies as a real person: delays, multi-bubbles, optional photos.
 * Never reveal AI / fiction in character messages.
 */
export async function POST(req: Request) {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!secret || !botToken) {
    return Response.json({ error: "Telegram not configured" }, { status: 503 });
  }

  const header = req.headers.get("x-telegram-bot-api-secret-token");
  if (header !== secret) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const update = (await req.json()) as TelegramUpdate;
  const message = update.message;
  if (!message?.from?.id || !message.chat?.id) {
    return Response.json({ ok: true });
  }

  const telegramId = String(message.from.id);
  const chatId = message.chat.id;
  const text = message.text?.trim() ?? "";

  try {
    if (text.startsWith("/start")) {
      const payload = text.split(/\s+/)[1];
      if (payload) {
        const userId = await consumeTelegramLinkToken(payload);
        if (!userId) {
          await telegramSendMessage(
            chatId,
            "that link expired — grab a new one from the admin panel",
          );
          return Response.json({ ok: true });
        }

        await prisma.user.updateMany({
          where: { telegramId },
          data: { telegramId: null },
        });
        await prisma.user.update({
          where: { id: userId },
          data: {
            telegramId,
            name:
              (
                await prisma.user.findUnique({ where: { id: userId } })
              )?.name ||
              message.from.first_name ||
              undefined,
          },
        });

        const active = await getActiveCharacter(userId);
        await telegramSendMessage(
          chatId,
          active
            ? `hey — it's ${active.name}. text me whenever`
            : `hey. talk soon`,
        );
        return Response.json({ ok: true });
      }

      const existing = await prisma.user.findUnique({ where: { telegramId } });
      if (existing) {
        await telegramSendMessage(chatId, "hey again");
      } else {
        await telegramSendMessage(
          chatId,
          "hey — open the link from the admin panel first",
        );
      }
      return Response.json({ ok: true });
    }

    const user = await prisma.user.findUnique({
      where: { telegramId },
      include: { settings: true },
    });

    if (!user) {
      await telegramSendMessage(
        chatId,
        "hey — need the link from the admin panel first",
      );
      return Response.json({ ok: true });
    }

    if (text === "/who" || text === "/status") {
      // Admin debug only — keep terse
      const character = await prisma.character.findFirst({
        where: { userId: user.id, active: true },
      });
      const rel = character
        ? await prisma.relationshipState.findUnique({
            where: { characterId: character.id },
          })
        : null;
      const call =
        user.settings?.howToAddress || user.name || message.from.first_name;
      const phase = rel
        ? relationshipPhase(rel.trust, rel.affection)
        : "—";
      await telegramSendMessage(
        chatId,
        [
          `you: ${call}`,
          `active: ${character?.name ?? "none"}`,
          rel
            ? `${phase} · t ${rel.trust.toFixed(2)} · a ${rel.affection.toFixed(2)} · ${rel.mood}`
            : "no relationship state yet",
        ].join("\n"),
      );
      return Response.json({ ok: true });
    }

    if (!text || text.startsWith("/")) {
      await telegramSendMessage(chatId, "just text me");
      return Response.json({ ok: true });
    }

    await telegramSendChatAction(chatId, "typing");
    await sleep(randomReplyDelayMs());

    const result = await runCharacterReply({
      userId: user.id,
      message: text,
    });
    if (!result.ok) {
      // Soft fail — don't sound like a system
      await telegramSendMessage(
        chatId,
        result.status === 429
          ? "gonna sleep a bit, talk tomorrow?"
          : "one sec, brain blank — say that again?",
      );
      return Response.json({ ok: true });
    }

    // Photo first or mid-stream feel: short bubble, then photo, then rest
    const bubbles = result.bubbles;
    let photoSent = false;

    for (let i = 0; i < bubbles.length; i++) {
      await telegramSendChatAction(chatId, "typing");
      if (i > 0) await sleep(randomBetweenBubblesMs());

      await telegramSendMessage(chatId, bubbles[i]!);

      if (
        !photoSent &&
        result.photo &&
        (i === 0 || i === Math.min(1, bubbles.length - 1))
      ) {
        await sleep(randomBetweenBubblesMs());
        await telegramSendChatAction(chatId, "upload_photo");
        await sleep(400 + Math.random() * 900);
        try {
          await telegramSendPhoto(
            chatId,
            result.photo.url,
            result.photo.caption,
          );
          photoSent = true;
        } catch (err) {
          console.error("[telegram photo]", err);
        }
      }
    }

    if (result.photo && !photoSent) {
      await sleep(randomBetweenBubblesMs());
      await telegramSendChatAction(chatId, "upload_photo");
      try {
        await telegramSendPhoto(
          chatId,
          result.photo.url,
          result.photo.caption,
        );
      } catch (err) {
        console.error("[telegram photo]", err);
      }
    }

    return Response.json({ ok: true });
  } catch (error) {
    console.error("[telegram webhook]", error);
    try {
      await telegramSendMessage(chatId, "ugh something glitched — try again?");
    } catch {
      /* ignore */
    }
    return Response.json({ ok: true });
  }
}
