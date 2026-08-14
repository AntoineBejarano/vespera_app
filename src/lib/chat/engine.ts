import { prisma } from "@/lib/db";
import { resolveModel } from "@/lib/ai/models";
import {
  evaluateContentSafety,
  isSafetyKillSwitchActive,
  logSafetyBlock,
  SAFETY_BLOCK_MESSAGE,
} from "@/lib/ai/safety";
import { checkAndIncrementDailyLimit } from "@/lib/memory/limits";
import { appendHistory, getRecentHistory } from "@/lib/memory/history";
import { getActiveCharacter } from "@/lib/users";
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
  type PhotoIntent,
} from "@/lib/chat/photos";
import { shouldStaySilent } from "@/lib/chat/closing";
import { resolvePartnerName } from "@/lib/telegram/profile";
import { loadMindContext, type MindActivityHit } from "@/lib/chat/mind-context";
import {
  assertCapability,
  isEndUserAgeAssured,
} from "@/lib/content-policy/runtime";
import {
  ContentPolicyError,
  looksLikeAdultSexualRequest,
} from "@/lib/content-policy";
import { buildPaywall, type PaywallPayload } from "@/lib/billing/paywall";
import { logProductEvent } from "@/lib/product-events";
import { hasWorkspacePermission } from "@/lib/workspace/permissions";
import { ensureConversation } from "@/lib/core/conversation";
import { buildContextEnvelope } from "@/lib/core/continuity";
import { recordInteraction } from "@/lib/core/interaction";
import type { ContextEnvelope, ReasoningChannel } from "@/lib/core/types";
import {
  loadRuntimeBinding,
  reasonExternal,
  reasonNative,
  resolveReasoningMode,
  streamNative,
} from "@/lib/reasoning";

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
  | { ok: false; error: string; status: number; paywall?: PaywallPayload };

export type ChatPartnerOverride = {
  channel: ReasoningChannel;
  /** Telegram numeric user id — required for peer subjects (User.telegramId is only for linked accounts). */
  telegramUserId?: string | null;
  telegramFirstName?: string | null;
  telegramLastName?: string | null;
  telegramUsername?: string | null;
  /** API / CLI peer continuity key */
  externalCustomerId?: string | null;
};

type PhotoPick =
  | { status: "none" }
  | { status: "miss"; requested: string; intent: PhotoIntent }
  | {
      status: "photo";
      photo: ChatPhotoPayload;
      intent: PhotoIntent;
    };

async function pickCharacterPhoto(
  characterId: string,
  message: string,
): Promise<PhotoPick> {
  const intent = parsePhotoIntent(message);
  if (!intent.wantsPhoto) return { status: "none" };

  const photos = await prisma.characterPhoto.findMany({
    where: { characterId },
    orderBy: { createdAt: "desc" },
  });
  if (!photos.length) {
    if (intent.requestedLabel) {
      return { status: "miss", requested: intent.requestedLabel, intent };
    }
    return { status: "none" };
  }

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

  if (ranked.miss) {
    return {
      status: "miss",
      requested:
        intent.requestedLabel ?? (intent.query.join(" ") || "that"),
      intent,
    };
  }

  const photo = ranked.photos[0];
  if (!photo) return { status: "none" };

  return {
    status: "photo",
    intent,
    photo: {
      url: photo.url,
      caption: safePhotoCaption(photo.caption) ?? null,
      kind: photo.kind,
      tags: photo.tags,
      label: photoHintLabel(photo),
    },
  };
}

function photoVibeHint(label?: string): true | "cute" | "spicy" | string {
  if (!label) return true;
  if (/\b(ass|tits|nude|spicy|lingerie|culo|tetas)\b/i.test(label)) {
    return "spicy";
  }
  if (/\b(face|selfie|cara)\b/i.test(label)) return "cute";
  return label;
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
  envelope: ContextEnvelope;
};

export type PrepareTurnError = {
  ok: false;
  error: string;
  status: number;
  paywall?: PaywallPayload;
};

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
  if (!user) {
    return { ok: false, error: "User not found", status: 404 };
  }

  const character = params.characterId
    ? await (async () => {
        const found = await prisma.character.findUnique({
          where: { id: params.characterId },
        });
        if (!found) return null;
        const workspaceMemberCanRun =
          !user.isTelegramPeer &&
          (await hasWorkspacePermission(
            user.id,
            found.workspaceId,
            "playground.run",
          ));
        const allowed =
          found.userId === user.id ||
          workspaceMemberCanRun ||
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

  // Content policy: adult delivery deny-by-default without HEAA
  const policyChannel =
    params.partner?.channel === "telegram"
      ? "telegram"
      : params.partner?.externalCustomerId
        ? "api"
        : "web";
  const adultIntent =
    character.isAdult || looksLikeAdultSexualRequest(text);
  if (adultIntent) {
    const ageAssured = isEndUserAgeAssured(user);
    // Studio operator testing adult persona on web: config path (not end-user delivery)
    const operatorWebTest =
      policyChannel === "web" &&
      !user.isTelegramPeer &&
      character.userId === user.id;
    try {
      await assertCapability({
        workspaceId: character.workspaceId,
        characterAdult: character.isAdult,
        subjectAgeVerified: ageAssured,
        channel: policyChannel,
        requestedCapability: "chat_adult",
        isDelivery: !operatorWebTest,
      });
    } catch (err) {
      if (err instanceof ContentPolicyError) {
        return { ok: false, error: err.message, status: 403 };
      }
      throw err;
    }
  }

  let dailyRemaining = 999;
  if (!params.skipDailyLimit) {
    const limit = await checkAndIncrementDailyLimit(user.id);
    if (!limit.allowed) {
      const paywall = buildPaywall({
        reason: "daily_message_limit",
        feature: "daily_messages",
        plan: "creator",
        limit: limit.limit,
        remaining: 0,
      });
      await logProductEvent({
        type: "paywall_viewed",
        userId: user.id,
        workspaceId: character.workspaceId,
        feature: "daily_messages",
        plan: "creator",
        context: {
          reason: "daily_message_limit",
          limit: limit.limit,
          remaining: 0,
          route: "chat_engine",
        },
      });
      return {
        ok: false,
        error: paywall.error,
        status: 402,
        paywall,
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

  const photoPick = params.voiceMode
    ? ({ status: "none" } as const)
    : await pickCharacterPhoto(character.id, text);
  const photo = photoPick.status === "photo" ? photoPick.photo : null;
  const photoMiss =
    photoPick.status === "miss" ? photoPick.requested : null;

  const channel: ReasoningChannel = params.voiceMode
    ? "voice"
    : params.partner?.channel ??
      (params.partner?.externalCustomerId ? "api" : "web");
  const partnerChannel = channel === "telegram" ? "telegram" : "web";
  const tgFirst =
    params.partner?.telegramFirstName ?? user.telegramFirstName;
  const tgLast =
    params.partner?.telegramLastName ?? user.telegramLastName;
  const tgUser =
    params.partner?.telegramUsername ?? user.telegramUsername;

  const partnerName = resolvePartnerName({
    channel: partnerChannel,
    telegramFirstName: tgFirst,
    telegramLastName: tgLast,
    howToAddress: user.settings?.howToAddress,
    accountName: user.name,
  });

  // Peers store tg id on TelegramPeer, not User.telegramId (reserved for linked accounts).
  let telegramUserId =
    params.partner?.telegramUserId?.trim() || user.telegramId || null;
  if (!telegramUserId && user.isTelegramPeer) {
    const peer = await prisma.telegramPeer.findFirst({
      where: { userId: user.id },
      select: { telegramUserId: true },
    });
    telegramUserId = peer?.telegramUserId ?? null;
  }

  const mind = await loadMindContext({
    workspaceId: character.workspaceId,
    character,
    query: text,
    conversationId: conversation.id,
    identities: {
      // Peers key by telegramUserId; fall back to stub user id only if tg id missing.
      webUserId:
        user.isTelegramPeer && telegramUserId ? null : user.id,
      telegramUserId,
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
      channel: partnerChannel,
      telegramUsername: tgUser,
    },
    photoHint: params.voiceMode
      ? false
      : photo
        ? photoVibeHint(photo.label)
        : false,
    photoMiss: params.voiceMode ? null : photoMiss,
  });
  const system = params.systemAddon
    ? `${systemBase}\n\n${params.systemAddon}`
    : systemBase;

  await ensureConversation(user.id, character.id, {
    subjectId: mind.subjectId,
    channel,
  });

  const modelMessages = [
    ...recent.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user" as const, content: text },
  ];

  const envelope = buildContextEnvelope({
    character: {
      id: character.id,
      name: character.name,
      soulMd: character.soulMd,
      styleMd: character.styleMd,
      rulesMd: character.rulesMd,
      contextMd: character.contextMd,
      intensity: character.intensity,
      isAdult: character.isAdult,
      channels: character.channels,
      workspaceId: character.workspaceId,
    },
    subject: mind.subject,
    affect: mind.affect,
    intentions: mind.intentionBrief,
    stage: mind.stage,
    channel,
    conversationId: conversation.id,
    recent: modelMessages,
    summary: mind.summary,
    memoryBrief: mind.memoryBrief,
    knowledgeBrief: mind.knowledgeBrief,
    currentMessage: text,
    modelId,
  });

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
    modelMessages,
    photo,
    activity: mind.activity,
    userMessage: text,
    dailyRemaining,
    envelope,
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

  const reasoned = await reasonPreparedTurn(prepared);
  if (!reasoned.ok) return reasoned;

  const outputSafety = evaluateContentSafety(reasoned.text);
  const safeReply = outputSafety.blocked ? SAFETY_BLOCK_MESSAGE : reasoned.text;
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

  if (persistContent) {
    await recordInteraction({
      conversationId: prepared.conversationId,
      characterId: prepared.character.id,
      subjectId: prepared.subjectId,
      userId: prepared.user.id,
      userMessage: prepared.userMessage,
      assistantMessage: persistContent,
      modelId: prepared.modelId,
      proposed_relationship_update: outputSafety.blocked
        ? null
        : reasoned.proposed_relationship_update,
      skipPostTurn:
        persistContent === "(sent a photo)" || outputSafety.blocked,
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

async function reasonPreparedTurn(prepared: PreparedCharacterTurn) {
  const mode = resolveReasoningMode(prepared.character);
  if (mode === "external") {
    const loaded = await loadRuntimeBinding({
      workspaceId: prepared.character.workspaceId,
      bindingId: prepared.character.reasoningBindingId,
    });
    if (!loaded.ok) {
      return { ok: false as const, error: loaded.error, status: loaded.status };
    }
    const result = await reasonExternal(prepared.envelope, loaded.binding);
    if (result.status === "error") {
      return {
        ok: false as const,
        error: result.error ?? "External runtime failed",
        status: 502,
      };
    }
    return {
      ok: true as const,
      text: result.text,
      proposed_relationship_update: result.proposed_relationship_update,
    };
  }

  const result = await reasonNative({
    modelId: prepared.modelId,
    system: prepared.system,
    messages: prepared.modelMessages,
  });
  return {
    ok: true as const,
    text: result.text,
    proposed_relationship_update: undefined,
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

  const mode = resolveReasoningMode(prepared.character);
  if (mode === "external") {
    const reasoned = await reasonPreparedTurn(prepared);
    if (!reasoned.ok) return reasoned;
    const outputSafety = evaluateContentSafety(reasoned.text);
    const text = outputSafety.blocked ? SAFETY_BLOCK_MESSAGE : reasoned.text;
    if (text) {
      await recordInteraction({
        conversationId: prepared.conversationId,
        characterId: prepared.character.id,
        subjectId: prepared.subjectId,
        userId: prepared.user.id,
        userMessage: prepared.userMessage,
        assistantMessage: text,
        modelId: prepared.modelId,
        proposed_relationship_update: outputSafety.blocked
          ? null
          : reasoned.proposed_relationship_update,
        skipPostTurn: outputSafety.blocked,
      });
    }
    return {
      ok: true as const,
      mode: "external" as const,
      text,
      prepared,
    };
  }

  const result = streamNative({
    modelId: prepared.modelId,
    system: prepared.system,
    messages: prepared.modelMessages,
    onFinish: async (text) => {
      try {
        const { track } = await import("@/lib/metrics");
        track("chat_message", { model: prepared.modelId });
        if (text && !evaluateContentSafety(text).blocked) {
          await recordInteraction({
            conversationId: prepared.conversationId,
            characterId: prepared.character.id,
            subjectId: prepared.subjectId,
            userId: prepared.user.id,
            userMessage: prepared.userMessage,
            assistantMessage: text,
            modelId: prepared.modelId,
          });
        } else if (text) {
          await prisma.message.create({
            data: {
              conversationId: prepared.conversationId,
              role: "assistant",
              content: text,
            },
          });
        }
      } catch (err) {
        console.error("[streamCharacterReply onFinish]", err);
      }
    },
  });

  return {
    ok: true as const,
    mode: "native" as const,
    streamResult: result,
    prepared,
  };
}
