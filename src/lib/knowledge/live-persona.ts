/**
 * Live Personas — product framing shared by marketing and product UI.
 *
 * A Live Persona follows approved sources and updates knowledge, public
 * positions and conversational context as new material appears — without
 * silently rewriting core identity.
 *
 * Living public figures must be framed as AI interpretations based on
 * public statements and verified sources — never as the real person,
 * an official account, or a source of private thoughts.
 */

export const LIVE_PERSONA_TAGLINE =
  "Connect a persona to the sources that define them. Vesperer keeps the persona current without erasing who they were.";

export const LIVE_PERSONA_DISCLOSURE =
  "AI interpretation based on publicly available sources. Not affiliated with, endorsed by or operated by the subject. Responses may include clearly marked fictional extrapolation.";

/** How a living / public-figure persona should be labelled in product UI. */
export function livePersonaLabel(subjectName: string): string {
  return `${subjectName} — an AI interpretation based on public statements and verified sources.`;
}

export const SOURCE_TIERS = [
  {
    tier: 1,
    name: "First-party",
    weight: "Highest",
    examples: [
      "Official website",
      "Verified social accounts",
      "Official speeches",
      "Books and articles by the person",
      "Institutional archives",
    ],
  },
  {
    tier: 2,
    name: "Direct interviews",
    weight: "High",
    examples: [
      "Television interviews",
      "Podcasts",
      "Conference appearances",
      "Full transcripts",
      "Recorded panels",
    ],
  },
  {
    tier: 3,
    name: "Reliable reporting",
    weight: "Context",
    examples: [
      "Event dates",
      "Public appearances",
      "External confirmation",
    ],
  },
  {
    tier: 4,
    name: "Commentary",
    weight: "Discovery only",
    examples: [
      "Fan pages",
      "Reaction videos",
      "Social chatter",
    ],
  },
] as const;

export const LIVE_PIPELINE = [
  "Approved sources",
  "Continuous ingestion",
  "Attribution & fact extraction",
  "Temporal knowledge",
  "Reviewed persona updates",
  "Current AI interpretation",
] as const;

export const IDENTITY_LAYERS = [
  {
    name: "Core identity",
    cadence: "Changes rarely",
    items: [
      "Biography",
      "Formative history",
      "Recurring values",
      "Communication patterns",
      "Persona boundaries",
    ],
  },
  {
    name: "Current public state",
    cadence: "Updates continuously",
    items: [
      "Recent statements",
      "Current projects",
      "Public appearances",
      "Latest interests",
      "Publicly stated positions",
    ],
  },
  {
    name: "Relationship memory",
    cadence: "Per user",
    items: [
      "Previous discussions",
      "Topics they care about",
      "Disagreements",
      "Unresolved questions",
      "Preferred conversational style",
    ],
  },
] as const;

export const CONVERSATION_MODES = [
  {
    id: "documented",
    name: "Documented",
    description: "Only sourced statements.",
  },
  {
    id: "interpretation",
    name: "Current interpretation",
    description: "Sourced statements plus cautious synthesis.",
  },
  {
    id: "creative",
    name: "Creative conversation",
    description: "Fictional extrapolation, clearly labelled.",
  },
  {
    id: "historical",
    name: "Historical",
    description: "Answer as understood at a selected date.",
  },
] as const;

/** Topics that must never auto-mutate identity without human review. */
export const REVIEW_REQUIRED_TOPICS = [
  "political positions",
  "religion",
  "sexuality",
  "health",
  "family",
  "controversial topics",
  "commercial endorsements",
] as const;

export const LIVE_PERSONA_USE_CASES = [
  "A creator whose AI follows every new podcast",
  "A CEO persona updated from earnings calls",
  "An author persona updated from essays",
  "A licensed digital representative for a public figure",
  "A museum figure updated as scholarship changes",
  "A company assistant updated from policies and releases",
] as const;
