import type { Metadata } from "next";
import Link from "next/link";
import { LegalFooter } from "@/components/LegalFooter";
import { MarketingNav } from "@/components/MarketingNav";
import { breadcrumbJsonLd } from "@/lib/seo/breadcrumbs";
import { TECHNOLOGY_KEYWORDS } from "@/lib/seo/keywords";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Technology — identity, memory, continuity",
  description:
    "How Vesperer keeps AI characters consistent: layered identity, long-term memory, evolving relationships and portable configuration across web, Telegram, voice and API.",
  alternates: { canonical: `${SITE_URL}/technology` },
  keywords: TECHNOLOGY_KEYWORDS,
  openGraph: {
    title: `Technology · ${SITE_NAME}`,
    description:
      "Identity layers, long-term memory, relationship state, and export for AI characters.",
    url: `${SITE_URL}/technology`,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `Technology · ${SITE_NAME}`,
    description:
      "The engine behind AI characters that remember — identity, memory, and continuity.",
  },
};

const LAYERS = [
  {
    t: "Identity layers",
    d: "Soul, style, rules and context stay separated so personality remains stable while lore and tone can evolve safely.",
  },
  {
    t: "Long-term memory",
    d: "People, promises, preferences and meaningful moments are stored and retrieved across conversations — not lost after a context window.",
  },
  {
    t: "Relationship state",
    d: "Trust, affection, mood and history diverge per user, so the same character can grow differently with everyone.",
  },
  {
    t: "Continuity across channels",
    d: "Keep one character definition when you change models, devices, APIs or messaging surfaces.",
  },
  {
    t: "Ownership & export",
    d: "Identity, configuration and memories are structured so creators can move what they built — not only a brittle prompt file.",
  },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      name: "Vesperer Technology",
      description:
        "How Vesperer keeps AI characters consistent with layered identity, memory, and relationship state.",
      url: `${SITE_URL}/technology`,
    },
    {
      "@type": "ItemList",
      name: "Vesperer character engine layers",
      itemListElement: LAYERS.map((layer, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: layer.t,
        description: layer.d,
      })),
    },
    breadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "Technology", path: "/technology" },
    ]),
  ],
};

export default function TechnologyPage() {
  return (
    <div className="relative min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <MarketingNav variant="marketing" />
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
        <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--accent)]">
          Technology
        </p>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-semibold tracking-tight sm:text-5xl">
          The engine behind characters that remember.
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-[var(--muted)]">
          {SITE_NAME} is the layer that turns your knowledge and voice into an
          AI clients can talk to — with persistent identity, long-term memory,
          and channels you configure yourself.
        </p>

        <div className="mt-12 grid gap-4 sm:grid-cols-2">
          {LAYERS.map((layer) => (
            <article
              key={layer.t}
              className="rounded-2xl border border-[var(--line)] bg-[var(--bg-elevated)]/70 p-5"
            >
              <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold">
                {layer.t}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
                {layer.d}
              </p>
            </article>
          ))}
        </div>

        <section className="mt-14 rounded-2xl border border-[var(--line)] p-6">
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold">
            For builders
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
            Each character can expose a chat API key, connect to Telegram, and
            keep peer-isolated memory. Request shapes live in the public agent
            skill.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/developers"
              className="rounded-xl bg-[var(--accent)] px-5 py-3 text-sm font-medium text-[var(--accent-ink)]"
            >
              Developer docs
            </Link>
            <Link
              href="/#create"
              className="rounded-xl border border-[var(--line)] px-5 py-3 text-sm"
            >
              Create a character
            </Link>
            <Link
              href="/bring"
              className="rounded-xl border border-[var(--line)] px-5 py-3 text-sm"
            >
              Bring an existing character
            </Link>
          </div>
        </section>
      </main>
      <LegalFooter variant="marketing" />
    </div>
  );
}
