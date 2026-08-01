"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useHexclaveApp, useUser } from "@hexclave/next";
import { AppNav } from "@/components/AppNav";
import { BrandLogo } from "@/components/BrandLogo";
import { LegalFooter } from "@/components/LegalFooter";
import {
  BlurFade,
  RetroGrid,
  ShimmerButton,
} from "@/components/magicui/effects";
import { VoiceLandingSection } from "@/components/VoiceLandingSection";
import type { VoiceAgentId } from "@/lib/voice/types";

const PROBLEMS = [
  {
    t: "Your knowledge stays trapped",
    d: "FAQs, playbooks, and product details live in docs and heads — customers still wait for a human who happens to be online.",
  },
  {
    t: "Every reply starts from zero",
    d: "Generic bots forget the last conversation. Clients repeat themselves. Trust erodes with every handoff.",
  },
  {
    t: "The relationship never compounds",
    d: "Without memory and a stable voice, you don’t get loyalty — just tickets, churn, and another forgettable chatbot.",
  },
];

const SOLUTIONS = [
  {
    t: "Teach it your business",
    d: "Encode how you sound, what you sell, what you never say, and the knowledge your best teammate would use on day one.",
  },
  {
    t: "Answer with full context",
    d: "Customers get replies grounded in your rules and memory — not a blank prompt that invents a personality each turn.",
  },
  {
    t: "Connections that stick",
    d: "Each person is remembered across sessions. That continuity is what turns support and sales into a living relationship.",
  },
  {
    t: "Same self where you already work",
    d: "Deploy on web, Telegram, voice, or your own app via API — one identity, peer-isolated memory per customer.",
  },
];

const CHANNELS = [
  { name: "Web", status: "live" },
  { name: "Telegram", status: "live" },
  { name: "Chat API", status: "live" },
  { name: "Voice", status: "live" },
  { name: "CLI", status: "live" },
];

const STEPS = [
  {
    n: "1",
    t: "Define the voice",
    d: "Soul, style, rules, and the knowledge your business needs customers to hear.",
  },
  {
    n: "2",
    t: "Test like a client",
    d: "Chat in the admin panel. Correct drift. Teach what must stay consistent.",
  },
  {
    n: "3",
    t: "Connect a channel",
    d: "Paste a Telegram bot token, publish a link, or call the chat API with an API key.",
  },
  {
    n: "4",
    t: "Let relationships grow",
    d: "Memory compounds per customer — so every return visit feels like continuity, not a reset.",
  },
];

const CATEGORIES = [
  {
    id: "companions",
    title: "Companions",
    body: "Characters built for connection, memory, and long-term relationships.",
    href: "/c/luna",
  },
  {
    id: "historical",
    title: "Historical minds",
    body: "Learn and debate with personalities inspired by history’s greatest thinkers.",
    href: "/c/einstein",
  },
  {
    id: "roleplay",
    title: "Roleplay & stories",
    body: "Build characters for worlds, adventures, and interactive fiction.",
    href: "/c/aiko",
  },
  {
    id: "mentors",
    title: "Mentors",
    body: "Coaches, tutors, and guides that understand their users over time.",
    href: "/c/stoic-mentor",
  },
];

const USE_CASES = [
  {
    t: "Customer support",
    d: "Answer product questions with your docs and policies — 24/7, in your tone.",
  },
  {
    t: "Sales & onboarding",
    d: "Guide prospects with the same pitch your team uses, then remember where they left off.",
  },
  {
    t: "Education & coaching",
    d: "Mentors and tutors that keep student progress and never lose the thread.",
  },
  {
    t: "Community & creators",
    d: "A stable personality for fans and members — same self on web and Telegram.",
  },
];

const COMPARE = [
  {
    ordinary: "Answers from a generic system prompt",
    vesperer: "Answers from your identity, rules, and knowledge",
  },
  {
    ordinary: "Forgets past conversations",
    vesperer: "Remembers each customer across sessions",
  },
  {
    ordinary: "Personality drifts every model update",
    vesperer: "Stable soul / style / rules layers",
  },
  {
    ordinary: "Locked to one chat widget",
    vesperer: "Web, Telegram, voice, or your API",
  },
];

const AUDIENCES = [
  {
    t: "Solo operators",
    d: "Put your expertise behind an AI that talks to clients while you focus on the work.",
  },
  {
    t: "Creators & teachers",
    d: "Characters and guides your audience returns to — same personality, lasting memory.",
  },
  {
    t: "Small teams",
    d: "One consistent voice across channels instead of five conflicting chatbot experiments.",
  },
];

const PRICING = [
  {
    name: "Starter",
    price: "Free",
    period: "",
    blurb: "One character. Learn the loop end to end.",
    features: [
      "1 character",
      "Long-term memory basics",
      "Private admin chat",
      "Bring an existing character",
      "Export identity & config",
    ],
    cta: "Start free",
    highlight: false,
  },
  {
    name: "Creator",
    price: "€20",
    period: "/mo",
    blurb: "Production character with channel deploy.",
    features: [
      "1 production character",
      "Persistent memory",
      "Telegram deploy",
      "Chat API key",
      "Export identity & config",
    ],
    cta: "Start creating",
    highlight: true,
  },
  {
    name: "Studio",
    price: "€59",
    period: "/mo",
    blurb: "A small roster for operators who need more than one voice.",
    features: [
      "Up to 3 characters",
      "Telegram + API per character",
      "Higher message limits",
      "Priority routing",
      "Export & ownership",
    ],
    cta: "Scale to Studio",
    highlight: false,
  },
];

function parseVoiceAgent(value: string | null): VoiceAgentId {
  if (value === "luna" || value === "einstein" || value === "stoic-mentor") {
    return value;
  }
  return "einstein";
}

/** Product-shaped hero visual — no AI face portraits. */
function LandingProductPreview() {
  return (
    <div className="relative w-full overflow-hidden border-t border-[var(--line)] bg-[var(--bg-elevated)]/80">
      <div className="mx-auto grid max-w-6xl lg:grid-cols-2">
        <div className="border-b border-[var(--line)] p-5 sm:p-7 lg:border-b-0 lg:border-r">
          <p className="text-[10px] uppercase tracking-[0.22em] text-[var(--muted)]">
            Your knowledge
          </p>
          <ul className="mt-4 space-y-2.5 text-sm">
            {[
              "Refund policy · 14 days, unused seats",
              "Pricing · Starter free, Creator €20/mo",
              "Tone · clear, warm, never pushy",
              "Never invent discounts or legal advice",
            ].map((line) => (
              <li
                key={line}
                className="rounded-lg border border-[var(--line)] bg-[var(--bg)] px-3 py-2.5 text-[var(--ink)]"
              >
                {line}
              </li>
            ))}
          </ul>
        </div>
        <div className="p-5 sm:p-7">
          <p className="text-[10px] uppercase tracking-[0.22em] text-[var(--muted)]">
            Customer conversation
          </p>
          <div className="mt-4 space-y-3 text-sm">
            <p className="ml-8 rounded-xl bg-[var(--accent-soft)] px-3 py-2.5 text-right text-[var(--ink)] sm:ml-16">
              Can I get a refund if I haven’t used my seats?
            </p>
            <p className="mr-4 rounded-xl border border-[var(--line)] bg-[var(--bg)] px-3 py-2.5 text-[var(--ink)] sm:mr-10">
              Yes — unused seats within 14 days. I’ll walk you through it the
              same way our team would.
            </p>
            <p className="ml-8 rounded-xl bg-[var(--accent-soft)] px-3 py-2.5 text-right text-[var(--ink)] sm:ml-16">
              Perfect. I asked last week about Creator vs Studio too.
            </p>
            <p className="mr-4 rounded-xl border border-[var(--line)] bg-[var(--bg)] px-3 py-2.5 text-[var(--ink)] sm:mr-10">
              I remember — you were deciding between one production character
              and a small roster. Want the same comparison again?
            </p>
          </div>
          <p className="mt-4 text-xs text-[var(--accent-2)]">
            Knowledge in. Continuity out. That’s the connection.
          </p>
        </div>
      </div>
    </div>
  );
}

export function LandingPage() {
  const app = useHexclaveApp();
  const user = useUser({ or: "return-null" });
  const search = useSearchParams();

  const voiceAgent = parseVoiceAgent(search.get("agent"));

  useEffect(() => {
    if (search.get("hexclave_cross_domain_auth")) return;

    if (user) {
      window.location.replace("/personas");
      return;
    }
    const auth = search.get("auth");
    if (auth === "signin") void app.redirectToSignIn();
    if (auth === "signup") void app.redirectToSignUp();
  }, [app, search, user]);

  useEffect(() => {
    if (user) return;
    const wantsVoice =
      search.has("agent") ||
      (typeof window !== "undefined" && window.location.hash === "#voice");
    if (!wantsVoice) return;
    const t = window.setTimeout(() => {
      document.getElementById("voice")?.scrollIntoView({ behavior: "smooth" });
    }, 80);
    return () => window.clearTimeout(t);
  }, [search, user]);

  return (
    <div className="relative overflow-hidden">
      <AppNav variant="marketing" />

      {/* Hero — one composition: brand, promise, CTA, product plane */}
      <section className="relative flex min-h-[92dvh] flex-col">
        <RetroGrid />
        <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-4 pb-10 pt-12 sm:px-6 sm:pb-14 sm:pt-16">
          <BlurFade>
            <BrandLogo href="/" size="hero" priority className="mb-8" />
          </BlurFade>
          <BlurFade delay={0.05}>
            <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--accent)] sm:text-xs sm:tracking-[0.35em]">
              AI that knows your business
            </p>
          </BlurFade>
          <BlurFade delay={0.1}>
            <h1 className="mt-3 max-w-3xl font-[family-name:var(--font-display)] text-[2.2rem] leading-[1.05] tracking-tight text-[var(--ink)] sm:text-5xl sm:leading-[1.05]">
              Answer every client with{" "}
              <span className="italic text-[var(--accent-2)]">
                all your knowledge
              </span>
              — and build the connection that keeps them.
            </h1>
          </BlurFade>
          <BlurFade delay={0.16}>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-[var(--muted)] sm:text-lg">
              Give Vesperer your voice, rules, and expertise. It replies to
              customers like a teammate who never forgets — so relationships
              compound instead of resetting every chat.
            </p>
          </BlurFade>
          <BlurFade
            delay={0.22}
            className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap"
          >
            <ShimmerButton
              className="w-full sm:w-auto"
              onClick={() => app.redirectToSignUp()}
            >
              Start answering clients
            </ShimmerButton>
              <Link
                href="/c/luna"
                className="inline-flex w-full items-center justify-center rounded-xl border border-[var(--line)] px-6 py-3.5 text-center sm:w-auto"
              >
                Try a companion demo
              </Link>
          </BlurFade>
          <p className="mt-4 text-xs text-[var(--muted)]">
            Free to start · Web, Telegram, voice & API · No sales call required
          </p>
        </div>
        <BlurFade delay={0.2} className="relative z-10">
          <LandingProductPreview />
        </BlurFade>
      </section>

      {/* Explore characters */}
      <section
        id="explore"
        className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24"
      >
        <BlurFade>
          <h2 className="font-[family-name:var(--font-display)] text-3xl font-semibold sm:text-4xl">
            Who do you want to bring to life?
          </h2>
          <p className="mt-3 max-w-2xl text-[var(--muted)]">
            Try a live demo — same identity and memory engine whether you build
            a companion, a mentor, or a voice for your business.
          </p>
        </BlurFade>
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {CATEGORIES.map((cat, i) => (
            <BlurFade key={cat.id} delay={i * 0.05}>
              <a
                href={cat.href}
                className="group flex h-full flex-col border-l-2 border-[var(--accent)]/50 pl-5 transition hover:border-[var(--accent)]"
              >
                <h3 className="font-[family-name:var(--font-display)] text-xl font-semibold group-hover:text-[var(--accent-2)]">
                  {cat.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
                  {cat.body}
                </p>
              </a>
            </BlurFade>
          ))}
        </div>
      </section>

      {/* Business use cases */}
      <section className="border-y border-[var(--line)] bg-[var(--bg-elevated)]/25 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <BlurFade>
            <h2 className="font-[family-name:var(--font-display)] text-3xl font-semibold sm:text-4xl">
              Where connections grow your business
            </h2>
            <p className="mt-3 max-w-2xl text-[var(--muted)]">
              Support, sales, teaching, community — the AI speaks with your
              knowledge and remembers each person.
            </p>
          </BlurFade>
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {USE_CASES.map((item, i) => (
              <BlurFade key={item.t} delay={i * 0.05}>
                <div className="h-full rounded-2xl border border-[var(--line)] p-5">
                  <h3 className="font-[family-name:var(--font-display)] text-xl font-semibold">
                    {item.t}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
                    {item.d}
                  </p>
                </div>
              </BlurFade>
            ))}
          </div>
        </div>
      </section>

      <VoiceLandingSection defaultAgent={voiceAgent} />

      {/* Problem */}
      <section className="border-y border-[var(--line)] bg-[var(--bg-elevated)]/35 py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <BlurFade>
            <h2 className="max-w-2xl font-[family-name:var(--font-display)] text-3xl font-semibold sm:text-4xl">
              Most business AIs fail the moment a real customer shows up.
            </h2>
            <p className="mt-4 max-w-2xl text-[var(--muted)]">
              They don’t carry your knowledge. They don’t remember the person.
              So they never become the connection your business runs on.
            </p>
          </BlurFade>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {PROBLEMS.map((p, i) => (
              <BlurFade key={p.t} delay={i * 0.07}>
                <div className="h-full border-l-2 border-[var(--accent)]/50 pl-4">
                  <h3 className="font-[family-name:var(--font-display)] text-2xl font-semibold">
                    {p.t}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
                    {p.d}
                  </p>
                </div>
              </BlurFade>
            ))}
          </div>
        </div>
      </section>

      {/* Solution */}
      <section
        id="features"
        className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24"
      >
        <BlurFade>
          <h2 className="font-[family-name:var(--font-display)] text-3xl font-semibold sm:text-4xl">
            Your knowledge in. Living connections out.
          </h2>
          <p className="mt-3 max-w-2xl text-[var(--muted)]">
            Identity, memory, and channels — so the AI answers like you would,
            and the relationship doesn’t die between sessions.
          </p>
        </BlurFade>
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {SOLUTIONS.map((s, i) => (
            <BlurFade key={s.t} delay={i * 0.06}>
              <div className="h-full rounded-2xl border border-[var(--line)] p-6">
                <h3 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-[var(--accent-2)]">
                  {s.t}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
                  {s.d}
                </p>
              </div>
            </BlurFade>
          ))}
        </div>
        <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-[var(--line)] pt-8">
          <p className="text-[10px] uppercase tracking-[0.22em] text-[var(--muted)]">
            Available now
          </p>
          {CHANNELS.map((channel) => (
            <span
              key={channel.name}
              className="text-sm text-[var(--ink)] opacity-80"
            >
              {channel.name}
            </span>
          ))}
        </div>
      </section>

      {/* Flow */}
      <section
        id="create"
        className="border-y border-[var(--line)] py-16 sm:py-24"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <BlurFade>
            <h2 className="font-[family-name:var(--font-display)] text-3xl font-semibold sm:text-4xl">
              From your expertise to a live channel in minutes.
            </h2>
            <p className="mt-3 max-w-2xl text-[var(--muted)]">
              No sales call. Configure, test, deploy — self-serve.
            </p>
          </BlurFade>
          <ol className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {STEPS.map((step, i) => (
              <BlurFade key={step.n} delay={i * 0.06}>
                <li className="h-full rounded-2xl border border-[var(--line)] bg-[var(--bg-elevated)]/60 p-5">
                  <span className="font-[family-name:var(--font-display)] text-3xl text-[var(--accent)]">
                    {step.n}
                  </span>
                  <h3 className="mt-3 font-[family-name:var(--font-display)] text-xl font-semibold">
                    {step.t}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
                    {step.d}
                  </p>
                </li>
              </BlurFade>
            ))}
          </ol>
          <BlurFade delay={0.2} className="mt-10">
            <ShimmerButton onClick={() => app.redirectToSignUp()}>
              Create your first character
            </ShimmerButton>
          </BlurFade>
        </div>
      </section>

      {/* CLI for AI agents */}
      <section
        id="cli"
        className="border-y border-[var(--line)] bg-[var(--bg-elevated)]/35 py-16 sm:py-24"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <BlurFade>
              <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--accent)]">
                Built for AI agents
              </p>
              <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-semibold sm:text-4xl">
                Let your AI create the persona.
              </h2>
              <p className="mt-4 max-w-xl text-[var(--muted)]">
                Give Cursor, Claude, or any agent an account API key. It can
                create personas with your knowledge layers — then hand you a
                chat key to put in front of customers. No click-ops.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/docs#cli"
                  className="inline-flex rounded-xl border border-[var(--line)] px-6 py-3.5 text-sm"
                >
                  CLI docs
                </Link>
                <Link
                  href="/settings"
                  className="inline-flex rounded-xl border border-[var(--line)] px-6 py-3.5 text-sm"
                >
                  Get an API key
                </Link>
              </div>
            </BlurFade>
            <BlurFade delay={0.08}>
              <pre className="overflow-x-auto rounded-2xl border border-[var(--line)] bg-[var(--bg)] p-5 text-xs leading-relaxed text-[var(--ink)] sm:text-sm">
{`npm run vesperer -- login --key vsk_…
npm run vesperer -- personas create --from persona.json

# persona.json
# soul / style / rules / context
# = your business knowledge`}
              </pre>
            </BlurFade>
          </div>
        </div>
      </section>

      {/* Bring */}
      <section
        id="bring"
        className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24"
      >
        <div className="grid gap-10 lg:grid-cols-[1fr_1fr] lg:items-center">
          <BlurFade>
            <h2 className="font-[family-name:var(--font-display)] text-3xl font-semibold sm:text-4xl">
              Already built the knowledge somewhere else?
            </h2>
            <p className="mt-4 max-w-xl text-[var(--muted)]">
              Import a Character Card, prompt, or SillyTavern export. Rebuild
              identity and memory without starting from a blank page.
            </p>
            <div className="mt-8">
              <Link
                href="/bring"
                className="inline-flex rounded-xl bg-[var(--accent)] px-6 py-3.5 font-medium text-[var(--accent-ink)]"
              >
                Bring my character
              </Link>
            </div>
          </BlurFade>
          <BlurFade delay={0.1}>
            <ul className="space-y-3">
              {[
                "Upload a Character Card",
                "Paste a character prompt",
                "Import JSON / SillyTavern",
                "Rebuild from a description",
              ].map((opt) => (
                <li
                  key={opt}
                  className="rounded-xl border border-[var(--line)] bg-[var(--bg-elevated)] px-4 py-3 text-sm"
                >
                  {opt}
                </li>
              ))}
            </ul>
          </BlurFade>
        </div>
      </section>

      {/* Compare */}
      <section className="border-y border-[var(--line)] bg-[var(--bg-elevated)]/35 py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <BlurFade>
            <h2 className="font-[family-name:var(--font-display)] text-3xl font-semibold sm:text-4xl">
              Not another generic chatbot.
            </h2>
          </BlurFade>
          <div className="mt-10 overflow-hidden rounded-2xl border border-[var(--line)]">
            <div className="grid grid-cols-2 bg-[var(--bg)] text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
              <div className="border-b border-r border-[var(--line)] px-4 py-3">
                Ordinary bot
              </div>
              <div className="border-b border-[var(--line)] px-4 py-3 text-[var(--accent)]">
                Vesperer
              </div>
            </div>
            {COMPARE.map((row) => (
              <div
                key={row.ordinary}
                className="grid grid-cols-2 text-sm text-[var(--ink)]"
              >
                <div className="border-b border-r border-[var(--line)] px-4 py-4 text-[var(--muted)]">
                  {row.ordinary}
                </div>
                <div className="border-b border-[var(--line)] px-4 py-4">
                  {row.vesperer}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Audiences */}
      <section
        id="creators"
        className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24"
      >
        <BlurFade>
          <h2 className="max-w-3xl font-[family-name:var(--font-display)] text-3xl font-semibold sm:text-4xl">
            Built for people who run the relationship themselves.
          </h2>
        </BlurFade>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {AUDIENCES.map((a, i) => (
            <BlurFade key={a.t} delay={i * 0.07}>
              <div className="h-full rounded-2xl border border-[var(--line)] bg-[var(--bg-elevated)]/70 p-6">
                <h3 className="font-[family-name:var(--font-display)] text-2xl font-semibold">
                  {a.t}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
                  {a.d}
                </p>
              </div>
            </BlurFade>
          ))}
        </div>
      </section>

      {/* Ownership */}
      <section
        id="ownership"
        className="border-y border-[var(--line)] py-16 sm:py-20"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <BlurFade>
            <h2 className="font-[family-name:var(--font-display)] text-3xl font-semibold sm:text-4xl">
              Your knowledge should belong to you.
            </h2>
            <p className="mt-4 max-w-2xl text-[var(--muted)]">
              Export identity, memories, and configuration anytime. Delete your
              account and data from Settings — including the auth identity —
              when you leave.
            </p>
            <div className="mt-6 flex flex-wrap gap-4">
              <Link
                href="/help"
                className="text-sm text-[var(--accent)] hover:underline"
              >
                Help & FAQ →
              </Link>
              <Link
                href="/docs"
                className="text-sm text-[var(--accent)] hover:underline"
              >
                API documentation →
              </Link>
            </div>
          </BlurFade>
        </div>
      </section>

      {/* Pricing — checkout not wired yet; CTAs go to signup */}
      <section
        id="pricing"
        className="bg-[var(--bg-elevated)]/35 py-16 sm:py-24"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <BlurFade>
            <h2 className="font-[family-name:var(--font-display)] text-3xl font-semibold sm:text-4xl">
              Pricing
            </h2>
            <p className="mt-3 text-[var(--muted)]">
              Start free. Paid plans unlock when billing goes live — signup
              works today.
            </p>
          </BlurFade>
          <div className="mt-12 grid gap-4 lg:grid-cols-3">
            {PRICING.map((tier, i) => (
              <BlurFade key={tier.name} delay={i * 0.08}>
                <div
                  className={
                    tier.highlight
                      ? "flex h-full flex-col rounded-2xl border border-[var(--accent)] bg-[var(--accent-soft)] p-6"
                      : "flex h-full flex-col rounded-2xl border border-[var(--line)] bg-[var(--bg)] p-6"
                  }
                >
                  <p className="text-xs uppercase tracking-[0.25em] text-[var(--muted)]">
                    {tier.name}
                  </p>
                  <p className="mt-4 font-[family-name:var(--font-display)] text-5xl">
                    {tier.price}
                    <span className="text-base text-[var(--muted)]">
                      {tier.period}
                    </span>
                  </p>
                  <p className="mt-3 text-sm text-[var(--muted)]">{tier.blurb}</p>
                  <ul className="mt-6 flex-1 space-y-2 text-sm text-[var(--ink)]">
                    {tier.features.map((f) => (
                      <li key={f}>· {f}</li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    className="mt-8 w-full rounded-xl bg-[var(--accent)] px-4 py-3 font-medium text-[var(--accent-ink)]"
                    onClick={() => app.redirectToSignUp()}
                  >
                    {tier.cta}
                  </button>
                </div>
              </BlurFade>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
        <BlurFade>
          <h2 className="max-w-3xl font-[family-name:var(--font-display)] text-3xl font-semibold leading-tight sm:text-5xl">
            Your knowledge.
            <span className="mt-3 block italic text-[var(--accent-2)]">
              Their conversation. A connection that lasts.
            </span>
          </h2>
          <p className="mt-5 max-w-xl text-[var(--muted)]">
            Put an AI on web, Telegram, voice, or your API that actually knows
            your business — and remembers every client.
          </p>
          <div className="mt-10">
            <ShimmerButton onClick={() => app.redirectToSignUp()}>
              Start answering clients
            </ShimmerButton>
          </div>
        </BlurFade>
      </section>

      <LegalFooter variant="marketing" />
    </div>
  );
}
