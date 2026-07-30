import { prisma } from "@/lib/db";
import { consumeTelegramLinkToken } from "@/lib/telegram/link";
import { telegramSendChatAction, telegramSendMessage } from "@/lib/telegram/api";
import { runCharacterReply } from "@/lib/chat/engine";
import { getActiveCharacter } from "@/lib/users";
import { relationshipPhase } from "@/lib/persona/phases";

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
 * Webhook de Telegram.
 * Env: TELEGRAM_BOT_TOKEN, TELEGRAM_WEBHOOK_SECRET, TELEGRAM_BOT_USERNAME
 *
 * Flujo:
 * 1) En la web (Ajustes) genera enlace → /start <token> vincula telegramId al User
 * 2) Mensajes de texto → mismo motor que la web (persona + memoria + fases)
 */
export async function POST(req: Request) {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!secret || !botToken) {
    return Response.json({ error: "Telegram no configurado" }, { status: 503 });
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
            "Ese enlace expiró o no es válido. Genera uno nuevo en Ajustes de la web.",
          );
          return Response.json({ ok: true });
        }

        // Un telegramId solo puede pertenecer a un user
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
            ? `Listo. Telegram vinculado.\nHablas con ${active.name} — misma memoria que en la web.\n\n/who · /status`
            : `Listo. Telegram vinculado.\nCrea un personaje en la web (/chat/new) y luego escríbeme aquí.`,
        );
        return Response.json({ ok: true });
      }

      const existing = await prisma.user.findUnique({ where: { telegramId } });
      if (existing) {
        await telegramSendMessage(
          chatId,
          "Ya estás vinculado. Escríbeme lo que quieras — soy tu personaje activo.",
        );
      } else {
        await telegramSendMessage(
          chatId,
          "Hola. Para vincular: entra en la web → Ajustes → Vincular Telegram, y abre el enlace.",
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
        "Aún no estás vinculado. Genera el enlace en la web (Ajustes → Vincular Telegram).",
      );
      return Response.json({ ok: true });
    }

    if (text === "/who" || text === "/status") {
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
          `Tú: ${call}`,
          `Personaje activo: ${character?.name ?? "ninguno — créalo en la web"}`,
          rel
            ? `Fase: ${phase} · trust ${rel.trust.toFixed(2)} · affection ${rel.affection.toFixed(2)} · mood ${rel.mood}`
            : "Sin estado de relación aún.",
        ].join("\n"),
      );
      return Response.json({ ok: true });
    }

    if (!text || text.startsWith("/")) {
      await telegramSendMessage(
        chatId,
        "Mándame un mensaje normal, o /who /status.",
      );
      return Response.json({ ok: true });
    }

    await telegramSendChatAction(chatId, "typing");
    const result = await runCharacterReply({
      userId: user.id,
      message: text,
    });
    if (!result.ok) {
      await telegramSendMessage(chatId, result.error);
      return Response.json({ ok: true });
    }

    await telegramSendMessage(chatId, result.text);
    return Response.json({ ok: true });
  } catch (error) {
    console.error("[telegram webhook]", error);
    try {
      await telegramSendMessage(
        chatId,
        "Algo falló un momento. Intenta de nuevo.",
      );
    } catch {
      /* ignore */
    }
    return Response.json({ ok: true });
  }
}
