import { listAllSeoPages } from "@/lib/seo/catalog";
import type { SeoGenerationTopic } from "@/lib/seo/generated/schema";

const AUDIENCES = [
  "solo creators",
  "course builders",
  "museum teams",
  "boutique hotels",
  "language tutors",
  "real estate agents",
  "indie game studios",
  "podcast hosts",
  "newsletter writers",
  "community managers",
  "coaches",
  "wellness studios",
  "local clinics",
  "agencies",
  "marketplace operators",
  "SaaS onboarding teams",
  "fan community owners",
  "authors",
  "historical educators",
  "customer success teams",
];

const USE_CASES = [
  "turn a repeated explanation into a persistent AI persona",
  "give a brand voice long-term memory across chat and voice",
  "let visitors test an expert before booking a call",
  "publish a reusable persona that can be forked and exported",
  "support users with a character that remembers context",
  "create a voice-ready guide with consistent identity",
  "train a fictional mentor from owned notes and FAQs",
  "build a public demo persona for search and conversion",
  "move a character from another platform without losing its canon",
  "operate several client personas from one workspace",
  "create a companion for recurring learning sessions",
  "package a niche expertise into a registry page",
];

const CHANNELS = [
  "web chat",
  "voice demo",
  "Telegram",
  "public registry",
  "API",
  "creator site",
  "course page",
  "support flow",
];

const OUTCOMES = [
  "more qualified trials",
  "better onboarding",
  "less repeated support",
  "stronger character continuity",
  "portable IP",
  "higher demo completion",
  "clearer buyer education",
  "faster content operations",
];

const PRODUCT_ANGLES = [
  "identity layers",
  "long-term memory",
  "voice and chat continuity",
  "workspace permissions",
  "public registry pages",
  "knowledge packs",
  "API keys",
  "human handoff",
  "export and fork workflows",
];

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72)
    .replace(/-+$/g, "");
}

function normalize(value: string) {
  return slugify(value).replace(/-/g, " ");
}

function staticSlugs() {
  return new Set(listAllSeoPages().map((page) => page.slug));
}

export function buildSeoTopicCandidates(): SeoGenerationTopic[] {
  const blockedSlugs = staticSlugs();
  const candidates: SeoGenerationTopic[] = [];

  for (const audience of AUDIENCES) {
    for (const useCase of USE_CASES) {
      for (const channel of CHANNELS) {
        const outcome =
          OUTCOMES[
            (audience.length + useCase.length + channel.length) %
              OUTCOMES.length
          ];
        const productAngle =
          PRODUCT_ANGLES[
            (audience.length * 3 + useCase.length + channel.length) %
              PRODUCT_ANGLES.length
          ];
        const category =
          audience.includes("hotel") ||
          audience.includes("clinic") ||
          audience.includes("real estate") ||
          audience.includes("success") ||
          audience.includes("SaaS")
            ? "Business"
            : audience.includes("course") ||
                audience.includes("tutor") ||
                audience.includes("educator")
              ? "Learning"
              : audience.includes("creator") ||
                  audience.includes("authors") ||
                  audience.includes("podcast") ||
                  audience.includes("newsletter")
                ? "Creator"
                : "Community";
        const slug = slugify(
          `${audience} ${normalize(productAngle)} ${normalize(channel)}`,
        );

        if (blockedSlugs.has(slug)) continue;

        candidates.push({
          slug,
          fingerprint: `${audience}|${useCase}|${channel}|${outcome}|${productAngle}`,
          category,
          audience,
          useCase,
          intent: `How can ${audience} use Vesperer to ${useCase} for ${outcome}?`,
          channel,
          productAngle,
        });
      }
    }
  }

  return candidates;
}

export function pickNextSeoTopic(params: {
  usedSlugs: Set<string>;
  usedFingerprints: Set<string>;
  offset?: number;
}) {
  const candidates = buildSeoTopicCandidates();
  const start = params.offset ? params.offset % candidates.length : 0;

  for (let i = 0; i < candidates.length; i += 1) {
    const topic = candidates[(start + i) % candidates.length];
    if (!topic) continue;
    if (params.usedSlugs.has(topic.slug)) continue;
    if (params.usedFingerprints.has(topic.fingerprint)) continue;
    return topic;
  }

  return null;
}
