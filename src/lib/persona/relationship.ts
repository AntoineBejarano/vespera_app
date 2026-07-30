import { generateText, Output } from "ai";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getOpenRouter } from "@/lib/ai/openrouter";
import { resolveModel } from "@/lib/ai/models";
import { containsProhibitedMinorContent } from "@/lib/ai/safety";

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
    where: { characterId },
    create: {
      userId,
      characterId,
      mood: "curious",
      trust: 0.35,
      affection: 0.3,
      energy: 0.7,
      summary: "Empiezan a conocerse.",
    },
    update: {},
  });
}

/**
 * Ajusta mood/trust/affection/energy tras un turno (capa State de Meuxe).
 */
export async function maybeUpdateRelationship(params: {
  userId: string;
  characterId: string;
  userMessage: string;
  assistantMessage: string;
  modelId?: string;
}) {
  if (
    containsProhibitedMinorContent(params.userMessage) ||
    containsProhibitedMinorContent(params.assistantMessage)
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
      prompt: `Actualiza el estado relacional de un compañero ficticio adulto tras un turno de chat.
Estado actual: mood=${current.mood}, trust=${current.trust}, affection=${current.affection}, energy=${current.energy}, summary=${current.summary ?? ""}

Usuario: ${params.userMessage}
Personaje: ${params.assistantMessage}

Devuelve mood (palabra), deltas pequeños (-0.08..0.08), y summary corto (máx 280 chars) del vínculo ahora.
No moralices. Sé sutil.`,
    });

    if (!output) return;

    await prisma.relationshipState.update({
      where: { characterId: params.characterId },
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
