import { HARD_SAFETY_RULES } from "@/lib/ai/safety";
import { HUMAN_LIKE_STYLE_RULES } from "@/lib/ai/human-like";
import type { RelationshipSnapshot } from "@/lib/persona/schema";
import type { IdentitySheet } from "@/lib/identity/schema";
import { PHASE_GUIDE, relationshipPhase } from "@/lib/persona/phases";

const BUDGET = {
  soul: 900,
  style: 700,
  rules: 500,
  context: 400,
  relationship: 320,
  partner: 220,
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

export type PartnerContext = {
  displayName: string;
  howToAddress?: string | null;
  userId: string;
};

/**
 * Ensambla el system prompt como Meuxe: capas con presupuesto + partner + fase.
 */
export function assemblePersonaPrompt(params: {
  persona: PersonaBundle;
  relationship?: RelationshipSnapshot | null;
  memoryBrief: string[];
  summary?: string | null;
  partner?: PartnerContext | null;
}): string {
  const { persona, relationship, memoryBrief, summary, partner } = params;
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

  const trust = relationship?.trust ?? 0.35;
  const affection = relationship?.affection ?? 0.3;
  const phase = relationshipPhase(trust, affection);

  const callName =
    partner?.howToAddress?.trim() ||
    partner?.displayName?.trim() ||
    null;

  const partnerMd = partner
    ? [
        `# Who you are talking to (ALWAYS)`,
        `Esta conversación es SIEMPRE con la misma persona: ${partner.displayName}.`,
        callName
          ? `Trátala/o por: "${callName}" (usa el nombre de forma natural, no en cada frase).`
          : "Todavía no tienes un nombre preferido; puedes preguntarlo una vez con naturalidad.",
        `user_id interno: ${partner.userId} (no lo menciones; solo identidad estable).`,
        "No inventes que hablas con otra gente. No 'reinicies' como si fueran desconocidos si la fase ya avanzó.",
      ].join("\n")
    : `# Who you are talking to\nUna sola persona fija en esta cuenta. No cambies de interlocutor.`;

  const relationshipMd = [
    `# Relationship state`,
    `Phase: ${phase}`,
    PHASE_GUIDE[phase],
    relationship
      ? [
          `Mood: ${relationship.mood}`,
          `Trust: ${relationship.trust.toFixed(2)}`,
          `Affection: ${relationship.affection.toFixed(2)}`,
          `Energy: ${relationship.energy.toFixed(2)}`,
          relationship.summary ? `Summary: ${relationship.summary}` : "",
        ]
          .filter(Boolean)
          .join("\n")
      : "Mood: neutral · Trust: 0.35 · Affection: 0.30 · Energy: 0.70",
  ].join("\n");

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
    clip(partnerMd, BUDGET.partner),
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
    `- Respeta la FASE de relación; no saltes a 'mi vida' en strangers ni finjas amnesia en bonded.`,
    callName ? `- Puedes llamarle "${callName}" de vez en cuando.` : "",
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
  const phase = relationshipPhase(state.trust, state.affection);
  return [
    `# Relationship — ${name}`,
    "",
    `- Phase: ${phase}`,
    `- Mood: ${state.mood}`,
    `- Trust: ${state.trust.toFixed(2)}`,
    `- Affection: ${state.affection.toFixed(2)}`,
    `- Energy: ${state.energy.toFixed(2)}`,
    "",
    state.summary ?? "_Sin resumen aún._",
  ].join("\n");
}
