import type { Metadata } from "next";
import Link from "next/link";
import { LegalFooter } from "@/components/LegalFooter";
import { MarketingNav } from "@/components/MarketingNav";
import { breadcrumbJsonLd } from "@/lib/seo/breadcrumbs";
import { DEVELOPER_KEYWORDS } from "@/lib/seo/keywords";
import { SKILL_INSTALL_REPO, SKILL_PUBLIC_PATHS } from "@/lib/skill/content";
import { SITE_NAME, SITE_URL } from "@/lib/site";

const TITLE = "Vesperer API & CLI — create persistent AI personas";
const DESCRIPTION =
  "Public Vesperer API and CLI docs: create AI personas with vsk_ account keys, chat with vesp_ keys, install the agent skill, and attach an optional external reasoning runtime.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  robots: { index: true, follow: true },
  alternates: {
    canonical: `${SITE_URL}${SKILL_PUBLIC_PATHS.developers}`,
    types: {
      "text/markdown": [
        { url: `${SITE_URL}/skill`, title: "Vesperer agent skill" },
        { url: `${SITE_URL}/skill/reference`, title: "Vesperer API reference" },
        { url: `${SITE_URL}/skill/runtime`, title: "Vesperer runtime envelope" },
      ],
    },
  },
  keywords: DEVELOPER_KEYWORDS,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: `${SITE_URL}${SKILL_PUBLIC_PATHS.developers}`,
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
};

const FAQS = [
  {
    q: "How do I create a Vesperer persona from an API or CLI?",
    a: "Sign in, create a vsk_ account API key in Settings, then POST /api/v1/personas or run npm run vesperer -- personas create --from persona.json with soul, style, rules and context layers.",
  },
  {
    q: "What is the difference between vsk_ and vesp_ keys?",
    a: "vsk_ is the account key that manages personas, knowledge packs and runtime bindings. vesp_ is the persona chat key for POST /api/v1/chat only. Account keys cannot chat; chat keys cannot list or edit personas.",
  },
  {
    q: "Where is the installable Vesperer skill for Cursor and Claude?",
    a: "Fetch https://vesperer.com/skill (API: /skill/reference, runtime: /skill/runtime). Install with npx skills add AntoineBejarano/vespera_app@vesperer or curl the markdown into ~/.cursor/skills/vesperer.",
  },
  {
    q: "Can I attach an external reasoning runtime such as Hermes?",
    a: "Yes, for SFW personas. Create a RuntimeBinding (https baseUrl + authSecretRef env var name), then PATCH the persona with reasoningMode external. After Dark / isAdult personas stay on Native reasoning.",
  },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "TechArticle",
      headline: TITLE,
      description: DESCRIPTION,
      url: `${SITE_URL}${SKILL_PUBLIC_PATHS.developers}`,
      inLanguage: "en",
      isAccessibleForFree: true,
      author: {
        "@type": "Organization",
        name: "Deevly Labs LTD",
        url: "https://deevlylabs.com",
      },
      publisher: {
        "@type": "Organization",
        name: SITE_NAME,
        url: SITE_URL,
      },
    },
    {
      "@type": "FAQPage",
      mainEntity: FAQS.map((faq) => ({
        "@type": "Question",
        name: faq.q,
        acceptedAnswer: { "@type": "Answer", text: faq.a },
      })),
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
    d: "Canonical SKILL.md for Cursor, Claude Code and other coding agents.",
  },
  {
    href: SKILL_PUBLIC_PATHS.reference,
    t: "API reference",
    d: "Personas, chat, knowledge, bots, keys, errors and rate limits.",
  },
  {
    href: SKILL_PUBLIC_PATHS.runtime,
    t: "Runtime envelope",
    d: "ContextEnvelope v1, ReasoningResult, and RuntimeBinding rules.",
  },
  {
    href: SKILL_PUBLIC_PATHS.full,
    t: "Full pack",
    d: "Concatenated markdown for agents. Not a separate Google URL.",
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
          Developers · API · CLI
        </p>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-semibold tracking-tight sm:text-5xl">
          Vesperer API and CLI for persistent AI personas.
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-[var(--muted)]">
          Create AI characters with stable identity, long-term memory and
          chat keys — from Cursor, Claude Code, or any agent that can call{" "}
          <code className="text-[var(--ink)]">/api/v1</code>. Native reasoning
          is the default; advanced personas can attach an external HTTP runtime
          without changing who they are.
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
            Install the agent skill
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
            Coding agents should fetch the live skill instead of guessing
            request shapes. Human walkthroughs stay on this page and{" "}
            <Link href="/integrations/claude" className="underline underline-offset-2">
              Claude vibecode
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
            Two API keys
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

        <section className="mt-14">
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold">
            FAQ
          </h2>
          <dl className="mt-6 space-y-6">
            {FAQS.map((faq) => (
              <div key={faq.q}>
                <dt className="font-medium">{faq.q}</dt>
                <dd className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
                  {faq.a}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      </main>
      <LegalFooter variant="marketing" />
    </div>
  );
}
