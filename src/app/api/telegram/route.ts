import { prisma } from "@/lib/db";
import {
  telegramSendChatAction,
  telegramSendMessage,
  telegramSendPhoto,
  telegramSendVoice,
} from "@/lib/telegram/api";
import { runCharacterReply } from "@/lib/chat/engine";
import { relationshipPhase } from "@/lib/persona/phases";
import {
  randomBetweenBubblesMs,
  randomReplyDelayMs,
  sleep,
} from "@/lib/chat/humanize";
import { resolveBotByWebhookSecret } from "@/lib/telegram/bots";
import {
  attestTelegramPeerAge,
  ensureTelegramPeer,
  isAgeAttestMessage,
  type TelegramFrom,
} from "@/lib/telegram/peers";
import { resolveVoiceForCharacter } from "@/lib/voice/characters";
import { synthesizeSpeech } from "@/lib/voice/elevenlabs";
import {
  spokenTextFromBubbles,
  voiceRequestUserMessage,
  VOICE_NOTE_SYSTEM_ADDON,
  wantsVoiceMessage,
} from "@/lib/voice/intent";

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

const AGE_GATE_MSG = [
  "Adults only (18+).",
  "This chat can include sexual content between consenting adults.",
  "Sexual content involving minors is forbidden.",
  "",
  "If you are 18 or older, reply: I am 18",
  "If you are under 18, leave now — we cannot chat.",
].join("\n");

/**
 * Multi-tenant Telegram webhook.
 * N bots (DB or env) → same Character (girl) → N peers with isolated memory.
 * Bot resolved by x-telegram-bot-api-secret-token.
 * Peers must self-attest 18+ before character replies.
 */
export async function POST(req: Request) {
  const header = req.headers.get("x-telegram-bot-api-secret-token");
  const bot = await resolveBotByWebhookSecret(header);
  if (!bot) {
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
    const peer = await ensureTelegramPeer({ botId: bot.id, from });
    const character = await prisma.character.findUnique({
      where: { id: bot.characterId },
    });

    if (text.startsWith("/start")) {
      const hi = from.first_name ? `hey ${from.first_name}` : "hey";
      if (!peer.ageAttestedAt) {
        await telegramSendMessage(
          chatId,
          [
            character
              ? `${hi} — before we talk, age check.`
              : `${hi} — age check first.`,
            "",
            AGE_GATE_MSG,
          ].join("\n"),
          token,
        );
        return Response.json({ ok: true });
      }
      await telegramSendMessage(
        chatId,
        character
          ? `${hi} — it's ${character.name}. text me whenever`
          : `${hi}. talk soon`,
        token,
      );
      return Response.json({ ok: true });
    }

    if (!peer.ageAttestedAt) {
      if (isAgeAttestMessage(text)) {
        await attestTelegramPeerAge(peer.peerId, peer.userId);
        await telegramSendMessage(
          chatId,
          character
            ? `got it — you're in. i'm ${character.name}. text me whenever`
            : "got it — you're in. text me whenever",
          token,
        );
        return Response.json({ ok: true });
      }
      await telegramSendMessage(chatId, AGE_GATE_MSG, token);
      return Response.json({ ok: true });
    }

    if (text === "/who" || text === "/status") {
      const rel = character
        ? await prisma.relationshipState.findUnique({
            where: {
              userId_characterId: {
                userId: peer.userId,
                characterId: character.id,
              },
            },
          })
        : null;
      const phase = rel ? relationshipPhase(rel.trust, rel.affection) : "—";
      await telegramSendMessage(
        chatId,
        [
          `telegram: ${from.first_name ?? "—"}${from.username ? ` @${from.username}` : ""}`,
          `girl: ${character?.name ?? "none"}`,
          `bot: @${bot.username}`,
          "age: attested 18+",
          rel
            ? `${phase} · t ${rel.trust.toFixed(2)} · a ${rel.affection.toFixed(2)} · ${rel.mood}`
            : "no relationship state yet",
        ].join("\n"),
        token,
      );
      return Response.json({ ok: true });
    }

    const voiceAsk = wantsVoiceMessage(text);
    if ((!text || text.startsWith("/")) && !voiceAsk) {
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

    const cast = resolveVoiceForCharacter(character);
    const wantVoice = voiceAsk && Boolean(cast) && Boolean(process.env.ELEVENLABS_API_KEY?.trim());

    await telegramSendChatAction(
      chatId,
      wantVoice ? "record_voice" : "typing",
      token,
    );
    await sleep(randomReplyDelayMs());

    const result = await runCharacterReply({
      userId: peer.userId,
      message: voiceAsk ? voiceRequestUserMessage(text) : text,
      characterId: character.id,
      voiceMode: voiceAsk,
      systemAddon: voiceAsk ? VOICE_NOTE_SYSTEM_ADDON : undefined,
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

    // Voice-note asks never send a photo — that felt like the wrong reply.
    if (voiceAsk) {
      if (wantVoice && cast && bubbles.length) {
        const spoken = spokenTextFromBubbles(bubbles);
        try {
          await telegramSendChatAction(chatId, "upload_voice", token);
          const audio = await synthesizeSpeech({
            voiceId: cast.voiceId,
            fallbackVoiceId: cast.fallbackVoiceId,
            text: spoken,
            modelId: cast.modelId,
            outputFormat: "opus_48000_128",
            speed: 0.82,
          });
          await telegramSendVoice(chatId, audio, token);
          return Response.json({ ok: true });
        } catch (err) {
          console.error("[telegram voice]", err);
          await telegramSendMessage(
            chatId,
            bubbles[0] ?? "couldn't send the voice note — try again in a sec?",
            token,
          );
          return Response.json({ ok: true });
        }
      }

      if (!cast) {
        await telegramSendMessage(
          chatId,
          "voice isn't cast for this character yet — texting you instead",
          token,
        );
      }
      for (let i = 0; i < bubbles.length; i++) {
        if (i > 0) await sleep(randomBetweenBubblesMs());
        await telegramSendMessage(chatId, bubbles[i]!, token);
      }
      return Response.json({ ok: true });
    }

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
