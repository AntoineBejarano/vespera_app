import { generateText, Output } from "ai";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getOpenRouter } from "@/lib/ai/openrouter";
import { resolveModel } from "@/lib/ai/models";
import { evaluateContentSafety } from "@/lib/ai/safety";
import {
  CURRENT_TONES,
  clamp01,
  normalizeAffect,
  parseCurrentTone,
  type AffectSnapshot,
} from "@/lib/persona/affect";

const updateSchema = z.object({
  mood: z.string(),
  trustDelta: z.number().min(-0.08).max(0.08),
  affectionDelta: z.number().min(-0.08).max(0.08),
  energyDelta: z.number().min(-0.1).max(0.1),
  familiarityDelta: z.number().min(-0.08).max(0.08),
  opennessDelta: z.number().min(-0.08).max(0.08),
  playfulnessDelta: z.number().min(-0.08).max(0.08),
  currentTone: z.enum(CURRENT_TONES),
  summary: z.string().max(280).optional(),
});

export async function ensureRelationshipState(
  subjectId: string,
  characterId: string,
  bridgeUserId?: string | null,
) {
  return prisma.relationshipState.upsert({
    where: {
      subjectId_characterId: { subjectId, characterId },
    },
    create: {
      subjectId,
      characterId,
      userId: bridgeUserId ?? undefined,
      mood: "curious",
      trust: 0.35,
      affection: 0.3,
      energy: 0.7,
      familiarity: 0.2,
      openness: 0.4,
      playfulness: 0.4,
      currentTone: "neutral",
      summary: "Just starting to know each other.",
    },
    update: bridgeUserId
      ? { userId: bridgeUserId }
      : {},
  });
}

export function toAffectSnapshot(
  row: Awaited<ReturnType<typeof ensureRelationshipState>>,
): AffectSnapshot {
  return normalizeAffect(row);
}

/**
 * Adjust affect dims after a turn (per subject×character).
 * Uses optimistic version bump to reduce concurrent clobbering.
 */
export async function maybeUpdateRelationship(params: {
  subjectId: string;
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
      params.subjectId,
      params.characterId,
    );
    const openrouter = getOpenRouter();
    const { output } = await generateText({
      model: openrouter(resolveModel(params.modelId)),
      output: Output.object({ schema: updateSchema }),
      prompt: `Update simulated relationship affect after one chat turn.
Current: mood=${current.mood}, trust=${current.trust}, affection=${current.affection}, energy=${current.energy}, familiarity=${current.familiarity}, openness=${current.openness}, playfulness=${current.playfulness}, tone=${current.currentTone}, summary=${current.summary ?? ""}

User: ${params.userMessage}
Companion: ${params.assistantMessage}

Return mood (one word), currentTone (one of: ${CURRENT_TONES.join(", ")}), small deltas, and a short summary (max 280 chars).
No moralizing. Be subtle. Do not invent dramatic swings.`,
    });

    if (!output) return;

    const data = {
      mood: output.mood.slice(0, 40),
      trust: clamp01(current.trust + output.trustDelta),
      affection: clamp01(current.affection + output.affectionDelta),
      energy: clamp01(current.energy + output.energyDelta),
      familiarity: clamp01(current.familiarity + output.familiarityDelta),
      openness: clamp01(current.openness + output.opennessDelta),
      playfulness: clamp01(current.playfulness + output.playfulnessDelta),
      currentTone: parseCurrentTone(output.currentTone),
      summary: output.summary ?? current.summary,
      version: { increment: 1 },
    };

    await prisma.relationshipState.updateMany({
      where: {
        subjectId: params.subjectId,
        characterId: params.characterId,
        version: current.version,
      },
      data,
    });
  } catch (error) {
    console.error("[relationship-update]", error);
  }
}
