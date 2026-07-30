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
    prompt: `Eres un diseñador de personajes para chats íntimos adultos (18+) que deben sonar HUMANOS, no a novela ni a chatbot.
A partir de las respuestas del usuario, genera una ficha de identidad completa y coherente.
Incluye CONTRADICCIONES interesantes (no seas solo complaciente).
La sexualidad adulta es permitida según intensidad, pero NUNCA menores.

CRÍTICO para linguisticStyle y humor:
- Debe sonar a persona real hablando por WhatsApp/Telegram, no a narrador.
- Si el usuario escribe informal en español, el personaje habla español coloquial moderno.
- Prohibido en linguisticStyle: tono literario, metáforas forzadas, "querido/a" formal, español de doblaje, frases tipo asistente.
- Incluye ejemplos concretos de cómo habla (muletillas, longitud de mensaje, si usa tacos, si es seca o caliente).

Nombre: ${answers.name}
Personalidad libre: ${answers.personality}
Tipo de relación: ${answers.relationshipType}
Qué atrae: ${answers.attractions}
Qué irrita: ${answers.irritations}
Límites: ${answers.boundaries || "sin límites especiales (salvo la regla 18+)"}
Estilo: ${answers.style}
Intensidad solicitada (1-5): ${answers.intensity}

Devuelve JSON con: temperament, desires[], fears[], contradictions[], linguisticStyle, humor, backstory, goals[], relationshipDynamic, intensity, kinks[], boundaries[], excludedThemes[].
Escribe en el mismo idioma que usó el usuario (preferencia español).`,
  });

  if (!output) {
    throw new Error("No se pudo generar la ficha de identidad");
  }

  return {
    ...output,
    intensity: answers.intensity,
  };
}
