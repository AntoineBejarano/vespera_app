import { generateText, Output } from "ai";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getOpenRouter } from "@/lib/ai/openrouter";
import { resolveModel } from "@/lib/ai/models";
import { evaluateContentSafety } from "@/lib/ai/safety";

const updateSchema = z.object({
  mood: z.string(),
  trustDelta: z.number().min(-0.08).max(0.08),
  affectionDelta: z.number().min(-0.08).max(0.08),
  energyDelta: z.number().min(-0.1).max(0.1),
  summary: z.string().max(280).optional(),
});

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

export async function ensureRelationshipState(
  userId: string,
  characterId: string,
) {
  return prisma.relationshipState.upsert({
    where: {
      userId_characterId: { userId, characterId },
    },
    create: {
      userId,
      characterId,
      mood: "curious",
      trust: 0.35,
      affection: 0.3,
      energy: 0.7,
      summary: "Just starting to know each other.",
    },
    update: {},
  });
}

/**
 * Adjust mood/trust/affection/energy after a turn (per user×character).
 */
export async function maybeUpdateRelationship(params: {
  userId: string;
  characterId: string;
  userMessage: string;
  assistantMessage: string;
  modelId?: string;
}) {
  if (
    evaluateContentSafety(params.userMessage).blocked ||
    evaluateContentSafety(params.assistantMessage).blocked
  ) {
    return;
  }

  try {
    const current = await ensureRelationshipState(
      params.userId,
      params.characterId,
    );
    const openrouter = getOpenRouter();
    const { output } = await generateText({
      model: openrouter(resolveModel(params.modelId)),
      output: Output.object({ schema: updateSchema }),
      prompt: `Update relationship state after one adult chat turn.
Current: mood=${current.mood}, trust=${current.trust}, affection=${current.affection}, energy=${current.energy}, summary=${current.summary ?? ""}

User: ${params.userMessage}
Companion: ${params.assistantMessage}

Return mood (one word), small deltas (-0.08..0.08), and a short summary (max 280 chars).
No moralizing. Be subtle.`,
    });

    if (!output) return;

    await prisma.relationshipState.update({
      where: {
        userId_characterId: {
          userId: params.userId,
          characterId: params.characterId,
        },
      },
      data: {
        mood: output.mood.slice(0, 40),
        trust: clamp01(current.trust + output.trustDelta),
        affection: clamp01(current.affection + output.affectionDelta),
        energy: clamp01(current.energy + output.energyDelta),
        summary: output.summary ?? current.summary,
      },
    });
  } catch (error) {
    console.error("[relationship-update]", error);
  }
}
