import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  streamText,
  toUIMessageStream,
  type UIMessage,
} from "ai";
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
import { requireAppUser } from "@/lib/session";

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const user = await requireAppUser().catch(() => null);
  if (!user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }
    const body = await req.json();
    const messages = (body.messages ?? []) as UIMessage[];
    const characterId = body.characterId as string | undefined;

    const character = characterId
      ? await prisma.character.findFirst({
          where: { id: characterId, userId: user.id },
        })
      : await getActiveCharacter(user.id);

    if (!character) {
      return Response.json(
        { error: "No hay personaje activo. Crea uno en /chat/new" },
        { status: 400 },
      );
    }

    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    const lastText =
      lastUser?.parts
        ?.filter((p): p is { type: "text"; text: string } => p.type === "text")
        .map((p) => p.text)
        .join("\n") ?? "";

    if (!lastText.trim()) {
      return Response.json({ error: "Mensaje vacío" }, { status: 400 });
    }

    if (containsProhibitedMinorContent(lastText)) {
      const { track } = await import("@/lib/metrics");
      track("safety_block");
      return Response.json(
        {
          error:
            "Contenido no permitido: Vespera es solo para adultos consentidos (18+). No se permite material sexual con menores ni age-play.",
        },
        { status: 400 },
      );
    }

    const limit = await checkAndIncrementDailyLimit(user.id);
    if (!limit.allowed) {
      const { track } = await import("@/lib/metrics");
      track("daily_limit_hit");
      return Response.json(
        {
          error: `Has alcanzado el límite diario gratuito (${limit.limit} mensajes). Vuelve mañana.`,
          remaining: 0,
        },
        { status: 429 },
      );
    }

    const modelId = resolveModel(user.preferredModel);
    const memories = await searchMemories({
      userId: user.id,
      characterId: character.id,
      query: lastText,
    });

    const conversation = await ensureConversation(user.id, character.id);
    const summary = await getLatestSummary(conversation.id);
    const recent = await getRecentHistory(user.id, character.id, 25);
    const relationship = await ensureRelationshipState(user.id, character.id);

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
        displayName: user.name || user.email || "usuario",
        howToAddress:
          (
            await prisma.userSettings.findUnique({
              where: { userId: user.id },
            })
          )?.howToAddress || user.name,
        userId: user.id,
      },
    });

    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: "user",
        content: lastText,
      },
    });
    await appendHistory(user.id, character.id, {
      role: "user",
      content: lastText,
    });

    const openrouter = getOpenRouter();
    const modelMessages =
      recent.length > 0
        ? [
            ...recent.map((m) => ({
              role: m.role as "user" | "assistant",
              content: m.content,
            })),
            { role: "user" as const, content: lastText },
          ]
        : await convertToModelMessages(messages);

    const result = streamText({
      model: openrouter(modelId),
      system,
      messages: modelMessages,
      onFinish: async ({ text }) => {
        try {
          const { track } = await import("@/lib/metrics");
          track("chat_message", { model: modelId });
          await prisma.message.create({
            data: {
              conversationId: conversation.id,
              role: "assistant",
              content: text,
            },
          });
          await appendHistory(user.id, character.id, {
            role: "assistant",
            content: text,
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
            userMessage: lastText,
            assistantMessage: text,
            modelId,
          });
          await maybeUpdateRelationship({
            userId: user.id,
            characterId: character.id,
            userMessage: lastText,
            assistantMessage: text,
            modelId,
          });
        } catch (err) {
          console.error("[chat onFinish]", err);
        }
      },
    });

    return createUIMessageStreamResponse({
      stream: toUIMessageStream({ stream: result.stream }),
      headers: {
        "X-Daily-Remaining": String(limit.remaining),
        "X-Model": modelId,
      },
    });
  } catch (error) {
    console.error("[api/chat]", error);
    const message =
      error instanceof Error ? error.message : "Error interno del servidor";
    if (message.includes("OPENROUTER") || message.includes("rate")) {
      const { track } = await import("@/lib/metrics");
      track("openrouter_error");
      return Response.json(
        {
          error:
            "OpenRouter no disponible o rate limit. Reintenta en unos segundos.",
        },
        { status: 502 },
      );
    }
    return Response.json({ error: message }, { status: 500 });
  }
}
