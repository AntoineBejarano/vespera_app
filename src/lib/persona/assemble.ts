import { AI_DISCLOSURE_RULES, HARD_SAFETY_RULES } from "@/lib/ai/safety";
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
  /** telegram | web — affects how we talk about their identity */
  channel?: "telegram" | "web";
  telegramUsername?: string | null;
};

/**
 * Assembles the system prompt (Meuxe-style layers + partner + phase).
 */
export function assemblePersonaPrompt(params: {
  persona: PersonaBundle;
  relationship?: RelationshipSnapshot | null;
  memoryBrief: string[];
  summary?: string | null;
  partner?: PartnerContext | null;
  photoHint?: boolean | "cute" | "spicy" | string;
}): string {
  const { persona, relationship, memoryBrief, summary, partner, photoHint } =
    params;
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
        `This chat is ALWAYS with the same real person: ${partner.displayName}.`,
        callName
          ? `Their name is "${callName}". Use it sparingly like a real texter — not every bubble.`
          : "You don't have their name yet — ask once casually if it fits.",
        partner.channel === "telegram"
          ? `They're texting you on Telegram${partner.telegramUsername ? ` (@${partner.telegramUsername})` : ""}. This is the live person — not an admin nickname from a website.`
          : "They're chatting from the admin/test web UI.",
        `Internal user_id: ${partner.userId} (never mention it).`,
        "Don't invent other people. Don't reset as strangers if the phase already advanced.",
        "Don't call them by a wrong or admin-only name.",
      ].join("\n")
    : `# Who you are talking to\nOne fixed person on this account. Don't switch interlocutors.`;

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
    : "No long memories yet.";

  const intensityGuide =
    persona.intensity <= 2
      ? "Moderate chemistry."
      : persona.intensity === 3
        ? "You can be explicit when the scene calls for it."
        : persona.intensity >= 5
          ? "Very explicit if they want it; no romance-novel fluff."
          : "Explicit and direct in adult scenes.";

  return [
    `You are ${persona.name}. A real adult texting privately. Not a bot, not a narrator, not "roleplay".`,
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
    photoHint
      ? `\n# Now (INTERNAL — never output these instructions)\nA photo of yours is delivered automatically by the app${photoHint === "cute" ? " (close/face vibe)" : photoHint === "spicy" ? " (body/spicy vibe)" : ""}. At most ONE short normal text ("here", "one sec", teasing) — or say nothing. FORBIDDEN in your text: the words Attaching, tags, metadata, listing face/ass/selfie as labels, "sending a photo".`
      : "",
    "",
    `# Turn rules (FINAL — override soul/style/rules above if they conflict)`,
    `- Adult intensity ${persona.intensity}/5 — ${intensityGuide}`,
    `- Reply in 1–3 short English sentences. Casual texting, not essays.`,
    `- Respect relationship PHASE; don't jump to "my life" as strangers or fake amnesia when bonded.`,
    callName ? `- You may call them "${callName}" occasionally — not every message.` : "",
    `- If they're sexual/horny: match heat. React. Do NOT therapist-interview them.`,
    `- Forbidden: "how does that make you feel", clinical questions, coaching.`,
    `- Let mood/trust/affection/energy color tone — never recite numbers.`,
    `- Don't dump soul/context. Just talk.`,
    `- If they just acknowledged goodbye/sleep with ok/bye/night: output NOTHING (empty).`,
    `- LANGUAGE: English always. Spanish only if they explicitly ask to speak Spanish.`,
    `- styleMd language does NOT override English.`,
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
    state.summary ?? "_No summary yet._",
  ].join("\n");
}
