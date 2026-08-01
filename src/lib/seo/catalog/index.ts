import { CREATE_PAGES } from "./create";
import { HIRE_PAGES } from "./hire";
import { LEARN_PAGES } from "./learn";
import { MEET_PAGES } from "./meet";
import type { SeoPage, SeoVerb } from "./types";
import { seoPath } from "./types";

export type { SeoPage, SeoVerb, SeoRelated, SeoFaq, SeoCta } from "./types";
export { seoPath } from "./types";

const ALL: SeoPage[] = [
  ...MEET_PAGES,
  ...LEARN_PAGES,
  ...HIRE_PAGES,
  ...CREATE_PAGES,
];

const byKey = new Map(ALL.map((p) => [`${p.verb}:${p.slug}`, p]));

/** use-cases alias → canonical verb path */
const USE_CASE_ALIASES: Record<string, { verb: SeoVerb; slug: string }> = {
  // Learn intents often searched as use-cases
  "ai-companion": { verb: "create", slug: "ai-character" },
  "ai-tutor": { verb: "learn", slug: "philosophy-tutor" },
  "ai-mentor": { verb: "learn", slug: "stoic-mentor" },
  "philosophy-companion": { verb: "learn", slug: "philosophy-tutor" },
  "language-tutor": { verb: "learn", slug: "language-partner" },
  "rpg-character": { verb: "create", slug: "ai-character" },
  "virtual-creator": { verb: "create", slug: "virtual-influencer" },
  // Hire
  "ai-receptionist": { verb: "hire", slug: "ai-receptionist" },
  "ai-sales-agent": { verb: "hire", slug: "ai-sales-agent" },
  "ai-customer-support": { verb: "hire", slug: "ai-customer-support" },
  "ai-booking-assistant": { verb: "hire", slug: "ai-booking-assistant" },
  "ai-virtual-assistant": { verb: "hire", slug: "ai-virtual-assistant" },
  "ai-museum-guide": { verb: "hire", slug: "museum-guide" },
  "ai-course-tutor": { verb: "learn", slug: "history-tutor" },
  "ai-community-manager": { verb: "create", slug: "ai-version-of-yourself" },
  "hotel-concierge": { verb: "hire", slug: "hotel-concierge" },
  "real-estate-assistant": { verb: "hire", slug: "real-estate-assistant" },
  "dental-receptionist": { verb: "hire", slug: "dental-receptionist" },
  "museum-guide": { verb: "hire", slug: "museum-guide" },
};

export function listAllSeoPages(): SeoPage[] {
  return ALL;
}

export function listByVerb(verb: SeoVerb): SeoPage[] {
  return ALL.filter((p) => p.verb === verb);
}

export function getSeoPage(verb: SeoVerb, slug: string): SeoPage | null {
  return byKey.get(`${verb}:${slug}`) ?? null;
}

export function listAllForSitemap(): { path: string; page: SeoPage }[] {
  return ALL.map((page) => ({ path: seoPath(page.verb, page.slug), page }));
}

export function exploreCategories(): string[] {
  return [...new Set(ALL.map((p) => p.category))];
}

/** Resolve /use-cases/[slug] → canonical path or null */
export function resolveUseCaseAlias(slug: string): string | null {
  const directHire = getSeoPage("hire", slug);
  if (directHire) return seoPath("hire", slug);
  const directLearn = getSeoPage("learn", slug);
  if (directLearn) return seoPath("learn", slug);
  const directCreate = getSeoPage("create", slug);
  if (directCreate) return seoPath("create", slug);
  const mapped = USE_CASE_ALIASES[slug];
  if (mapped) return seoPath(mapped.verb, mapped.slug);
  return null;
}

/** /characters/[slug] and /historical-figures/[slug] → /meet/[slug] when known */
export function resolveMeetAlias(slug: string): string | null {
  // Map common SEO slugs onto meet pages
  const meetSlug =
    slug === "einstein" || slug === "albert-einstein"
      ? "albert-einstein"
      : slug === "leonardo" || slug === "da-vinci"
        ? "leonardo-da-vinci"
        : slug;
  if (getSeoPage("meet", meetSlug)) return seoPath("meet", meetSlug);
  return null;
}

export const VERB_LABELS: Record<SeoVerb, string> = {
  meet: "Meet",
  learn: "Learn",
  hire: "Hire",
  create: "Create",
};
