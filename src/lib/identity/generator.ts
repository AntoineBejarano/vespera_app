import { generateText, Output } from "ai";
import { getOpenRouter } from "@/lib/ai/openrouter";
import { resolveModel } from "@/lib/ai/models";
import {
  identitySheetSchema,
  type IdentitySheet,
  type OnboardingAnswers,
} from "@/lib/identity/schema";

export async function generateIdentitySheet(
  answers: OnboardingAnswers,
  modelId?: string,
): Promise<IdentitySheet> {
  const openrouter = getOpenRouter();
  const model = openrouter(resolveModel(modelId));

  const { output } = await generateText({
    model,
    output: Output.object({ schema: identitySheetSchema }),
    prompt: `You design adult intimate chat personas (18+) that sound HUMAN — not novel, not chatbot.
From the user's answers, produce a coherent identity sheet.
Include interesting CONTRADICTIONS (not just people-pleasing).
Adult sexuality allowed by intensity; NEVER minors.

CRITICAL for linguisticStyle and humor:
- Sounds like a real person on Telegram/iMessage, not a narrator.
- DEFAULT language: modern casual ENGLISH always.
- Spanish ONLY if the user explicitly asks — note that in linguisticStyle.
- Forbidden: literary tone, forced metaphors, stiff "darling", dubbed-movie Spanish, assistant phrases.
- Include concrete speech examples (filler words, message length, swearing, dry vs flirty).

Name: ${answers.name}
Free personality: ${answers.personality}
Relationship type: ${answers.relationshipType}
What attracts: ${answers.attractions}
What irritates: ${answers.irritations}
Boundaries: ${answers.boundaries || "none special (except 18+)"}
Style: ${answers.style}
Requested intensity (1-5): ${answers.intensity}

Return JSON: temperament, desires[], fears[], contradictions[], linguisticStyle, humor, backstory, goals[], relationshipDynamic, intensity, kinks[], boundaries[], excludedThemes[].
Write the sheet content in ENGLISH by default (unless the user answered entirely in Spanish).`,
  });

  if (!output) {
    throw new Error("No se pudo generar la ficha de identidad");
  }

  return {
    ...output,
    intensity: answers.intensity,
  };
}
