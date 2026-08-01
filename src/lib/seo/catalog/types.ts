export type SeoVerb = "meet" | "learn" | "hire" | "create";

export type SeoRelated = {
  verb: SeoVerb;
  slug: string;
  label: string;
};

export type SeoDialogueLine = {
  role: "user" | "persona";
  text: string;
};

export type SeoFaq = {
  q: string;
  a: string;
};

export type SeoCta = {
  label: string;
  href: string;
};

export type SeoPage = {
  verb: SeoVerb;
  slug: string;
  /** Human filter chip on /explore */
  category: string;
  name: string;
  title: string;
  metaDescription: string;
  h1: string;
  summary: string;
  bullets: string[];
  topics: string[];
  sampleDialogue: SeoDialogueLine[];
  faqs: SeoFaq[];
  related: SeoRelated[];
  /** Live chat demo at /c/[demoSlug] when present */
  demoSlug?: string;
  voiceHint?: boolean;
  ctaPrimary: SeoCta;
  ctaSecondary: SeoCta;
  /** Historical / interpretive disclaimer */
  disclaimer?: string;
  /** Hire-only soft ROI inputs */
  roiHints?: {
    label: string;
    missedLeadsPerWeek: number;
    valuePerLead: number;
    hoursSavedPerWeek: number;
    hourlyCost: number;
  };
};

export function seoPath(verb: SeoVerb, slug: string): string {
  return `/${verb}/${slug}`;
}
