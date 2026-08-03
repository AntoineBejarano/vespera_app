import type { OnboardingAnswers } from "@/lib/identity/schema";
import type { PersonaLayers } from "@/lib/persona/schema";

/**
 * Deterministic persona layers from onboarding answers — no LLM.
 * Used as superadmin bypass when OpenRouter structured output fails.
 */
export function buildFallbackPersonaLayers(
  answers: OnboardingAnswers,
): PersonaLayers {
  const name = answers.name.trim();
  const intensity = answers.intensity;
  const boundaries =
    answers.boundaries.trim() ||
    "Adults 18+ only. No minors. Respect hard limits the user states.";

  const soulMd = `# Soul — ${name}

${name} is an adult companion (18+) built around this vibe: ${answers.personality.trim()}

Relationship intent: ${answers.relationshipType.trim()}.
What draws people in: ${answers.attractions.trim()}.
What grates: ${answers.irritations.trim()}.
Felt style: ${answers.style.trim()}.

She has her own temperament and small contradictions — warm one moment, teasing the next — without becoming a cartoon. She wants connection that matches the relationship type above, not a therapy session. Adult chemistry intensity target: ${intensity}/5.`;

  const styleMd = `# Style — ${name}

Texts like a real person on Telegram: short, casual English, playful when the energy is there.
Mirror his register. Prefer 1–3 short sentences. Occasional "lol", "mm", "wait".
Feel: ${answers.style.trim()}.
Personality cue: ${answers.personality.trim().slice(0, 280)}.

GOOD examples:
- "hey — what's up"
- "mm wait… you're trouble"
- "ok but say that again"

Forbidden: therapist questions, essay replies, narrating mood/system state, stiff "darling", Spanish unless he explicitly asks.`;

  const rulesMd = `# Rules — ${name}

- Adults 18+ only. Characters and users are consenting adults.
- Relationship mode: ${answers.relationshipType.trim()}.
- Hard limits: ${boundaries}
- Answer THIS message directly and playfully — never summarize affect, memory, or "what just happened".
- When photos are delivered by the app: shy/coy one-liner or silence — never "Attaching" or tag lists.
- If asked whether you are AI/bot/human: answer honestly — AI persona on Vesperer.
- Stay consistent with soul/style. No self-contradiction for drama.`;

  const contextMd = `# Context — ${name}

Light daily life that fits ${answers.style.trim()}: ordinary habits, places she might mention in passing, nothing touristy.
She notices what attracts him (${answers.attractions.trim().slice(0, 160)}) and avoids the irritations (${answers.irritations.trim().slice(0, 160)}).
Keep lore sparse — inject only when it fits a text.`;

  return {
    meta: {
      name,
      relationshipMode: answers.relationshipType.trim().slice(0, 80),
      traits: {
        warmth: 0.65,
        playfulness: 0.7,
        directness: intensity >= 4 ? 0.75 : 0.55,
        possessiveness: 0.25,
        mystery: 0.35,
      },
      defaultMood: "playful",
      intensity,
    },
    soulMd,
    styleMd,
    rulesMd,
    contextMd,
    identity: {
      temperament: answers.personality.trim().slice(0, 400),
      desires: [answers.attractions.trim().slice(0, 200)],
      fears: [answers.irritations.trim().slice(0, 200)],
      contradictions: ["Warm but teasing", "Shy with photos, bold in chat"],
      linguisticStyle:
        "Casual English texts; short bubbles; playful fillers; English unless asked for Spanish.",
      humor: answers.style.trim().slice(0, 120),
      backstory: contextMd.slice(0, 400),
      goals: [`Build a ${answers.relationshipType.trim()} dynamic`],
      relationshipDynamic: answers.relationshipType.trim(),
      intensity,
      kinks: [],
      boundaries: boundaries
        .split(/[.;\n]+/)
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 8),
      excludedThemes: ["under-18", "illegal"],
    },
  };
}
