import { streamText } from "ai";
import { prisma } from "@/lib/db";
import { getOpenRouter } from "@/lib/ai/openrouter";
import { resolveModel } from "@/lib/ai/models";
import { containsProhibitedMinorContent } from "@/lib/ai/safety";
import { checkAndIncrementDailyLimit } from "@/lib/memory/limits";
import { appendHistory, getRecentHistory } from "@/lib/memory/history";
import { searchMemories } from "@/lib/memory/vector";
import { maybeExtractMemories } from "@/lib/memory/extractor";
import {
  getLatestSummary,
  maybeCreateSummary,
} from "@/lib/memory/summaries";
import { ensureConversation, getActiveCharacter } from "@/lib/users";
import { assemblePersonaPrompt } from "@/lib/persona/assemble";
import {
  ensureRelationshipState,
  maybeUpdateRelationship,
} from "@/lib/persona/relationship";
import {
  scrubBubbles,
  safePhotoCaption,
  splitIntoBubbles,
} from "@/lib/chat/humanize";
import {
  parsePhotoIntent,
  photoHintLabel,
  rankPhotosForIntent,
} from "@/lib/chat/photos";
import { shouldStaySilent } from "@/lib/chat/closing";
import { resolvePartnerName } from "@/lib/telegram/profile";

export type ChatPhotoPayload = {
  url: string;
  caption?: string | null;
  kind?: string;
  tags?: string[];
  label?: string;
};

export type ChatEngineResult =
  | {
      ok: true;
      text: string;
      bubbles: string[];
      photo: ChatPhotoPayload | null;
      characterId: string;
      characterName: string;
      modelId: string;
    }
  | { ok: false; error: string; status: number };

export type ChatPartnerOverride = {
  channel: "telegram" | "web";
  telegramFirstName?: string | null;
  telegramLastName?: string | null;
  telegramUsername?: string | null;
};

async function pickCharacterPhoto(characterId: string, message: string) {
  const intent = parsePhotoIntent(message);
  if (!intent.wantsPhoto) return null;

  const photos = await prisma.characterPhoto.findMany({
    where: { characterId },
    orderBy: { createdAt: "desc" },
  });
  if (!photos.length) return null;

  const ranked = rankPhotosForIntent(
    photos.map((p) => ({
      id: p.id,
      url: p.url,
      caption: p.caption,
      kind: p.kind,
      tags: p.tags ?? [],
    })),
    intent,
  );
  const photo = ranked[0];
  if (!photo) return null;

  return {
    url: photo.url,
    caption: safePhotoCaption(photo.caption) ?? null,
    kind: photo.kind,
    tags: photo.tags,
    label: photoHintLabel(photo),
  };
}

function photoVibeHint(label?: string): true | "cute" | "spicy" {
  if (!label) return true;
  if (/\b(ass|tits|nude|spicy|lingerie)\b/i.test(label)) return "spicy";
  if (/\b(face|selfie)\b/i.test(label)) return "cute";
  return true;
}

/**
 * Shared chat engine (web admin + Telegram): same persona, memory, relationship.
 * Returns humanized bubbles + optional photo.
 */
export async function runCharacterReply(params: {
  userId: string;
  message: string;
  characterId?: string;
  partner?: ChatPartnerOverride;
  /** When true, reply is meant to be spoken aloud (Telegram voice note). */
  voiceMode?: boolean;
  /** Extra system instructions (e.g. voice-note delivery rules). */
  systemAddon?: string;
}): Promise<ChatEngineResult> {
  const text = params.message.trim();
  if (!text) return { ok: false, error: "Empty message", status: 400 };

  if (containsProhibitedMinorContent(text)) {
    return {
      ok: false,
      error:
        "Content not allowed (adults 18+ only, no minors / age-play).",
      status: 400,
    };
  }

  const user = await prisma.user.findUnique({
    where: { id: params.userId },
    include: { settings: true },
  });
  if (!user?.ageVerifiedAt) {
    return { ok: false, error: "User not age-verified 18+", status: 403 };
  }

  const character = params.characterId
    ? await (async () => {
        const found = await prisma.character.findUnique({
          where: { id: params.characterId },
        });
        if (!found) return null;
        const allowed =
          found.userId === user.id ||
          user.isTelegramPeer ||
          params.partner?.channel === "telegram";
        return allowed ? found : null;
      })()
    : await getActiveCharacter(user.id);

  if (!character) {
    return {
      ok: false,
      error: "No active persona. Create one in /personas/new.",
      status: 400,
    };
  }

  const limit = await checkAndIncrementDailyLimit(user.id);
  if (!limit.allowed) {
    return {
      ok: false,
      error: `Daily limit (${limit.limit}). Try again tomorrow.`,
      status: 429,
    };
  }

  const conversation = await ensureConversation(user.id, character.id);
  const recent = await getRecentHistory(user.id, character.id, 25);
  const lastAssistant = [...recent]
    .reverse()
    .find((m) => m.role === "assistant")?.content;

  // User acknowledged goodbye / sleep → stay silent (no loop)
  if (shouldStaySilent(text, lastAssistant)) {
    await prisma.message.create({
      data: { conversationId: conversation.id, role: "user", content: text },
    });
    await appendHistory(user.id, character.id, {
      role: "user",
      content: text,
    });
    return {
      ok: true,
      text: "",
      bubbles: [],
      photo: null,
      characterId: character.id,
      characterName: character.name,
      modelId: resolveModel(user.preferredModel),
    };
  }

  const photo = params.voiceMode
    ? null
    : await pickCharacterPhoto(character.id, text);

  const modelId = resolveModel(user.preferredModel);
  const memories = await searchMemories({
    userId: user.id,
    characterId: character.id,
    query: text,
  });
  const summary = await getLatestSummary(conversation.id);
  const relationship = await ensureRelationshipState(user.id, character.id);

  const channel = params.partner?.channel ?? "web";
  const tgFirst =
    params.partner?.telegramFirstName ?? user.telegramFirstName;
  const tgLast =
    params.partner?.telegramLastName ?? user.telegramLastName;
  const tgUser =
    params.partner?.telegramUsername ?? user.telegramUsername;

  const partnerName = resolvePartnerName({
    channel,
    telegramFirstName: tgFirst,
    telegramLastName: tgLast,
    howToAddress: user.settings?.howToAddress,
    accountName: user.name,
  });

  const systemBase = assemblePersonaPrompt({
    persona: {
      name: character.name,
      intensity: character.intensity,
      soulMd: character.soulMd,
      styleMd: character.styleMd,
      rulesMd: character.rulesMd,
      contextMd: character.contextMd,
      identityJson: character.identityJson,
      limitsJson: character.limitsJson,
    },
    relationship: {
      mood: relationship.mood,
      trust: relationship.trust,
      affection: relationship.affection,
      energy: relationship.energy,
      summary: relationship.summary ?? undefined,
    },
    memoryBrief: memories,
    summary: summary?.content,
    partner: {
      displayName: partnerName.displayName,
      howToAddress: partnerName.howToAddress,
      userId: user.id,
      channel,
      telegramUsername: tgUser,
    },
    // Voice notes should not pull a photo into the turn.
    photoHint: params.voiceMode ? false : photo ? photoVibeHint(photo.label) : false,
  });
  const system = params.systemAddon
    ? `${systemBase}\n\n${params.systemAddon}`
    : systemBase;

  await prisma.message.create({
    data: { conversationId: conversation.id, role: "user", content: text },
  });
  await appendHistory(user.id, character.id, { role: "user", content: text });

  const openrouter = getOpenRouter();
  const modelMessages = [
    ...recent.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user" as const, content: text },
  ];

  const result = streamText({
    model: openrouter(modelId),
    system,
    messages: modelMessages,
  });

  const reply = await result.text;
  const bubbles = scrubBubbles(splitIntoBubbles(reply));
  const stored = bubbles.join("\n\n");

  // Still persist something for memory even if scrubbed empty (photo-only turn)
  const persistContent =
    stored ||
    (photo ? "(sent a photo)" : "");

  if (persistContent) {
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: "assistant",
        content: persistContent,
      },
    });
    await appendHistory(user.id, character.id, {
      role: "assistant",
      content: persistContent,
    });
  }
  await prisma.conversation.update({
    where: { id: conversation.id },
    data: { updatedAt: new Date() },
  });

  if (persistContent && persistContent !== "(sent a photo)") {
    await maybeCreateSummary({
      conversationId: conversation.id,
      characterId: character.id,
      modelId,
    });
    await maybeExtractMemories({
      userId: user.id,
      characterId: character.id,
      userMessage: text,
      assistantMessage: persistContent,
      modelId,
    });
    await maybeUpdateRelationship({
      userId: user.id,
      characterId: character.id,
      userMessage: text,
      assistantMessage: persistContent,
      modelId,
    });
  }

  return {
    ok: true,
    text: stored,
    bubbles,
    photo: photo
      ? { ...photo, caption: safePhotoCaption(photo.caption) ?? null }
      : null,
    characterId: character.id,
    characterName: character.name,
    modelId,
  };
}
