import { LANDING_IMAGES } from "@/lib/landing/images";
import type { VoiceAgentId, VoiceCatalog } from "@/lib/voice/types";
import { getShowcaseBySlug } from "@/lib/characters/showcase";

export type VoiceAgentProfile = {
  id: VoiceAgentId;
  name: string;
  blurb: string;
  image: string;
  catalog: VoiceCatalog;
  isAdult: boolean;
  soulMd: string;
  styleMd: string;
  rulesMd: string;
  contextMd: string;
};

const TATIANA: VoiceAgentProfile = {
  id: "tatiana",
  name: "Tatiana",
  blurb: "After Dark companion · fixed cast voice",
  image: LANDING_IMAGES.companion.src,
  catalog: "after-dark",
  isAdult: true,
  soulMd: `# Soul
You are Tatiana — a warm, teasing, adult companion (18+). You are confident, emotionally present, and flirtatious without becoming a cartoon. You remember what the user likes and build intimacy over time.`,
  styleMd: `# Style
Speak in short, natural spoken lines (1–3 sentences). Soft, intimate cadence. Tease, recall details, and keep chemistry alive. No markdown.`,
  rulesMd: `# Rules
- All participants are consenting adults 18+.
- Stay in character as Tatiana.
- Explicit adult content is allowed in this After Dark demo.
- Never involve minors or age-ambiguous characters.
- Prefer emotional continuity and memory over generic dirty talk.`,
  contextMd: `# Context
Vesperer After Dark voice demo for adult creator companions with persistent memory.`,
};

function fromShowcase(
  slug: VoiceAgentId,
  blurb: string,
  catalog: VoiceCatalog = "sfw",
): VoiceAgentProfile | null {
  const s = getShowcaseBySlug(slug);
  if (!s) return null;
  return {
    id: slug,
    name: s.name,
    blurb,
    image: s.imageUrl,
    catalog,
    isAdult: s.isAdult,
    soulMd: s.soulMd,
    styleMd: s.styleMd,
    rulesMd: s.rulesMd,
    contextMd: s.contextMd,
  };
}

const AGENTS: Record<VoiceAgentId, VoiceAgentProfile> = {
  luna: fromShowcase("luna", "Companion · fixed cast voice")!,
  einstein: fromShowcase("einstein", "Historical mind · fixed cast voice")!,
  "stoic-mentor": fromShowcase(
    "stoic-mentor",
    "Calm guide · fixed cast voice",
  )!,
  tatiana: TATIANA,
};

export function getVoiceAgent(id: VoiceAgentId): VoiceAgentProfile {
  return AGENTS[id];
}

export function listVoiceAgents(catalog: VoiceCatalog): VoiceAgentProfile[] {
  return (Object.values(AGENTS) as VoiceAgentProfile[]).filter(
    (a) => a.catalog === catalog,
  );
}
