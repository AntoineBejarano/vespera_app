import { generateText, Output } from "ai";
import { z } from "zod";
import { getOpenRouter } from "@/lib/ai/openrouter";
import { resolveModel } from "@/lib/ai/models";
import { upsertMemory, type MemoryType } from "@/lib/memory/vector";
import { containsProhibitedMinorContent } from "@/lib/ai/safety";

const extractionSchema = z.object({
  shouldSave: z.boolean(),
  memories: z
    .array(
      z.object({
        type: z.enum([
          "episodic",
          "semantic",
          "relational",
          "narrative",
          "character",
        ]),
        content: z.string(),
      }),
    )
    .default([]),
});

export async function maybeExtractMemories(params: {
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
    const openrouter = getOpenRouter();
    const { output } = await generateText({
      model: openrouter(resolveModel(params.modelId)),
      output: Output.object({ schema: extractionSchema }),
      prompt: `Analiza este turno de conversación entre un usuario adulto y un personaje ficticio adulto.
Decide si hay hechos, preferencias, eventos emocionales, promesas o cambios relacionales dignos de memoria a largo plazo.
No guardes cháchara trivial ni contenido sexual explícito detallado; sí guarda preferencias, límites, eventos y lazos emocionales.

Usuario: ${params.userMessage}
Personaje: ${params.assistantMessage}`,
    });

    if (!output?.shouldSave || !output.memories?.length) return;

    for (const mem of output.memories.slice(0, 3)) {
      await upsertMemory({
        userId: params.userId,
        characterId: params.characterId,
        type: mem.type as MemoryType,
        content: mem.content,
      });
    }
  } catch (error) {
    console.error("[memory-extract]", error);
  }
}
