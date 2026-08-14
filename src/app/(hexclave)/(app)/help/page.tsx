import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/app-shell/PageHeader";
import { LEGAL_OPERATOR } from "@/lib/legal/constants";
import { SITE_NAME } from "@/lib/site";

const abuseEmail = LEGAL_OPERATOR.abuseEmail;
const legalEmail = LEGAL_OPERATOR.contactEmail;

export const metadata: Metadata = {
  title: "Help & FAQ",
  description: "Self-serve help for Vesperer studio: personas, Telegram, API, memory, export.",
  robots: { index: false, follow: false },
};

const FAQ = [
  {
    q: "What is Vesperer?",
    a: "Vesperer lets you turn your business knowledge, voice, and rules into an AI that answers clients with memory — so each conversation continues instead of resetting.",
  },
  {
    q: "How do I get started?",
    a: "Create a persona under Personas. Define soul, style, rules, and context. Test in Chat before connecting a channel.",
  },
  {
    q: "What channels work today?",
    a: "Web (studio + public character links), Telegram bots (paste a BotFather token), Voice demos, and the Chat API with an X-Api-Key. WhatsApp and Discord are not available yet.",
  },
  {
    q: "How do I connect Telegram?",
    a: "Open a persona → Agency / Telegram → paste the bot token from @BotFather. Vesperer sets the webhook. Each end-user gets isolated memory.",
  },
  {
    q: "How does the Chat API work?",
    a: "Each persona has a chat key (vesp_…). POST to /api/v1/chat with header X-Api-Key. See Docs.",
  },
  {
    q: "Can an AI agent create personas for me?",
    a: "Yes. Settings → create an account API key (vsk_…). Then use the CLI or /api/v1/*. Public skill: /skill. Walkthrough: /integrations/claude.",
  },
  {
    q: "How many characters can I create?",
    a: "The free Starter plan allows 1 character. Creator/Studio on vesperer.com bill via Stripe when configured. After Dark 18+ uses a separate adult payment rail — never Stripe.",
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

export default function HelpPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader
        title="Help & FAQ"
        description={`Self-serve answers for configuring and running ${SITE_NAME} — except abuse and legal, which go to email.`}
        actions={
          <Link
            href="/docs"
            className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground"
          >
            API & CLI docs
          </Link>
        }
      />

      <div className="flex flex-wrap gap-2">
        <Link
          href="/developers"
          className="rounded-lg border border-border px-3 py-1.5 text-sm"
        >
          Public docs
        </Link>
        <Link
          href="/docs"
          className="rounded-lg border border-border px-3 py-1.5 text-sm"
        >
          Docs
        </Link>
        <Link
          href="/personas"
          className="rounded-lg border border-border px-3 py-1.5 text-sm"
        >
          Personas
        </Link>
        <Link
          href="/report"
          className="rounded-lg border border-border px-3 py-1.5 text-sm"
        >
          Report abuse
        </Link>
      </div>

      <div className="space-y-3">
        {FAQ.map((item) => (
          <article
            key={item.q}
            className="rounded-xl border border-border px-4 py-4"
          >
            <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold">
              {item.q}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {item.a}
            </p>
          </article>
        ))}
      </div>

      <section className="rounded-xl border border-border p-5">
        <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold">
          Still stuck?
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          For safety or legal matters, email{" "}
          <a className="underline underline-offset-2" href={`mailto:${legalEmail}`}>
            {legalEmail}
          </a>
          . Product questions: check Docs and Settings first — most flows are
          self-serve from Personas.
        </p>
      </section>
    </div>
  );
}
