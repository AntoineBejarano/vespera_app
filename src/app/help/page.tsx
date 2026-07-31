import type { Metadata } from "next";
import Link from "next/link";
import { AppNav } from "@/components/AppNav";
import { LegalFooter } from "@/components/LegalFooter";
import { LEGAL_OPERATOR } from "@/lib/legal/constants";
import { breadcrumbJsonLd } from "@/lib/seo/breadcrumbs";
import { SITE_NAME, SITE_URL } from "@/lib/site";

const abuseEmail = LEGAL_OPERATOR.abuseEmail;
const legalEmail = LEGAL_OPERATOR.contactEmail;

export const metadata: Metadata = {
  title: "Help & FAQ",
  description:
    "Self-serve help for Vesperer: create characters, Telegram, Chat API, memory, export, and account deletion.",
  alternates: { canonical: `${SITE_URL}/help` },
};

const FAQ = [
  {
    q: "What is Vesperer?",
    a: "Vesperer lets you turn your business knowledge, voice, and rules into an AI that answers clients with memory — so each conversation continues instead of resetting.",
  },
  {
    q: "How do I get started?",
    a: "Sign up, pass the age gate, then create a persona under Personas. Define soul, style, rules, and context. Test in the admin chat before connecting a channel.",
  },
  {
    q: "What channels work today?",
    a: "Web (admin + public character links), Telegram bots (paste a BotFather token), Voice demos, and the Chat API with an X-Api-Key. WhatsApp and Discord are not available yet.",
  },
  {
    q: "How do I connect Telegram?",
    a: "Open a persona → Telegram section → paste the bot token from @BotFather. Vesperer sets the webhook. Each end-user gets isolated memory.",
  },
  {
    q: "How does the Chat API work?",
    a: "Each persona has a chat key (vesp_…). POST to /api/v1/chat with header X-Api-Key. See Docs.",
  },
  {
    q: "Can an AI agent create personas for me?",
    a: "Yes. Settings → create an account API key (vsk_…). Then use the CLI (npm run vesperer -- personas create) or POST /api/v1/personas. Full guide on /docs#cli.",
  },
  {
    q: "How many characters can I create?",
    a: "The free Starter plan allows 1 character. Paid Creator/Studio limits will apply when billing is enabled; until then you can use the free plan and export anytime.",
  },
  {
    q: "Can I import an existing character?",
    a: "Yes — Character Card, SillyTavern-style exports, JSON, or a prompt/description via Bring.",
  },
  {
    q: "How do I export or delete my data?",
    a: "Settings → Export data downloads a JSON archive. Delete account removes your app data and your Hexclave auth identity. This cannot be undone.",
  },
  {
    q: "Where do I report abuse?",
    a: `Use the Report abuse page or email ${abuseEmail}. Legal questions: ${legalEmail}.`,
  },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "FAQPage",
      mainEntity: FAQ.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: item.a },
      })),
    },
    breadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "Help", path: "/help" },
    ]),
  ],
};

export default function HelpPage() {
  return (
    <div className="relative min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <AppNav variant="marketing" />
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--accent)]">
          Help
        </p>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-semibold tracking-tight sm:text-5xl">
          Self-serve answers
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-[var(--muted)]">
          Everything you need to configure, deploy, and manage {SITE_NAME}{" "}
          without waiting on a human — except abuse and legal, which still go
          to email.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/docs"
            className="rounded-xl bg-[var(--accent)] px-5 py-3 text-sm font-medium text-[var(--accent-ink)]"
          >
            Chat API docs
          </Link>
          <Link
            href="/bring"
            className="rounded-xl border border-[var(--line)] px-5 py-3 text-sm"
          >
            Bring a character
          </Link>
          <Link
            href="/report"
            className="rounded-xl border border-[var(--line)] px-5 py-3 text-sm"
          >
            Report abuse
          </Link>
        </div>

        <div className="mt-12 space-y-4">
          {FAQ.map((item) => (
            <article
              key={item.q}
              className="rounded-2xl border border-[var(--line)] bg-[var(--bg-elevated)]/70 p-5"
            >
              <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold">
                {item.q}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
                {item.a}
              </p>
            </article>
          ))}
        </div>

        <section className="mt-14 rounded-2xl border border-[var(--line)] p-6">
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold">
            Still stuck?
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
            For safety or legal matters, email{" "}
            <a className="text-[var(--accent)]" href={`mailto:${legalEmail}`}>
              {legalEmail}
            </a>
            . Product questions: check Docs and Settings first — most flows are
            self-serve from Personas.
          </p>
        </section>
      </main>
      <LegalFooter variant="marketing" />
    </div>
  );
}
