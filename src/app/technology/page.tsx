import type { Metadata } from "next";
import Link from "next/link";
import { AppNav } from "@/components/AppNav";
import { LegalFooter } from "@/components/LegalFooter";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Technology — identity, memory, continuity",
  description:
    "How Vesperer keeps AI characters consistent: layered identity, long-term memory, evolving relationships and portable configuration across models and channels.",
  alternates: { canonical: `${SITE_URL}/technology` },
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
    t: "Versioning",
    d: "Try alternate personalities, compare behavior and restore earlier versions without destroying the original.",
  },
  {
    t: "Ownership & export",
    d: "Identity, configuration and memories are structured so creators can move what they built — not only a brittle prompt file.",
  },
];

export default function TechnologyPage() {
  return (
    <div className="relative min-h-screen">
      <AppNav variant="marketing" />
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
        <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--accent)]">
          Technology
        </p>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-semibold tracking-tight sm:text-5xl">
          The engine behind characters that remember.
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-[var(--muted)]">
          {SITE_NAME} is the creator layer for AI personalities: a persistent
          identity that can grow, be versioned, and live across supported
          environments — without explaining infrastructure on the homepage.
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
            keep peer-isolated memory. Human handoff and connector workflows are
            available for creator and studio deployments.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/#create"
              className="rounded-xl bg-[var(--accent)] px-5 py-3 text-sm font-medium text-[var(--accent-ink)]"
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
