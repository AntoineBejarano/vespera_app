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

export type ChatEngineResult =
  | { ok: true; text: string; characterName: string; modelId: string }
  | { ok: false; error: string; status: number };

/**
 * Motor de chat compartido (web + Telegram): misma persona, memoria y relación por userId.
 */
export async function runCharacterReply(params: {
  userId: string;
  message: string;
  characterId?: string;
}): Promise<ChatEngineResult> {
  const text = params.message.trim();
  if (!text) return { ok: false, error: "Mensaje vacío", status: 400 };

  if (containsProhibitedMinorContent(text)) {
    return {
      ok: false,
      error:
        "Contenido no permitido (solo adultos 18+, sin menores ni age-play).",
      status: 400,
    };
  }

  const user = await prisma.user.findUnique({
    where: { id: params.userId },
    include: { settings: true },
  });
  if (!user?.ageVerifiedAt) {
    return { ok: false, error: "Usuario no verificado 18+", status: 403 };
  }

  const character = params.characterId
    ? await prisma.character.findFirst({
        where: { id: params.characterId, userId: user.id },
      })
    : await getActiveCharacter(user.id);

  if (!character) {
    return {
      ok: false,
      error: "No hay personaje activo. Créalo en la web (/chat/new).",
      status: 400,
    };
  }

  const limit = await checkAndIncrementDailyLimit(user.id);
  if (!limit.allowed) {
    return {
      ok: false,
      error: `Límite diario (${limit.limit}). Vuelve mañana.`,
      status: 429,
    };
  }

  const modelId = resolveModel(user.preferredModel);
  const memories = await searchMemories({
    userId: user.id,
    characterId: character.id,
    query: text,
  });
  const conversation = await ensureConversation(user.id, character.id);
  const summary = await getLatestSummary(conversation.id);
  const recent = await getRecentHistory(user.id, character.id, 25);
  const relationship = await ensureRelationshipState(user.id, character.id);

  const howToAddress =
    user.settings?.howToAddress || user.name || null;

  const system = assemblePersonaPrompt({
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
      displayName: user.name || "tú",
      howToAddress,
      userId: user.id,
    },
  });

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

  await prisma.message.create({
    data: {
      conversationId: conversation.id,
      role: "assistant",
      content: reply,
    },
  });
  await appendHistory(user.id, character.id, {
    role: "assistant",
    content: reply,
  });
  await prisma.conversation.update({
    where: { id: conversation.id },
    data: { updatedAt: new Date() },
  });

  await maybeCreateSummary({
    conversationId: conversation.id,
    characterId: character.id,
    modelId,
  });
  await maybeExtractMemories({
    userId: user.id,
    characterId: character.id,
    userMessage: text,
    assistantMessage: reply,
    modelId,
  });
  await maybeUpdateRelationship({
    userId: user.id,
    characterId: character.id,
    userMessage: text,
    assistantMessage: reply,
    modelId,
  });

  return {
    ok: true,
    text: reply,
    characterName: character.name,
    modelId,
  };
}
