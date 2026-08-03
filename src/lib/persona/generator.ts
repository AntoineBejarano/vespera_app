import { generateText, Output, NoOutputGeneratedError } from "ai";
import { getOpenRouter } from "@/lib/ai/openrouter";
import { resolveModel } from "@/lib/ai/models";
import type { OnboardingAnswers } from "@/lib/identity/schema";
import { personaLayersSchema, type PersonaLayers } from "@/lib/persona/schema";
import { buildFallbackPersonaLayers } from "@/lib/persona/fallback-layers";

export type GeneratePersonaLayersOptions = {
  /**
   * When true (superadmin only), skip the LLM and build layers from answers.
   * Temporary operator bypass while structured output is unreliable on some models.
   */
  bypassLlm?: boolean;
  /** If LLM fails, fall back to the deterministic template. */
  allowTemplateFallback?: boolean;
};

/**
 * Genera capas estilo Meuxe: soul / style / rules / context + meta.
 * Persistimos markdown en Postgres (multi-tenant); no filesystem por usuario.
 */
export async function generatePersonaLayers(
  answers: OnboardingAnswers,
  modelId?: string,
  options?: GeneratePersonaLayersOptions,
): Promise<PersonaLayers> {
  if (options?.bypassLlm) {
    console.warn(
      "[persona_generate] bypassLlm — using template layers for",
      answers.name,
    );
    return finalizeLayers(buildFallbackPersonaLayers(answers), answers);
  }

  try {
    const openrouter = getOpenRouter();
    const model = openrouter(resolveModel(modelId));

    const { output } = await generateText({
      model,
      output: Output.object({ schema: personaLayersSchema }),
      prompt: `Design an adult companion persona (18+) in Meuxe-style layers (soul/style/rules/context).
NOT one giant prompt. Each layer has a job.
Must sound HUMAN on Telegram — never novel, never assistant.
IMPORTANT: The companion speaks ENGLISH always. Spanish ONLY if the user explicitly asks to switch.
If asked directly about being AI: answer honestly (AI companion on vesperer). Stay in character otherwise.

Name: ${answers.name}
Free personality: ${answers.personality}
Relationship type: ${answers.relationshipType}
What attracts: ${answers.attractions}
What irritates: ${answers.irritations}
Boundaries: ${answers.boundaries || "none special (except 18+)"}
Requested style: ${answers.style}
Adult intensity 1-5: ${answers.intensity}

## soulMd (stable identity, ~150-250 words, ENGLISH)
Values, temperament, desires, fears, contradictions, attachment style, relationship intent.
NO chat-style instructions here.

## styleMd (how they text, ~120-200 words, ENGLISH)
Casual register, typical message length, filler words, swearing, flirting, anger.
Include 3 short example texts (GOOD).
Forbidden: literary metaphors, stiff "darling", dubbed-movie Spanish, chatbot tone.
Note: always English unless user explicitly requests Spanish.

## rulesMd (hard rules, ~80-150 words)
- Adults 18+ only
- User boundaries
- What the persona never does
- Canon (no self-contradiction)
- Answer the latest message directly; never narrate mood/system state
- If asked about being AI: answer honestly (AI on Vesperer)

## contextMd (light lore, ~80-120 words)
Brief daily life, places, habits. NO tourist monologue.

## meta
name, relationshipMode, traits 0-1 (warmth, playfulness, directness, possessiveness, mystery), defaultMood, intensity=${answers.intensity}

## identity (legacy compact sheet)
temperament, desires[], fears[], contradictions[], linguisticStyle, humor, backstory, goals[], relationshipDynamic, intensity, kinks[], boundaries[], excludedThemes[]

Language of layers: ENGLISH by default.`,
    });

    if (!output) {
      throw new Error("No se pudieron generar las capas de persona");
    }

    return finalizeLayers(output, answers);
  } catch (error) {
    const detail =
      error instanceof Error
        ? `${error.message}${
            error.cause instanceof Error ? ` (${error.cause.message})` : ""
          }`
        : "Unknown error";
    console.error("[persona_generate] failed", {
      model: resolveModel(modelId),
      detail,
      noOutput: NoOutputGeneratedError.isInstance(error),
    });

    if (options?.allowTemplateFallback) {
      console.warn(
        "[persona_generate] template fallback after LLM failure for",
        answers.name,
      );
      return finalizeLayers(buildFallbackPersonaLayers(answers), answers);
    }

    throw error instanceof Error
      ? error
      : new Error("No se pudieron generar las capas de persona");
  }
}

function finalizeLayers(
  output: PersonaLayers,
  answers: OnboardingAnswers,
): PersonaLayers {
  return {
    ...output,
    meta: {
      ...output.meta,
      name: answers.name,
      intensity: answers.intensity,
    },
    identity: output.identity
      ? { ...output.identity, intensity: answers.intensity }
      : undefined,
  };
}
