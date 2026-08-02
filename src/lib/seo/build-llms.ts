import { SHOWCASE_CHARACTERS } from "@/lib/characters/showcase";
import { LEGAL_PAGES } from "@/lib/legal/constants";
import { listAllSeoPages, VERB_LABELS } from "@/lib/seo/catalog";
import { seoPath } from "@/lib/seo/catalog/types";
import { APEX_STATIC_PAGES, apexUrl, afterDarkUrl } from "@/lib/seo/public-pages";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";
import { AFTER_DARK_URL } from "@/lib/hosts";

function link(title: string, url: string, note: string): string {
  return `- [${title}](${url}): ${note}`;
}

function section(title: string, lines: string[]): string {
  if (lines.length === 0) return "";
  return `## ${title}\n\n${lines.join("\n")}`;
}

/** Compact curated index for agents (llms.txt / llm.txt). */
export function buildApexLlmsTxt(): string {
  const product = APEX_STATIC_PAGES.filter((p) => p.llms).map((p) =>
    link(p.title, apexUrl(p.path), p.description),
  );

  const seoByVerb = {
    meet: listAllSeoPages().filter((p) => p.verb === "meet"),
    learn: listAllSeoPages().filter((p) => p.verb === "learn"),
    hire: listAllSeoPages().filter((p) => p.verb === "hire"),
    create: listAllSeoPages().filter((p) => p.verb === "create"),
  };

  const explore = [
    link("Explore hub", apexUrl("/explore"), "Meet / Learn / Hire / Create index"),
    ...seoByVerb.meet.slice(0, 4).map((p) =>
      link(p.name, apexUrl(seoPath(p.verb, p.slug)), p.metaDescription),
    ),
    ...seoByVerb.learn.slice(0, 3).map((p) =>
      link(p.name, apexUrl(seoPath(p.verb, p.slug)), p.metaDescription),
    ),
    ...seoByVerb.hire.slice(0, 3).map((p) =>
      link(p.name, apexUrl(seoPath(p.verb, p.slug)), p.metaDescription),
    ),
    ...seoByVerb.create.slice(0, 3).map((p) =>
      link(p.name, apexUrl(seoPath(p.verb, p.slug)), p.metaDescription),
    ),
  ];

  const demos = SHOWCASE_CHARACTERS.filter((c) => !c.isAdult)
    .slice(0, 8)
    .flatMap((c) => [
      link(
        `${c.name} registry`,
        apexUrl(`/p/${c.slug}`),
        c.tagline || `Public persona identity for ${c.name}`,
      ),
      link(
        `${c.name} live chat`,
        apexUrl(`/c/${c.slug}`),
        `Demo conversation with ${c.name}`,
      ),
    ]);

  const builders = [
    link(
      "Sitemap",
      `${SITE_URL}/sitemap.xml`,
      "Full indexable URL set for search engines",
    ),
    link(
      "Full LLM context",
      `${SITE_URL}/llms-full.txt`,
      "Expanded page summaries for deep agent ingestion",
    ),
    link(
      "Studio sign-in",
      `${SITE_URL}/handler/sign-in`,
      "API & CLI docs are available inside the signed-in studio at /docs",
    ),
  ];

  const optional = [
    link(
      "After Dark (18+)",
      AFTER_DARK_URL,
      "Adult companions on a separate host — not mixed with apex content",
    ),
    ...LEGAL_PAGES.map((p) =>
      link(p.title, apexUrl(`/legal/${p.slug}`), p.description ?? p.title),
    ),
  ];

  const parts = [
    `# ${SITE_NAME}`,
    "",
    `> ${SITE_DESCRIPTION}`,
    "",
    "Meet someone impossible: companions, historical minds, mentors, creator personas and AI employees. Adult experiences live only on **Vesperer After Dark** (`xxx.vesperer.com`).",
    "",
    "Automated AI interactions are disclosed for EU AI Act transparency. Illegal content, exploitation, and sexual content involving minors are prohibited platform-wide.",
    "",
    "Canonical taxonomy: `/explore`, `/meet/[slug]`, `/learn/[slug]`, `/hire/[slug]`, `/create/[slug]`. Aliases 308 to canons: `/characters/*`, `/historical-figures/*` → meet; `/use-cases/*` → hire/learn/create.",
    "",
    "Channels: web, Telegram, voice, Chat API (`POST /api/v1/chat`), CLI (`npm run vesperer`).",
    "",
    section("Product", product),
    "",
    section("Explore", explore),
    "",
    section("Registry & demos", demos),
    "",
    section("For builders & AI agents", builders),
    "",
    section("Optional", optional),
    "",
  ];

  return parts.filter((p, i, arr) => !(p === "" && arr[i - 1] === "")).join("\n");
}

/** Expanded summaries for deep ingestion (llms-full.txt). */
export function buildApexLlmsFullTxt(): string {
  const pages = listAllSeoPages();
  const blocks: string[] = [
    `# ${SITE_NAME} — full context`,
    "",
    `> ${SITE_DESCRIPTION}`,
    "",
    `Canonical site: ${SITE_URL}`,
    `Compact index: ${SITE_URL}/llms.txt`,
    `Sitemap: ${SITE_URL}/sitemap.xml`,
    "",
    "## Product pages",
    "",
  ];

  for (const p of APEX_STATIC_PAGES) {
    blocks.push(`### ${p.title}`);
    blocks.push("");
    blocks.push(`URL: ${apexUrl(p.path)}`);
    blocks.push("");
    blocks.push(p.description);
    blocks.push("");
  }

  blocks.push("## Explore catalog");
  blocks.push("");

  for (const page of pages) {
    const url = apexUrl(seoPath(page.verb, page.slug));
    blocks.push(`### ${VERB_LABELS[page.verb]}: ${page.name}`);
    blocks.push("");
    blocks.push(`URL: ${url}`);
    blocks.push("");
    blocks.push(page.summary);
    blocks.push("");
    if (page.bullets.length) {
      for (const b of page.bullets) blocks.push(`- ${b}`);
      blocks.push("");
    }
    if (page.faqs.length) {
      blocks.push("FAQ:");
      blocks.push("");
      for (const f of page.faqs) {
        blocks.push(`- Q: ${f.q}`);
        blocks.push(`  A: ${f.a}`);
      }
      blocks.push("");
    }
    if (page.demoSlug) {
      blocks.push(`Live demo: ${apexUrl(`/c/${page.demoSlug}`)}`);
      blocks.push("");
    }
  }

  blocks.push("## Showcase personas");
  blocks.push("");
  for (const c of SHOWCASE_CHARACTERS.filter((x) => !x.isAdult)) {
    blocks.push(`### ${c.name}`);
    blocks.push("");
    blocks.push(`Registry: ${apexUrl(`/p/${c.slug}`)}`);
    blocks.push(`Chat: ${apexUrl(`/c/${c.slug}`)}`);
    blocks.push("");
    blocks.push(c.tagline);
    blocks.push("");
    blocks.push(c.openingLine);
    blocks.push("");
  }

  blocks.push("## Legal");
  blocks.push("");
  for (const p of LEGAL_PAGES) {
    blocks.push(`- [${p.title}](${apexUrl(`/legal/${p.slug}`)})`);
  }
  blocks.push("");
  blocks.push("## Optional");
  blocks.push("");
  blocks.push(
    link(
      "After Dark (18+)",
      AFTER_DARK_URL,
      "Adult surface on a separate host — see that host's /llms.txt",
    ),
  );
  blocks.push("");

  return blocks.join("\n");
}

/** After Dark host index — keep SFW apex content out of the adult surface file. */
export function buildAfterDarkLlmsTxt(): string {
  const parts = [
    `# ${SITE_NAME} After Dark`,
    "",
    "> Private, persistent adult AI companions with evolving chemistry and creator-owned identity. 18+ only.",
    "",
    "After Dark is the adults-only surface of Vesperer. It is intentionally separated from the main product at vesperer.com. Age verification is required. Sexual content involving minors / age-play is prohibited.",
    "",
    section("Product", [
      link(
        "After Dark home",
        afterDarkUrl("/"),
        "Adult companions that remember — private and persistent",
      ),
      link(
        "Main Vesperer (SFW)",
        SITE_URL,
        "Non-adult personas, business, Explore, docs and registry",
      ),
    ]),
    "",
    section("For builders & AI agents", [
      link("Apex llms.txt", `${SITE_URL}/llms.txt`, "Full SFW product and Explore index"),
      link("Apex sitemap", `${SITE_URL}/sitemap.xml`, "SFW indexable URLs"),
      link(
        "After Dark sitemap",
        `${AFTER_DARK_URL}/sitemap.xml`,
        "Adult-host indexable URLs",
      ),
    ]),
    "",
    section("Optional", [
      link(
        "Adult content notice",
        apexUrl("/legal/adult-content"),
        "Legal notice for the adult surface",
      ),
      link(
        "Acceptable use",
        apexUrl("/legal/acceptable-use"),
        "Platform prohibitions including CSAM and exploitation",
      ),
    ]),
    "",
  ];

  return parts.join("\n");
}

export function plainTextResponse(body: string, maxAge = 3600): Response {
  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": `public, max-age=${maxAge}, s-maxage=${maxAge * 6}`,
      "X-Robots-Tag": "all",
    },
  });
}
