import type { Metadata } from "next";
import Link from "next/link";
import { LegalFooter } from "@/components/LegalFooter";
import { MarketingNav } from "@/components/MarketingNav";
import { breadcrumbJsonLd } from "@/lib/seo/breadcrumbs";
import { SKILL_INSTALL_REPO, SKILL_PUBLIC_PATHS } from "@/lib/skill/content";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Developer docs — CLI, API, and agent skill",
  description:
    "Public Vesperer docs for coding agents: installable skill, account keys (vsk_), persona chat keys (vesp_), Chat API, and optional external reasoning runtimes.",
  alternates: { canonical: `${SITE_URL}${SKILL_PUBLIC_PATHS.developers}` },
  keywords: [
    "Vesperer API",
    "Vesperer CLI",
    "AI persona API",
    "vsk_ API key",
    "vesp_ chat key",
    "ContextEnvelope",
    "installable agent skill",
  ],
  openGraph: {
    title: `Developer docs · ${SITE_NAME}`,
    description:
      "Skill, CLI and APIs for persistent AI personas — identity, memory, and optional external reasoning.",
    url: `${SITE_URL}${SKILL_PUBLIC_PATHS.developers}`,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `Developer docs · ${SITE_NAME}`,
    description:
      "Public agent skill and APIs for creating Vesperer personas without a browser.",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      name: "Vesperer developer docs",
      description:
        "Public CLI, API and installable agent skill for persistent AI personas.",
      url: `${SITE_URL}${SKILL_PUBLIC_PATHS.developers}`,
    },
    breadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "Developers", path: SKILL_PUBLIC_PATHS.developers },
    ]),
  ],
};

const SURFACES = [
  {
    href: SKILL_PUBLIC_PATHS.skill,
    t: "Agent skill",
    d: "Canonical SKILL.md. Fetch this first. Also at /skill.md.",
  },
  {
    href: SKILL_PUBLIC_PATHS.full,
    t: "Full pack",
    d: "Skill + API reference + runtime envelope in one markdown file.",
  },
  {
    href: SKILL_PUBLIC_PATHS.reference,
    t: "API reference",
    d: "Personas, chat, knowledge, bots, keys, errors, rate limits.",
  },
  {
    href: SKILL_PUBLIC_PATHS.runtime,
    t: "Runtime",
    d: "ContextEnvelope v1, ReasoningResult, and RuntimeBinding rules.",
  },
];

export default function DevelopersPage() {
  return (
    <div className="relative min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <MarketingNav variant="marketing" />
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
        <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--accent)]">
          Developers
        </p>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-semibold tracking-tight sm:text-5xl">
          Docs built for coding agents.
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-[var(--muted)]">
          {SITE_NAME} owns identity, relationships and continuity. Native
          reasoning is the default. Advanced personas can attach an external
          HTTP runtime without changing who they are.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href={SKILL_PUBLIC_PATHS.skill}
            className="rounded-xl bg-[var(--accent)] px-5 py-3 text-sm font-medium text-[var(--accent-ink)]"
          >
            Fetch /skill
          </Link>
          <Link
            href="/integrations/claude"
            className="rounded-xl border border-[var(--line)] px-5 py-3 text-sm"
          >
            Claude · vibecode
          </Link>
          <Link
            href="/handler/sign-up"
            className="rounded-xl border border-[var(--line)] px-5 py-3 text-sm"
          >
            Get a vsk_ key
          </Link>
        </div>

        <section className="mt-14">
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold">
            Install the skill
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
            Agents should fetch the live skill instead of guessing request
            shapes. Human walkthroughs stay on this page and{" "}
            <Link href="/integrations/claude" className="underline underline-offset-2">
              /integrations/claude
            </Link>
            .
          </p>
          <pre className="mt-4 overflow-x-auto rounded-2xl border border-[var(--line)] bg-[var(--bg-elevated)]/70 p-4 text-xs leading-relaxed">
{`mkdir -p ~/.cursor/skills/vesperer
curl -sSL ${SITE_URL}/skill > ~/.cursor/skills/vesperer/SKILL.md
curl -sSL ${SITE_URL}/skill/reference > ~/.cursor/skills/vesperer/reference.md
curl -sSL ${SITE_URL}/skill/runtime > ~/.cursor/skills/vesperer/runtime.md

npx skills add ${SKILL_INSTALL_REPO}`}
          </pre>
        </section>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {SURFACES.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-2xl border border-[var(--line)] bg-[var(--bg-elevated)]/70 p-5 hover:border-[var(--accent)]"
            >
              <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold">
                {item.t}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
                {item.d}
              </p>
              <p className="mt-3 font-mono text-xs text-[var(--accent)]">
                {item.href}
              </p>
            </Link>
          ))}
        </div>

        <section className="mt-14 rounded-2xl border border-[var(--line)] p-6">
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold">
            Two keys
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
            <code className="text-[var(--ink)]">vsk_</code> manages personas.
            <code className="text-[var(--ink)]"> vesp_</code> chats with one
            persona. Account keys cannot call chat; chat keys cannot list or
            edit personas.
          </p>
          <pre className="mt-4 overflow-x-auto rounded-xl border border-[var(--line)] bg-[var(--bg-elevated)]/70 p-4 text-xs leading-relaxed">
{`export VESPERER_API_KEY=vsk_YOUR_SECRET
npm run vesperer -- personas create --from persona.json

curl -X POST ${SITE_URL}/api/v1/chat \\
  -H "Content-Type: application/json" \\
  -H "X-Api-Key: vesp_PERSONA_CHAT_KEY" \\
  -d '{"message":"Hello","peerId":"customer_123"}'`}
          </pre>
        </section>
      </main>
      <LegalFooter variant="marketing" />
    </div>
  );
}
