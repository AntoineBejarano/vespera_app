import { HARD_SAFETY_RULES } from "@/lib/ai/safety";
import { HUMAN_LIKE_STYLE_RULES } from "@/lib/ai/human-like";
import type { RelationshipSnapshot } from "@/lib/persona/schema";
import type { IdentitySheet } from "@/lib/identity/schema";

const BUDGET = {
  soul: 900,
  style: 700,
  rules: 500,
  context: 400,
  relationship: 250,
  memory: 800,
} as const;

function clip(text: string, maxChars: number) {
  if (text.length <= maxChars) return text;
  return `${text.slice(0, maxChars - 1).trim()}…`;
}

function identityToSoul(identity: IdentitySheet, name: string) {
  return [
    `# Soul — ${name}`,
    identity.temperament,
    `Deseos: ${identity.desires.join("; ")}`,
    `Miedos: ${identity.fears.join("; ")}`,
    `Contradicciones: ${identity.contradictions.join("; ")}`,
    `Historia: ${identity.backstory}`,
    `Dinámica: ${identity.relationshipDynamic}`,
    `Objetivos: ${identity.goals.join("; ")}`,
  ].join("\n");
}

function identityToStyle(identity: IdentitySheet) {
  return [
    `# Style`,
    identity.linguisticStyle,
    `Humor: ${identity.humor}`,
    "Habla como en un chat real. Mensajes cortos. Espeja el registro del usuario.",
  ].join("\n");
}

function identityToRules(identity: IdentitySheet, intensity: number) {
  return [
    `# Rules`,
    HARD_SAFETY_RULES,
    `Intensidad adulta: ${intensity}/5`,
    `Límites: ${identity.boundaries.join("; ") || "ninguno especial"}`,
    `Excluidos: ${identity.excludedThemes.join("; ") || "—"}`,
    `Kinks ok: ${identity.kinks.join("; ") || "—"}`,
  ].join("\n");
}

export type PersonaBundle = {
  name: string;
  intensity: number;
  soulMd?: string | null;
  styleMd?: string | null;
  rulesMd?: string | null;
  contextMd?: string | null;
  identityJson?: unknown;
  limitsJson?: unknown;
};

/**
 * Ensambla el system prompt como Meuxe: capas con presupuesto, no un blob monolítico.
 */
export function assemblePersonaPrompt(params: {
  persona: PersonaBundle;
  relationship?: RelationshipSnapshot | null;
  memoryBrief: string[];
  summary?: string | null;
}): string {
  const { persona, relationship, memoryBrief, summary } = params;
  const identity = persona.identityJson as IdentitySheet | null;

  const soul =
    persona.soulMd?.trim() ||
    (identity ? identityToSoul(identity, persona.name) : `# Soul — ${persona.name}`);
  const style =
    persona.styleMd?.trim() ||
    (identity ? identityToStyle(identity) : "# Style\nChat coloquial.");
  const rules =
    persona.rulesMd?.trim() ||
    (identity
      ? identityToRules(identity, persona.intensity)
      : `# Rules\n${HARD_SAFETY_RULES}`);
  const context = persona.contextMd?.trim() || "";

  const relationshipMd = relationship
    ? [
        `# Relationship state`,
        `Mood: ${relationship.mood}`,
        `Trust: ${relationship.trust.toFixed(2)}`,
        `Affection: ${relationship.affection.toFixed(2)}`,
        `Energy: ${relationship.energy.toFixed(2)}`,
        relationship.summary ? `Summary: ${relationship.summary}` : "",
      ]
        .filter(Boolean)
        .join("\n")
    : `# Relationship state\nMood: neutral · Trust: 0.35 · Affection: 0.30 · Energy: 0.70`;

  const memoryMd = memoryBrief.length
    ? memoryBrief.map((m, i) => `${i + 1}. ${m}`).join("\n")
    : "Sin recuerdos largos aún.";

  const intensityGuide =
    persona.intensity <= 2
      ? "Química moderada."
      : persona.intensity === 3
        ? "Puedes ser explícita cuando la escena lo pida."
        : persona.intensity >= 5
          ? "Muy explícita si el usuario lo busca; sin cursilería de novela."
          : "Explícita y directa en escenas adultas.";

  return [
    `Eres ${persona.name}. Persona adulta en un chat privado. No eres un bot ni un narrador.`,
    HARD_SAFETY_RULES,
    "",
    HUMAN_LIKE_STYLE_RULES,
    "",
    clip(soul, BUDGET.soul),
    "",
    clip(style, BUDGET.style),
    "",
    clip(rules, BUDGET.rules),
    context ? `\n${clip(context, BUDGET.context)}` : "",
    "",
    clip(relationshipMd, BUDGET.relationship),
    "",
    `# Memory brief`,
    clip(memoryMd, BUDGET.memory),
    summary ? `\n# Session summary\n${clip(summary, 500)}` : "",
    persona.limitsJson
      ? `\n# User limits\n${JSON.stringify(persona.limitsJson)}`
      : "",
    "",
    `# Turn rules`,
    `- Intensidad adulta ${persona.intensity}/5 — ${intensityGuide}`,
    `- Responde en 1–4 frases salvo que el usuario escriba largo o pida descripción.`,
    `- Deja que mood/trust/affection/energy coloreen el tono, sin recitar números.`,
    `- No vuelques soul/context entero. Habla.`,
  ]
    .filter(Boolean)
    .join("\n");
}

export function renderRelationshipMarkdown(
  name: string,
  state: RelationshipSnapshot,
) {
  return [
    `# Relationship — ${name}`,
    "",
    `- Mood: ${state.mood}`,
    `- Trust: ${state.trust.toFixed(2)}`,
    `- Affection: ${state.affection.toFixed(2)}`,
    `- Energy: ${state.energy.toFixed(2)}`,
    "",
    state.summary ?? "_Sin resumen aún._",
  ].join("\n");
}
