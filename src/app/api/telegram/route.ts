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

const AI_DISCLOSURE_MSG = [
  "Vesperer AI disclosure: you are chatting with an automated AI persona, not a human operator (unless a human handoff is clearly stated).",
  "Commands: /about — disclosure · /who — status",
].join("\n");

const ADULT_DELIVERY_BLOCKED_MSG = [
  "This persona is marked adult. End-user adult delivery is not available until highly effective age assurance is enabled for this channel.",
  "If you are a partner, configure personas in the Studio on vesperer.com — do not route adult consumers here yet.",
  "",
  AI_DISCLOSURE_MSG,
].join("\n");

/**
 * Multi-tenant Telegram webhook.
 * N bots (DB or env) → same Character → N peers with isolated memory.
 * Bot resolved by x-telegram-bot-api-secret-token.
 * AI disclosure on first contact; adult end-user delivery denied without HEAA.
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

    if (text === "/about") {
      await telegramSendMessage(
        chatId,
        [
          character
            ? `${character.name} is an AI persona on Vesperer.`
            : "This is an AI persona on Vesperer.",
          AI_DISCLOSURE_MSG,
          character?.isAdult
            ? "18+ partner persona — consumer adult delivery requires age assurance (not enabled on this channel yet)."
            : null,
        ]
          .filter(Boolean)
          .join("\n"),
        token,
      );
      return Response.json({ ok: true });
    }

    if (text.startsWith("/start")) {
      const hi = from.first_name ? `hey ${from.first_name}` : "hey";
      await telegramSendMessage(
        chatId,
        [
          character
            ? `${hi} — i'm ${character.name}, an AI persona on Vesperer.`
            : `${hi} — AI persona on Vesperer.`,
          "",
          AI_DISCLOSURE_MSG,
          character?.isAdult ? `\n${ADULT_DELIVERY_BLOCKED_MSG}` : null,
        ]
          .filter(Boolean)
          .join("\n"),
        token,
      );
      // Soft-attest peer for SFW continuity (not HEAA)
      if (!peer.ageAttestedAt && !character?.isAdult) {
        await attestTelegramPeerAge(peer.peerId, peer.userId);
      }
      return Response.json({ ok: true });
    }

    if (character?.isAdult) {
      await telegramSendMessage(chatId, ADULT_DELIVERY_BLOCKED_MSG, token);
      return Response.json({ ok: true });
    }

    if (!peer.ageAttestedAt) {
      // First non-/start message: disclose AI then continue
      await attestTelegramPeerAge(peer.peerId, peer.userId);
      await telegramSendMessage(chatId, AI_DISCLOSURE_MSG, token);
    }

    if (text === "/who" || text === "/status") {
      const { resolveSubject } = await import("@/lib/persona/subject");
      const subject = character
        ? await resolveSubject({
            workspaceId: character.workspaceId,
            telegramUserId: String(from.id),
            webUserId: peer.userId,
            displayName: from.first_name ?? null,
          }).catch(() => null)
        : null;
      const rel =
        character && subject
          ? await prisma.relationshipState.findUnique({
              where: {
                subjectId_characterId: {
                  subjectId: subject.id,
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
          "ai: automated Vesperer persona",
          "age: soft peer record (not HEAA)",
          rel
            ? `${phase} · t ${rel.trust.toFixed(2)} · a ${rel.affection.toFixed(2)} · ${rel.mood} · ${rel.currentTone}`
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
        telegramUserId: String(from.id),
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
            speed: cast.speed ?? 1.0,
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
