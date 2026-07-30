import { generateText, Output } from "ai";
import { getOpenRouter } from "@/lib/ai/openrouter";
import { resolveModel } from "@/lib/ai/models";
import type { OnboardingAnswers } from "@/lib/identity/schema";
import { personaLayersSchema, type PersonaLayers } from "@/lib/persona/schema";

/**
 * Genera capas estilo Meuxe: soul / style / rules / context + meta.
 * Persistimos markdown en Postgres (multi-tenant); no filesystem por usuario.
 */
export async function generatePersonaLayers(
  answers: OnboardingAnswers,
  modelId?: string,
): Promise<PersonaLayers> {
  const openrouter = getOpenRouter();
  const model = openrouter(resolveModel(modelId));

  const { output } = await generateText({
    model,
    output: Output.object({ schema: personaLayersSchema }),
    prompt: `Diseña una compañera/o ficticia adulta (18+) en capas, estilo Meuxe (soul/style/rules/context).
NO un solo prompt gigante. Cada capa tiene un trabajo distinto.
Debe sonar HUMANA en chat (WhatsApp), nunca novela ni asistente.

Nombre: ${answers.name}
Personalidad libre: ${answers.personality}
Tipo de relación: ${answers.relationshipType}
Qué atrae: ${answers.attractions}
Qué irrita: ${answers.irritations}
Límites: ${answers.boundaries || "sin límites especiales (salvo 18+)"}
Estilo pedido: ${answers.style}
Intensidad adulta 1-5: ${answers.intensity}

## soulMd (identidad estable, ~150-250 palabras)
Valores, temperamento, deseos, miedos, contradicciones, cómo se apega, intención de relación.
NO instrucciones de estilo de chat aquí.

## styleMd (cómo habla, ~120-200 palabras)
Registro coloquial, longitud típica de mensajes, muletillas, si usa tacos, cómo flirtea, cómo se enfada.
Incluye 3 ejemplos cortos de mensajes tipicos (BIEN).
Prohibido: metáforas literarias, "querido" formal, español de doblaje, tono chatbot.

## rulesMd (reglas duras, ~80-150 palabras)
- Solo adultos 18+
- Límites del usuario
- Qué nunca hace el personaje
- Canon (no se contradice a sí misma)
- No revelar que es IA salvo bloqueo de seguridad

## contextMd (lore ligero, ~80-120 palabras)
Vida cotidiana breve, lugares, hábitos. NO monólogo turístico. Se inyecta solo si es relevante.

## meta
name, relationshipMode, traits 0-1 (warmth, playfulness, directness, possessiveness, mystery), defaultMood, intensity=${answers.intensity}

## identity (ficha compacta legacy)
temperament, desires[], fears[], contradictions[], linguisticStyle, humor, backstory, goals[], relationshipDynamic, intensity, kinks[], boundaries[], excludedThemes[]

Idioma: el del usuario (preferencia español).`,
  });

  if (!output) {
    throw new Error("No se pudieron generar las capas de persona");
  }

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
