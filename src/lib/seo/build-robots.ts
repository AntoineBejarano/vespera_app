import type { MetadataRoute } from "next";
import { AFTER_DARK_URL } from "@/lib/hosts";
import type { RequestSurface } from "@/lib/seo/request-surface";
import { SITE_URL } from "@/lib/site";

/** App / auth / private surfaces — never crawl. */
const DISALLOW_ALL: string[] = [
  "/api/",
  "/handler/",
  "/auth/",
  "/personas",
  "/chat",
  "/memory",
  "/settings",
  "/workspaces",
  "/knowledge",
  "/age-gate",
  "/underage",
  "/login",
  "/register",
  "/report",
];

/** AI / answer-engine crawlers — explicitly welcome on public content. */
const AI_USER_AGENTS = [
  "GPTBot",
  "ChatGPT-User",
  "OAI-SearchBot",
  "ClaudeBot",
  "Anthropic-AI",
  "PerplexityBot",
  "Google-Extended",
  "Applebot-Extended",
  "Bytespider",
  "CCBot",
  "meta-externalagent",
  "FacebookBot",
  "Diffbot",
  "cohere-ai",
];

function baseRules(extraDisallow: string[] = []): MetadataRoute.Robots["rules"] {
  const disallow = [...DISALLOW_ALL, ...extraDisallow];
  return [
    {
      userAgent: "*",
      allow: "/",
      disallow,
    },
    ...AI_USER_AGENTS.map((userAgent) => ({
      userAgent,
      allow: "/",
      disallow,
    })),
  ];
}

export function buildApexRobots(surface: RequestSurface): MetadataRoute.Robots {
  return {
    rules: baseRules(),
    // Secondary sitemap helps Discover the adult property when both are verified
    sitemap: [`${SITE_URL}/sitemap.xml`, `${AFTER_DARK_URL}/sitemap.xml`],
    host: surface.host,
  };
}

export function buildAfterDarkRobots(
  surface: RequestSurface,
): MetadataRoute.Robots {
  return {
    rules: baseRules([
      // Keep apex SEO trees off the adult host crawl budget
      "/explore",
      "/meet/",
      "/learn/",
      "/hire/",
      "/create/",
      "/characters/",
      "/historical-figures/",
      "/use-cases/",
      "/business",
      "/bring",
      "/chai-character-creator",
      "/chai-character-backup",
      "/integrations/",
    ]),
    sitemap: `${AFTER_DARK_URL}/sitemap.xml`,
    host: surface.host,
  };
}
