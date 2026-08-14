import { AFTER_DARK_URL } from "@/lib/hosts";
import { SITE_URL } from "@/lib/site";

export type PublicPageEntry = {
  path: string;
  title: string;
  description: string;
  changeFrequency:
    | "always"
    | "hourly"
    | "daily"
    | "weekly"
    | "monthly"
    | "yearly"
    | "never";
  priority: number;
  /** Include in compact llms.txt (not only llms-full) */
  llms?: boolean;
};

/** Indexable apex marketing / product pages (canonical paths only — no 308 aliases). */
export const APEX_STATIC_PAGES: PublicPageEntry[] = [
  {
    path: "/",
    title: "Home",
    description: "AI personas with stable identity, long-term memory and evolving relationships",
    changeFrequency: "weekly",
    priority: 1,
    llms: true,
  },
  {
    path: "/bring",
    title: "Bring a character",
    description: "Import Character Card, SillyTavern and prompts into a persistent persona",
    changeFrequency: "monthly",
    priority: 0.9,
    llms: true,
  },
  {
    path: "/voice",
    title: "Voice",
    description: "Spoken AI with the same identity and memories across channels",
    changeFrequency: "weekly",
    priority: 0.95,
    llms: true,
  },
  {
    path: "/integrations/claude",
    title: "Claude integration",
    description: "Use Vesperer personas with Claude and agent workflows",
    changeFrequency: "weekly",
    priority: 0.92,
    llms: true,
  },
  {
    path: "/technology",
    title: "Technology",
    description: "Identity layers, memory, relationship state and export",
    changeFrequency: "monthly",
    priority: 0.6,
    llms: true,
  },
  {
    path: "/business",
    title: "Business",
    description: "AI employees and branded personas for companies",
    changeFrequency: "weekly",
    priority: 0.9,
    llms: true,
  },
  {
    path: "/business/agencies",
    title: "For agencies",
    description: "Ship client personas with memory and multi-channel delivery",
    changeFrequency: "weekly",
    priority: 0.85,
    llms: true,
  },
  {
    path: "/business/platforms",
    title: "For platforms",
    description: "Embed persistent AI personas into your product",
    changeFrequency: "weekly",
    priority: 0.85,
    llms: true,
  },
  {
    path: "/explore",
    title: "Explore",
    description: "Hub for Meet / Learn / Hire / Create programmatic SEO pages",
    changeFrequency: "weekly",
    priority: 0.95,
    llms: true,
  },
  {
    path: "/ai-characters",
    title: "AI characters",
    description:
      "Hub for AI character creation, historical personas, memory and portable character tools",
    changeFrequency: "weekly",
    priority: 0.94,
    llms: true,
  },
  {
    path: "/historical-ai",
    title: "Historical AI",
    description:
      "Historical AI personas with transparent provenance, educational context and memory",
    changeFrequency: "weekly",
    priority: 0.9,
    llms: true,
  },
  {
    path: "/ai-tutors",
    title: "AI tutors",
    description:
      "AI tutors that remember student progress across philosophy, history, math, programming and more",
    changeFrequency: "weekly",
    priority: 0.91,
    llms: true,
  },
  {
    path: "/ai-employees",
    title: "AI employees",
    description:
      "AI employees for reception, support, sales, booking and customer workflows with relationship memory",
    changeFrequency: "weekly",
    priority: 0.89,
    llms: true,
  },
  {
    path: "/character-tools",
    title: "Character tools",
    description:
      "Character Card, SillyTavern, Chai and import/export tools for portable AI characters",
    changeFrequency: "weekly",
    priority: 0.9,
    llms: true,
  },
  {
    path: "/registry",
    title: "Persona Registry",
    description: "Public persona identities — export, fork, publish anywhere",
    changeFrequency: "daily",
    priority: 0.95,
    llms: true,
  },
  {
    path: "/chai-character-creator",
    title: "Chai character creator",
    description: "Create Chai-ready characters with persistent Vesperer identity",
    changeFrequency: "weekly",
    priority: 0.92,
    llms: true,
  },
  {
    path: "/chai-character-backup",
    title: "Chai character backup",
    description: "Back up and restore Chai characters into Vesperer",
    changeFrequency: "weekly",
    priority: 0.9,
    llms: true,
  },
];

export function apexUrl(path: string): string {
  if (path === "/") return SITE_URL;
  return `${SITE_URL}${path}`;
}

export function afterDarkUrl(path = "/"): string {
  if (path === "/") return AFTER_DARK_URL;
  return `${AFTER_DARK_URL}${path}`;
}
