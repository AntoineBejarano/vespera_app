import { streamText } from "ai";
import { prisma } from "@/lib/db";
import { getOpenRouter } from "@/lib/ai/openrouter";
import { resolveModel } from "@/lib/ai/models";
import {
  evaluateContentSafety,
  isSafetyKillSwitchActive,
  logSafetyBlock,
  SAFETY_BLOCK_MESSAGE,
} from "@/lib/ai/safety";
import { checkAndIncrementDailyLimit } from "@/lib/memory/limits";
import { appendHistory, getRecentHistory } from "@/lib/memory/history";
import { ensureConversation, getActiveCharacter } from "@/lib/users";
import { assemblePersonaPrompt } from "@/lib/persona/assemble";
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
import { loadMindContext, type MindActivityHit } from "@/lib/chat/mind-context";
import { enqueuePostTurn } from "@/lib/chat/post-turn";

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
      subjectId?: string;
      activity?: MindActivityHit[];
    }
  | { ok: false; error: string; status: number };

export type ChatPartnerOverride = {
  channel: "telegram" | "web";
  telegramFirstName?: string | null;
  telegramLastName?: string | null;
  telegramUsername?: string | null;
  /** API / CLI peer continuity key */
  externalCustomerId?: string | null;
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

export type PreparedCharacterTurn = {
  ok: true;
  user: {
    id: string;
    preferredModel: string | null;
    name: string | null;
    email: string | null;
    telegramFirstName: string | null;
    telegramLastName: string | null;
    telegramUsername: string | null;
    isTelegramPeer: boolean;
    settings: { howToAddress: string | null } | null;
  };
  character: NonNullable<Awaited<ReturnType<typeof getActiveCharacter>>>;
  conversationId: string;
  subjectId: string;
  system: string;
  modelId: string;
  modelMessages: { role: "user" | "assistant"; content: string }[];
  photo: ChatPhotoPayload | null;
  activity: MindActivityHit[];
  userMessage: string;
  dailyRemaining: number;
};

export type PrepareTurnError = { ok: false; error: string; status: number };

/**
 * Shared prep for web stream + JSON reply paths.
 * Loads Self / Knowledge / Memories / Affect / Intentions / Agency via loadMindContext.
 */
export async function prepareCharacterTurn(params: {
  userId: string;
  message: string;
  characterId?: string;
  partner?: ChatPartnerOverride;
  voiceMode?: boolean;
  systemAddon?: string;
  /** Skip daily limit increment (already counted by caller). */
  skipDailyLimit?: boolean;
}): Promise<PreparedCharacterTurn | PrepareTurnError> {
  const text = params.message.trim();
  if (!text) return { ok: false, error: "Empty message", status: 400 };

  if (isSafetyKillSwitchActive()) {
    return {
      ok: false,
      error: "Service temporarily unavailable.",
      status: 503,
    };
  }

  const inputSafety = evaluateContentSafety(text);
  if (inputSafety.blocked) {
    logSafetyBlock("chat_input", inputSafety.rule, {
      userId: params.userId,
    });
    return {
      ok: false,
      error: inputSafety.userMessage,
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
          params.partner?.channel === "telegram" ||
          Boolean(params.partner?.externalCustomerId);
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

  let dailyRemaining = 999;
  if (!params.skipDailyLimit) {
    const limit = await checkAndIncrementDailyLimit(user.id);
    if (!limit.allowed) {
      return {
        ok: false,
        error: `Daily limit (${limit.limit}). Try again tomorrow.`,
        status: 429,
      };
    }
    dailyRemaining = limit.remaining;
  }

  const conversation = await ensureConversation(user.id, character.id);
  const recent = await getRecentHistory(user.id, character.id, 25);
  const lastAssistant = [...recent]
    .reverse()
    .find((m) => m.role === "assistant")?.content;

  if (shouldStaySilent(text, lastAssistant)) {
    await prisma.message.create({
      data: { conversationId: conversation.id, role: "user", content: text },
    });
    await appendHistory(user.id, character.id, {
      role: "user",
      content: text,
    });
    return {
      ok: false,
      error: "__SILENT__",
      status: 204,
    };
  }

  const photo = params.voiceMode
    ? null
    : await pickCharacterPhoto(character.id, text);

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

  const mind = await loadMindContext({
    workspaceId: character.workspaceId,
    character,
    query: text,
    conversationId: conversation.id,
    identities: {
      webUserId: user.isTelegramPeer ? null : user.id,
      telegramUserId: user.telegramId,
      externalCustomerId: params.partner?.externalCustomerId,
      displayName: partnerName.displayName,
    },
  });

  const modelId = resolveModel(
    character.preferredModel ?? user.preferredModel,
  );
  const systemBase = assemblePersonaPrompt({
    persona: mind.persona,
    relationship: mind.affect,
    memoryBrief: mind.memoryBrief,
    knowledgeBrief: mind.knowledgeBrief,
    intentionBrief: mind.intentionBrief,
    summary: mind.summary,
    partner: {
      displayName: partnerName.displayName,
      howToAddress: partnerName.howToAddress,
      userId: user.id,
      subjectId: mind.subjectId,
      channel,
      telegramUsername: tgUser,
    },
    photoHint: params.voiceMode
      ? false
      : photo
        ? photoVibeHint(photo.label)
        : false,
  });
  const system = params.systemAddon
    ? `${systemBase}\n\n${params.systemAddon}`
    : systemBase;

  await prisma.message.create({
    data: { conversationId: conversation.id, role: "user", content: text },
  });
  await appendHistory(user.id, character.id, { role: "user", content: text });

  return {
    ok: true,
    user: {
      id: user.id,
      preferredModel: user.preferredModel,
      name: user.name,
      email: user.email,
      telegramFirstName: user.telegramFirstName,
      telegramLastName: user.telegramLastName,
      telegramUsername: user.telegramUsername,
      isTelegramPeer: user.isTelegramPeer,
      settings: user.settings
        ? { howToAddress: user.settings.howToAddress }
        : null,
    },
    character,
    conversationId: conversation.id,
    subjectId: mind.subjectId,
    system,
    modelId,
    modelMessages: [
      ...recent.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
      { role: "user" as const, content: text },
    ],
    photo,
    activity: mind.activity,
    userMessage: text,
    dailyRemaining,
  };
}

/**
 * Shared chat engine (web admin + Telegram + API): same mind context.
 * Returns humanized bubbles + optional photo. Post-turn work is async.
 */
export async function runCharacterReply(params: {
  userId: string;
  message: string;
  characterId?: string;
  partner?: ChatPartnerOverride;
  voiceMode?: boolean;
  systemAddon?: string;
}): Promise<ChatEngineResult> {
  const prepared = await prepareCharacterTurn(params);
  if (!prepared.ok) {
    if (prepared.status === 204 && prepared.error === "__SILENT__") {
      return {
        ok: true,
        text: "",
        bubbles: [],
        photo: null,
        characterId: params.characterId ?? "",
        characterName: "",
        modelId: resolveModel(undefined),
      };
    }
    return prepared;
  }

  const openrouter = getOpenRouter();
  const result = streamText({
    model: openrouter(prepared.modelId),
    system: prepared.system,
    messages: prepared.modelMessages,
  });

  const reply = await result.text;
  const outputSafety = evaluateContentSafety(reply);
  const safeReply = outputSafety.blocked ? SAFETY_BLOCK_MESSAGE : reply;
  if (outputSafety.blocked) {
    logSafetyBlock("chat_output", outputSafety.rule, {
      userId: params.userId,
      characterId: prepared.character.id,
    });
  }

  const bubbles = scrubBubbles(splitIntoBubbles(safeReply));
  const stored = bubbles.join("\n\n");
  const persistContent =
    stored || (prepared.photo ? "(sent a photo)" : "");

  let assistantMessageId: string | null = null;
  if (persistContent) {
    const msg = await prisma.message.create({
      data: {
        conversationId: prepared.conversationId,
        role: "assistant",
        content: persistContent,
      },
    });
    assistantMessageId = msg.id;
    await appendHistory(prepared.user.id, prepared.character.id, {
      role: "assistant",
      content: persistContent,
    });
  }
  await prisma.conversation.update({
    where: { id: prepared.conversationId },
    data: { updatedAt: new Date() },
  });

  if (
    assistantMessageId &&
    persistContent &&
    persistContent !== "(sent a photo)" &&
    !outputSafety.blocked
  ) {
    enqueuePostTurn({
      conversationId: prepared.conversationId,
      upToMessageId: assistantMessageId,
      subjectId: prepared.subjectId,
      characterId: prepared.character.id,
      userId: prepared.user.id,
      userMessage: prepared.userMessage,
      assistantMessage: persistContent,
      modelId: prepared.modelId,
    });
  }

  return {
    ok: true,
    text: stored,
    bubbles,
    photo: prepared.photo
      ? { ...prepared.photo, caption: safePhotoCaption(prepared.photo.caption) ?? null }
      : null,
    characterId: prepared.character.id,
    characterName: prepared.character.name,
    modelId: prepared.modelId,
    subjectId: prepared.subjectId,
    activity: prepared.activity,
  };
}

/**
 * Streaming path for /api/chat — same mind prep as runCharacterReply.
 */
export async function streamCharacterReply(params: {
  userId: string;
  message: string;
  characterId?: string;
  partner?: ChatPartnerOverride;
  skipDailyLimit?: boolean;
}) {
  const prepared = await prepareCharacterTurn({
    ...params,
    partner: params.partner ?? { channel: "web" },
    skipDailyLimit: params.skipDailyLimit,
  });
  if (!prepared.ok) return prepared;

  const openrouter = getOpenRouter();
  const result = streamText({
    model: openrouter(prepared.modelId),
    system: prepared.system,
    messages: prepared.modelMessages,
    onFinish: async ({ text }) => {
      try {
        const { track } = await import("@/lib/metrics");
        track("chat_message", { model: prepared.modelId });
        const msg = await prisma.message.create({
          data: {
            conversationId: prepared.conversationId,
            role: "assistant",
            content: text,
          },
        });
        await appendHistory(prepared.user.id, prepared.character.id, {
          role: "assistant",
          content: text,
        });
        await prisma.conversation.update({
          where: { id: prepared.conversationId },
          data: { updatedAt: new Date() },
        });
        if (text && !evaluateContentSafety(text).blocked) {
          enqueuePostTurn({
            conversationId: prepared.conversationId,
            upToMessageId: msg.id,
            subjectId: prepared.subjectId,
            characterId: prepared.character.id,
            userId: prepared.user.id,
            userMessage: prepared.userMessage,
            assistantMessage: text,
            modelId: prepared.modelId,
          });
        }
      } catch (err) {
        console.error("[streamCharacterReply onFinish]", err);
      }
    },
  });

  return {
    ok: true as const,
    streamResult: result,
    prepared,
  };
}
