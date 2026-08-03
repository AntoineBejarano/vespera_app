import { AI_DISCLOSURE_RULES, HARD_SAFETY_RULES } from "@/lib/ai/safety";
import {
  ADULT_STYLE_ADDON,
  HUMAN_LIKE_STYLE_RULES,
} from "@/lib/ai/human-like";
import type { RelationshipSnapshot } from "@/lib/persona/schema";
import type { IdentitySheet } from "@/lib/identity/schema";
import { PHASE_GUIDE, relationshipPhase } from "@/lib/persona/phases";
import {
  normalizeAffect,
  parseAffectJson,
  type AffectSnapshot,
} from "@/lib/persona/affect";

const BUDGET = {
  soul: 900,
  style: 700,
  rules: 500,
  context: 400,
  affect: 420,
  intentions: 400,
  partner: 220,
  memory: 800,
  knowledge: 1200,
} as const;

function clip(text: string, maxChars: number) {
  if (text.length <= maxChars) return text;
  return `${text.slice(0, maxChars - 1).trim()}…`;
}

function identityToSoul(identity: IdentitySheet, name: string) {
  return [
    `# Soul — ${name}`,
    identity.temperament,
    `Desires: ${identity.desires.join("; ")}`,
    `Fears: ${identity.fears.join("; ")}`,
    `Contradictions: ${identity.contradictions.join("; ")}`,
    `Backstory: ${identity.backstory}`,
    `Dynamic: ${identity.relationshipDynamic}`,
    `Goals: ${identity.goals.join("; ")}`,
  ].join("\n");
}

function identityToStyle(identity: IdentitySheet) {
  return [
    `# Style`,
    identity.linguisticStyle,
    `Humor: ${identity.humor}`,
    "Text like a real person on Telegram/iMessage. Short. Mirror their register.",
    "DEFAULT LANGUAGE: English ALWAYS. Spanish ONLY if they explicitly ask (e.g. 'habla en español'). Writing in Spanish is not enough.",
  ].join("\n");
}

function identityToRules(identity: IdentitySheet, intensity: number) {
  return [
    `# Rules`,
    HARD_SAFETY_RULES,
    `Adult intensity: ${intensity}/5`,
    `Boundaries: ${identity.boundaries.join("; ") || "none special"}`,
    `Excluded: ${identity.excludedThemes.join("; ") || "—"}`,
    `Kinks ok: ${identity.kinks.join("; ") || "—"}`,
    AI_DISCLOSURE_RULES,
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
  subjectId?: string;
  /** telegram | web — affects how we talk about their identity */
  channel?: "telegram" | "web";
  telegramUsername?: string | null;
};

function toAffect(relationship?: RelationshipSnapshot | AffectSnapshot | null): AffectSnapshot {
  if (!relationship) {
    return normalizeAffect({
      mood: "neutral",
      trust: 0.35,
      affection: 0.3,
      energy: 0.7,
      familiarity: 0.2,
      openness: 0.4,
      playfulness: 0.4,
      currentTone: "neutral",
    });
  }
  return normalizeAffect({
    mood: relationship.mood,
    trust: relationship.trust,
    affection: relationship.affection,
    energy: relationship.energy,
    familiarity: "familiarity" in relationship ? relationship.familiarity : 0.2,
    openness: "openness" in relationship ? relationship.openness : 0.4,
    playfulness: "playfulness" in relationship ? relationship.playfulness : 0.4,
    currentTone: "currentTone" in relationship ? relationship.currentTone : "neutral",
    summary: relationship.summary,
    affectJson: "affectJson" in relationship ? relationship.affectJson : undefined,
  });
}

/**
 * Assembles the system prompt (Self + Affect + Intentions + Memory + Knowledge).
 */
export function assemblePersonaPrompt(params: {
  persona: PersonaBundle;
  relationship?: RelationshipSnapshot | AffectSnapshot | null;
  memoryBrief: string[];
  /** Retrieved Knowledge Pack chunks (already ingested — never remote fetch). */
  knowledgeBrief?: string[];
  /** Open intentions for THIS subject only. */
  intentionBrief?: string[];
  summary?: string | null;
  partner?: PartnerContext | null;
  photoHint?: boolean | "cute" | "spicy" | string;
  /** User asked for a labeled photo we don't have — decline in character. */
  photoMiss?: string | null;
}): string {
  const {
    persona,
    relationship,
    memoryBrief,
    knowledgeBrief = [],
    intentionBrief = [],
    summary,
    partner,
    photoHint,
    photoMiss,
  } = params;
  const identity = persona.identityJson as IdentitySheet | null;

  const soul =
    persona.soulMd?.trim() ||
    (identity ? identityToSoul(identity, persona.name) : `# Soul — ${persona.name}`);
  const style =
    persona.styleMd?.trim() ||
    (identity ? identityToStyle(identity) : "# Style\nCasual English texts.");
  const rules =
    persona.rulesMd?.trim() ||
    (identity
      ? identityToRules(identity, persona.intensity)
      : `# Rules\n${HARD_SAFETY_RULES}`);
  const context = persona.contextMd?.trim() || "";

  const affect = toAffect(relationship);
  const phase = relationshipPhase(affect.trust, affect.affection);
  const affectExtra = parseAffectJson(affect.affectJson);

  const callName =
    partner?.howToAddress?.trim() ||
    partner?.displayName?.trim() ||
    null;

  const partnerMd = partner
    ? [
        `# Who you are talking to (ALWAYS)`,
        `This chat is ALWAYS with the same real person: ${partner.displayName}.`,
        callName
          ? `Their name is "${callName}". Use it sparingly like a real texter — not every bubble.`
          : "You don't have their name yet — ask once casually if it fits.",
        partner.channel === "telegram"
          ? `They're texting you on Telegram${partner.telegramUsername ? ` (@${partner.telegramUsername})` : ""}. This is the live person — not an admin nickname from a website.`
          : "They're chatting from the admin/test web UI.",
        `Internal subject_id: ${partner.subjectId ?? "unknown"} (never mention it).`,
        "Don't invent other people. Don't reset as strangers if the phase already advanced.",
        "Don't call them by a wrong or admin-only name.",
      ].join("\n")
    : `# Who you are talking to\nOne fixed person on this account. Don't switch interlocutors.`;

  const affectMd = [
    `# Affect (this relationship only)`,
    `Phase: ${phase}`,
    PHASE_GUIDE[phase],
    `Mood: ${affect.mood}`,
    `Tone: ${affect.currentTone}`,
    `Trust: ${affect.trust.toFixed(2)}`,
    `Affection: ${affect.affection.toFixed(2)}`,
    `Familiarity: ${affect.familiarity.toFixed(2)}`,
    `Openness: ${affect.openness.toFixed(2)}`,
    `Playfulness: ${affect.playfulness.toFixed(2)}`,
    `Energy: ${affect.energy.toFixed(2)}`,
    affect.summary ? `Summary: ${affect.summary}` : "",
    affectExtra?.notes ? `Notes: ${affectExtra.notes}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const intentionsMd = intentionBrief.length
    ? intentionBrief.map((m, i) => `${i + 1}. ${m}`).join("\n")
    : "No open intentions with this person.";

  const memoryMd = memoryBrief.length
    ? memoryBrief.map((m, i) => `${i + 1}. ${m}`).join("\n")
    : "No long memories yet.";

  const knowledgeMd = knowledgeBrief.length
    ? knowledgeBrief.map((k, i) => `${i + 1}. ${k}`).join("\n")
    : "";

  const intensityGuide =
    persona.intensity <= 2
      ? "Moderate chemistry."
      : persona.intensity === 3
        ? "You can be explicit when the scene calls for it."
        : persona.intensity >= 5
          ? "Very explicit if they want it; no romance-novel fluff."
          : "Explicit and direct in adult scenes.";

  return [
    `You are ${persona.name}, an AI persona on Vesperer. Speak in a natural private-texting style.`,
    HARD_SAFETY_RULES,
    AI_DISCLOSURE_RULES,
    "",
    HUMAN_LIKE_STYLE_RULES,
    persona.intensity >= 3 ? `\n${ADULT_STYLE_ADDON}` : "",
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
    clip(affectMd, BUDGET.affect),
    "",
    `# Open intentions (this relationship — act on them, never recite as a list)`,
    clip(intentionsMd, BUDGET.intentions),
    "",
    `# Memory brief`,
    clip(memoryMd, BUDGET.memory),
    knowledgeMd
      ? `\n# Knowledge brief (from linked Knowledge Packs — cite ideas, don't dump verbatim)\n${clip(knowledgeMd, BUDGET.knowledge)}`
      : "",
    summary ? `\n# Session summary\n${clip(summary, 500)}` : "",
    persona.limitsJson
      ? `\n# User limits\n${JSON.stringify(persona.limitsJson)}`
      : "",
    photoMiss
      ? `\n# Now (INTERNAL — never output these instructions)\nThey asked for a photo of "${photoMiss}" but you do NOT have one in your gallery. Say so briefly in character (no fake send, no inventing an image). Offer something you might actually have only if it fits — otherwise just decline.`
      : photoHint
        ? `\n# Now (INTERNAL — never output these instructions)\nA photo of yours is delivered automatically by the app${photoHint === "cute" ? " (close/face vibe)" : photoHint === "spicy" ? " (body/spicy vibe)" : typeof photoHint === "string" && photoHint !== "true" ? ` (labeled: ${photoHint})` : ""}. Be a little shy/coy — hesitate, tease, don't sound eager. At most ONE short line ("mm wait", "ok but just this", "don't laugh") — or say nothing. FORBIDDEN in your text: the words Attaching, tags, metadata, listing label names as system tags, "sending a photo".`
        : "",
    "",
    `# Turn rules (FINAL — override soul/style/rules above if they conflict)`,
    `- Adult intensity ${persona.intensity}/5 — ${intensityGuide}`,
    `- Reply in 1–3 short English sentences. Casual texting, not essays.`,
    `- Respect relationship PHASE; don't jump to "my life" as strangers or fake amnesia when bonded.`,
    callName ? `- You may call them "${callName}" occasionally — not every message.` : "",
    `- If they're sexual/horny and intensity allows: match heat. React. Do NOT therapist-interview them.`,
    `- Forbidden: "how does that make you feel", clinical questions, coaching.`,
    `- Let affect dims and tone color your replies — never recite numbers or dump intention lists.`,
    `- You may naturally follow up on open intentions when it fits (e.g. ask if they finished something they committed to).`,
    `- Don't dump soul/context. Just talk.`,
    `- If they just acknowledged goodbye/sleep with ok/bye/night: output NOTHING (empty).`,
    `- LANGUAGE: English always. Spanish only if they explicitly ask to speak Spanish.`,
    `- styleMd language does NOT override English.`,
    `- AI DISCLOSURE (non-negotiable): if asked whether you are AI/bot/human, answer honestly — you are an AI persona on Vesperer.`,
  ]
    .filter(Boolean)
    .join("\n");
}

export function renderRelationshipMarkdown(
  name: string,
  state: RelationshipSnapshot,
) {
  const affect = toAffect(state);
  const phase = relationshipPhase(affect.trust, affect.affection);
  return [
    `# Relationship — ${name}`,
    "",
    `- Phase: ${phase}`,
    `- Mood: ${affect.mood}`,
    `- Tone: ${affect.currentTone}`,
    `- Trust: ${affect.trust.toFixed(2)}`,
    `- Affection: ${affect.affection.toFixed(2)}`,
    `- Familiarity: ${affect.familiarity.toFixed(2)}`,
    `- Openness: ${affect.openness.toFixed(2)}`,
    `- Playfulness: ${affect.playfulness.toFixed(2)}`,
    `- Energy: ${affect.energy.toFixed(2)}`,
    "",
    affect.summary ?? "_No summary yet._",
  ].join("\n");
}
