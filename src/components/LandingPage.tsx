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
import { LivePersonasLandingSection } from "@/components/LivePersonasLandingSection";
import { VoiceLandingSection } from "@/components/VoiceLandingSection";
import { AFTER_DARK_URL } from "@/lib/site";
import type { VoiceAgentId } from "@/lib/voice/types";

const PATHS = [
  {
    id: "fall",
    title: "Fall for one",
    body: "Private and fictional personalities that remember your story and grow closer over time.",
    cta: "Meet a companion",
    href: "/c/luna",
    afterDark: true,
  },
  {
    id: "learn",
    title: "Learn from one",
    body: "Tutors, mentors and historical minds that remember your progress, questions and ideas.",
    cta: "Start learning",
    href: "/explore?filter=learn",
  },
  {
    id: "hire",
    title: "Hire one",
    body: "Receptionists, sales agents and support specialists that know your offer and remember every returning person.",
    cta: "Build an AI employee",
    href: "/explore?filter=hire",
  },
  {
    id: "create",
    title: "Create one",
    body: "Turn an idea, story, artwork or existing character into a personality people can return to.",
    cta: "Create a persona",
    href: "/create/ai-character",
  },
];

const RELATIONSHIP_EVOLUTION = [
  {
    name: "Luna",
    label: "Your connection",
    rows: [
      ["Familiarity", "Growing"],
      ["Trust", "High"],
      ["Shared memories", "24"],
    ],
    change:
      "Luna has become more open after your recent conversations.",
  },
  {
    name: "Socrates",
    label: "Your dialogue",
    rows: [
      ["Topics explored", "Justice, virtue and knowledge"],
      ["Current disagreement", "Whether virtue can be taught"],
      ["Shared conversations", "11"],
    ],
    change: "Socrates now presses your definitions more sharply.",
  },
  {
    name: "AI Receptionist",
    label: "Customer relationship",
    rows: [
      ["Returning customer", "Yes"],
      ["Preferred channel", "Voice"],
      ["Usual booking", "Friday afternoon"],
      ["Open request", "Invoice correction"],
    ],
    change:
      "The conversation continues without asking the customer to repeat everything.",
  },
];

const VALUE_BLOCKS = [
  {
    t: "Identity",
    d: "A consistent personality, voice, history, values and boundaries.",
  },
  {
    t: "Memory",
    d: "Important facts, conversations and moments remain available over time.",
  },
  {
    t: "Relationships",
    d: "Every person develops a separate history with the same persona.",
  },
  {
    t: "Live knowledge",
    d: "Connect approved sources so the persona stays current — with attribution, temporal memory and reviewed identity updates.",
  },
  {
    t: "Abilities",
    d: "Let it teach, search, book appointments, support people, sell or interact with other software.",
  },
];

const PROBLEMS = [
  {
    t: "They forget you",
    d: "Important conversations disappear and every session starts again.",
  },
  {
    t: "They lose themselves",
    d: "Tone, personality and behaviour drift over time or between models.",
  },
  {
    t: "They cannot build a relationship",
    d: "Without memory and continuity, interactions remain transactional and forgettable.",
  },
  {
    t: "They stay trapped",
    d: "The identity cannot easily continue across platforms, models or channels.",
  },
];

const STEPS = [
  {
    n: "1",
    t: "Describe them",
    d: "Explain who they are, how they speak and what makes them unique.",
  },
  {
    n: "2",
    t: "Connect their sources",
    d: "Add documents, archives, feeds or approved public sources. Live Personas keep knowledge fresh without erasing core identity.",
  },
  {
    n: "3",
    t: "Talk and improve",
    d: "Test conversations, correct inconsistencies and decide what must remain stable.",
  },
  {
    n: "4",
    t: "Share or deploy",
    d: "Publish a page, connect Telegram, enable voice or use the API.",
  },
];

const BRING_OPTIONS = [
  "Upload a Character Card",
  "Paste a character prompt",
  "Import JSON or SillyTavern",
  "Rebuild from a description",
];

const HISTORY_EXAMPLES = [
  "Socrates",
  "Einstein",
  "Marie Curie",
  "Leonardo da Vinci",
  "A museum guide",
  "A fictionalised historical narrator",
];

const CREATOR_BENEFITS = [
  "One identity",
  "Thousands of separate relationships",
  "Live Persona sources that stay current",
  "Private or public characters",
  "Chat and voice",
  "Audience analytics",
  "Human handoff when required",
];

const OWNERSHIP = [
  "Export your persona",
  "Control its knowledge",
  "Delete your data",
  "Choose where it runs",
  "Avoid permanent lock-in",
];

const HERO_PERSONAS = [
  { name: "Luna", role: "Virtual Companion", href: "/c/luna" },
  { name: "Socrates", role: "Historical Mind", href: "/meet/socrates" },
  { name: "Aria", role: "AI Receptionist", href: "/hire/ai-receptionist" },
  { name: "Kai", role: "Personal Mentor", href: "/learn/stoic-mentor" },
];

const PRICING = [
  {
    name: "Starter",
    price: "Free",
    period: "",
    blurb: "Create and test your first persona.",
    features: [
      "1 persona",
      "Basic long-term memory",
      "Private testing",
      "Bring an existing character",
      "Export identity and configuration",
    ],
    cta: "Start free",
    highlight: false,
    action: "signup" as const,
  },
  {
    name: "Creator",
    price: "€20",
    period: "/mo",
    blurb: "Publish a production persona and connect it to your audience.",
    features: [
      "1 production persona",
      "Persistent memory",
      "Telegram deployment",
      "Chat API",
      "Export and ownership",
    ],
    cta: "Start creating",
    highlight: true,
    action: "signup" as const,
  },
  {
    name: "Studio",
    price: "€59",
    period: "/mo",
    blurb: "Manage a small roster of personas.",
    features: [
      "Up to 3 personas",
      "Telegram and API per persona",
      "Higher usage limits",
      "Priority routing",
      "Export and ownership",
    ],
    cta: "Scale to Studio",
    highlight: false,
    action: "signup" as const,
  },
  {
    name: "Business & Institutions",
    price: "Custom",
    period: "",
    blurb:
      "Workspaces, API access and operational control for teams, agencies and platforms.",
    features: [
      "Custom personas at scale",
      "Workspaces and team access",
      "API, Telegram and voice",
      "Human handoff and ownership",
      "Design-partner onboarding",
    ],
    cta: "Explore Business",
    highlight: false,
    action: "business" as const,
  },
];

function parseVoiceAgent(value: string | null): VoiceAgentId {
  if (value === "luna" || value === "einstein" || value === "stoic-mentor") {
    return value;
  }
  return "einstein";
}

/** Hero visual — personas + memory continuity, not a support script. */
function LandingProductPreview() {
  return (
    <div className="relative w-full overflow-hidden border-t border-[var(--line)] bg-[var(--bg-elevated)]/80">
      <div className="mx-auto grid max-w-6xl lg:grid-cols-2">
        <div className="border-b border-[var(--line)] p-5 sm:p-7 lg:border-b-0 lg:border-r">
          <p className="text-[10px] uppercase tracking-[0.22em] text-[var(--muted)]">
            Meet a persona
          </p>
          <ul className="mt-4 space-y-2.5 text-sm">
            {HERO_PERSONAS.map((p) => (
              <li key={p.name}>
                <a
                  href={p.href}
                  className="flex items-baseline justify-between gap-3 rounded-lg border border-[var(--line)] bg-[var(--bg)] px-3 py-2.5 text-[var(--ink)] transition hover:border-[var(--accent)]/50"
                >
                  <span className="font-medium">{p.name}</span>
                  <span className="text-xs text-[var(--muted)]">{p.role}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div className="p-5 sm:p-7">
          <p className="text-[10px] uppercase tracking-[0.22em] text-[var(--muted)]">
            A conversation that continues
          </p>
          <div className="mt-4 space-y-3 text-sm">
            <p className="ml-8 rounded-xl bg-[var(--accent-soft)] px-3 py-2.5 text-right text-[var(--ink)] sm:ml-16">
              I have the interview tomorrow.
            </p>
            <p className="mr-4 rounded-xl border border-[var(--line)] bg-[var(--bg)] px-3 py-2.5 text-[var(--ink)] sm:mr-10">
              I remember. Last time you said the technical round worried you
              most. Do you want to practise that part again?
            </p>
          </div>
          <p className="mt-4 text-xs text-[var(--accent-2)]">
            Memory recalled: Interview · Technical round · Tomorrow
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
      window.location.replace("/auth/continue");
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

      {/* Hero */}
      <section className="relative flex min-h-[92dvh] flex-col">
        <RetroGrid />
        <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-4 pb-10 pt-12 sm:px-6 sm:pb-14 sm:pt-16">
          <BlurFade>
            <BrandLogo href="/" size="hero" priority className="mb-8" />
          </BlurFade>
          <BlurFade delay={0.05}>
            <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--accent)] sm:text-xs sm:tracking-[0.35em]">
              They remember. They change. They stay consistent.
            </p>
          </BlurFade>
          <BlurFade delay={0.1}>
            <h1 className="mt-3 max-w-3xl font-[family-name:var(--font-display)] text-[2.4rem] leading-[1.05] tracking-tight text-[var(--ink)] sm:text-5xl sm:leading-[1.05]">
              Meet someone{" "}
              <span className="italic text-[var(--accent-2)]">impossible</span>.
            </h1>
          </BlurFade>
          <BlurFade delay={0.16}>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-[var(--muted)] sm:text-lg">
              They remember what others forget. Not another chatbot — someone who
              stays. Talk to history, fall for an original character, learn from a
              mentor, or build a personality that becomes more real every time
              you talk.
            </p>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--muted)] sm:text-base">
              Every Vesperer persona has a soul, feelings, long-term memory and
              a voice — a stable identity and evolving relationships across chat
              and speech.
            </p>
          </BlurFade>
          <BlurFade
            delay={0.22}
            className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap"
          >
            <ShimmerButton
              className="w-full sm:w-auto"
              onClick={() => {
                window.location.href = "/explore";
              }}
            >
              Meet a persona
            </ShimmerButton>
            <button
              type="button"
              onClick={() => app.redirectToSignUp()}
              className="inline-flex w-full items-center justify-center rounded-xl border border-[var(--line)] px-6 py-3.5 text-center sm:w-auto"
            >
              Create your own
            </button>
          </BlurFade>
          <p className="mt-4 text-xs text-[var(--muted)]">
            Free to start · No code required · Export anytime
          </p>
          <p className="mt-3 text-xs text-[var(--muted)]">
            Building for a team or platform?{" "}
            <Link
              href="/business"
              className="text-[var(--ink)] underline-offset-2 hover:underline"
            >
              Explore Vesperer for Business
            </Link>
            .
          </p>
        </div>
        <BlurFade delay={0.2} className="relative z-10">
          <LandingProductPreview />
        </BlurFade>
      </section>

      {/* Fall for / Learn / Hire / Create */}
      <section
        id="explore"
        className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24"
      >
        <BlurFade>
          <h2 className="font-[family-name:var(--font-display)] text-3xl font-semibold sm:text-4xl">
            Fall for one. Learn from one. Hire one. Create one.
          </h2>
          <p className="mt-3 max-w-2xl text-[var(--muted)]">
            The same technology can become a companion, a teacher, a historical
            mind, a creator persona or an AI employee.
          </p>
        </BlurFade>
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {PATHS.map((path, i) => (
            <BlurFade key={path.id} delay={i * 0.05}>
              <div className="flex h-full flex-col border-l-2 border-[var(--accent)]/50 pl-5">
                <h3 className="font-[family-name:var(--font-display)] text-xl font-semibold">
                  {path.title}
                </h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-[var(--muted)]">
                  {path.body}
                </p>
                {path.afterDark ? (
                  <p className="mt-3 text-xs text-[var(--muted)]/80">
                    Looking for private 18+ experiences?{" "}
                    <a
                      href={AFTER_DARK_URL}
                      className="underline decoration-[var(--line)] underline-offset-2 hover:text-[var(--ink)]"
                    >
                      Visit After Dark
                    </a>
                    .
                  </p>
                ) : null}
                <a
                  href={path.href}
                  className="mt-4 inline-flex text-sm text-[var(--accent)] hover:underline"
                >
                  {path.cta} →
                </a>
              </div>
            </BlurFade>
          ))}
        </div>
      </section>

      {/* Differential — relationship evolution */}
      <section className="border-y border-[var(--line)] bg-[var(--bg-elevated)]/25 py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <BlurFade>
            <h2 className="font-[family-name:var(--font-display)] text-3xl font-semibold sm:text-4xl">
              Every conversation changes the relationship.
            </h2>
            <p className="mt-4 max-w-2xl text-[var(--muted)]">
              A normal chatbot remembers the question. A Vesperer persona
              remembers who it is, who you are and what has happened between
              you.
            </p>
          </BlurFade>
          <div className="mt-10 grid gap-4 lg:grid-cols-3">
            {RELATIONSHIP_EVOLUTION.map((card, i) => (
              <BlurFade key={card.name} delay={i * 0.06}>
                <div className="flex h-full flex-col rounded-2xl border border-[var(--line)] bg-[var(--bg)] p-5">
                  <p className="font-[family-name:var(--font-display)] text-xl font-semibold">
                    {card.name}
                  </p>
                  <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-[var(--muted)]">
                    {card.label}
                  </p>
                  <dl className="mt-4 flex-1 space-y-2 text-sm">
                    {card.rows.map(([k, v]) => (
                      <div
                        key={k}
                        className="flex justify-between gap-3 border-b border-[var(--line)]/60 pb-2"
                      >
                        <dt className="text-[var(--muted)]">{k}</dt>
                        <dd className="text-right text-[var(--ink)]">{v}</dd>
                      </div>
                    ))}
                  </dl>
                  <p className="mt-4 text-xs leading-relaxed text-[var(--accent-2)]">
                    Recent change: {card.change}
                  </p>
                </div>
              </BlurFade>
            ))}
          </div>
        </div>
      </section>

      {/* Central value */}
      <section
        id="features"
        className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24"
      >
        <BlurFade>
          <h2 className="font-[family-name:var(--font-display)] text-3xl font-semibold sm:text-4xl">
            Everything that makes an AI feel like the same person.
          </h2>
        </BlurFade>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {VALUE_BLOCKS.map((s, i) => (
            <BlurFade key={s.t} delay={i * 0.05}>
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
      </section>

      <VoiceLandingSection defaultAgent={voiceAgent} />

      <LivePersonasLandingSection />

      {/* Problem */}
      <section className="border-y border-[var(--line)] bg-[var(--bg-elevated)]/35 py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <BlurFade>
            <h2 className="max-w-2xl font-[family-name:var(--font-display)] text-3xl font-semibold sm:text-4xl">
              Most AI gives answers. Vesperer creates continuity.
            </h2>
          </BlurFade>
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {PROBLEMS.map((p, i) => (
              <BlurFade key={p.t} delay={i * 0.06}>
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

      {/* Create */}
      <section
        id="create"
        className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24"
      >
        <BlurFade>
          <h2 className="font-[family-name:var(--font-display)] text-3xl font-semibold sm:text-4xl">
            Create anyone you can imagine.
          </h2>
          <p className="mt-3 max-w-2xl text-[var(--muted)]">
            Start from a simple description, shape the personality through
            conversation or bring a character you already created.
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
            Create your first persona
          </ShimmerButton>
        </BlurFade>
      </section>

      {/* Bring */}
      <section
        id="bring"
        className="border-y border-[var(--line)] py-16 sm:py-24"
      >
        <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-[1fr_1fr] lg:items-center">
          <BlurFade>
            <h2 className="font-[family-name:var(--font-display)] text-3xl font-semibold sm:text-4xl">
              Already created a character somewhere else?
            </h2>
            <p className="mt-4 max-w-xl text-[var(--muted)]">
              Bring a Character Card, prompt, JSON file, SillyTavern export or
              your own conversation history. Preserve what made the character
              special without starting from zero.
            </p>
            <div className="mt-8">
              <Link
                href="/bring"
                className="inline-flex rounded-xl bg-[var(--accent)] px-6 py-3.5 font-medium text-[var(--accent-ink)]"
              >
                Bring my character
              </Link>
            </div>
            <p className="mt-4 text-xs text-[var(--muted)]">
              Only import characters and content you created or have permission
              to use.
            </p>
          </BlurFade>
          <BlurFade delay={0.1}>
            <ul className="space-y-3">
              {BRING_OPTIONS.map((opt) => (
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

      {/* Business teaser — full detail lives on /business */}
      <section
        id="business"
        className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24"
      >
        <BlurFade>
          <h2 className="font-[family-name:var(--font-display)] text-3xl font-semibold sm:text-4xl">
            Give your organisation someone people remember.
          </h2>
          <p className="mt-4 max-w-2xl text-[var(--muted)]">
            Other agents remember the task. Vesperer remembers the person —
            across chat, voice and every returning conversation.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/business"
              className="inline-flex rounded-xl bg-[var(--accent)] px-6 py-3.5 text-sm font-medium text-[var(--accent-ink)]"
            >
              Explore Vesperer for Business
            </Link>
            <Link
              href="/explore?filter=hire"
              className="inline-flex rounded-xl border border-[var(--line)] px-6 py-3.5 text-sm"
            >
              Meet AI employees
            </Link>
          </div>
        </BlurFade>
      </section>

      {/* History / education / museums */}
      <section
        id="history"
        className="border-y border-[var(--line)] bg-[var(--bg-elevated)]/25 py-16 sm:py-24"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <BlurFade>
            <h2 className="font-[family-name:var(--font-display)] text-3xl font-semibold sm:text-4xl">
              Let history answer back.
            </h2>
            <p className="mt-4 max-w-2xl text-[var(--muted)]">
              Turn archives, collections and historical research into
              interactive personalities visitors and students can question
              through text or voice. With Live Personas, scholarship updates
              can refresh knowledge without rewriting who the figure was.
            </p>
          </BlurFade>
          <div className="mt-8 flex flex-wrap gap-2">
            {HISTORY_EXAMPLES.map((name) => (
              <span
                key={name}
                className="rounded-xl border border-[var(--line)] px-3 py-1.5 text-sm text-[var(--ink)]"
              >
                {name}
              </span>
            ))}
          </div>
          <p className="mt-6 max-w-2xl text-xs leading-relaxed text-[var(--muted)]">
            Historical and public-figure personas are AI interpretations based
            on available sources — not the real individuals, and not official
            accounts.
          </p>
          <BlurFade delay={0.1} className="mt-8">
            <button
              type="button"
              className="rounded-xl border border-[var(--line)] px-6 py-3.5 text-sm"
              onClick={() => app.redirectToSignUp()}
            >
              Create an institutional persona
            </button>
          </BlurFade>
        </div>
      </section>

      {/* Creators */}
      <section
        id="creators"
        className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24"
      >
        <BlurFade>
          <h2 className="font-[family-name:var(--font-display)] text-3xl font-semibold sm:text-4xl">
            Create a personality your audience can return to.
          </h2>
          <p className="mt-4 max-w-2xl text-[var(--muted)]">
            Give every fan a personal conversation while keeping one consistent
            identity, voice and creative world.
          </p>
        </BlurFade>
        <ul className="mt-8 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {CREATOR_BENEFITS.map((b) => (
            <li
              key={b}
              className="rounded-xl border border-[var(--line)] px-4 py-3 text-sm"
            >
              · {b}
            </li>
          ))}
        </ul>
        <BlurFade delay={0.1} className="mt-8">
          <ShimmerButton onClick={() => app.redirectToSignUp()}>
            Build for your audience
          </ShimmerButton>
        </BlurFade>
      </section>

      {/* Ownership */}
      <section
        id="ownership"
        className="border-y border-[var(--line)] py-16 sm:py-20"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <BlurFade>
            <h2 className="font-[family-name:var(--font-display)] text-3xl font-semibold sm:text-4xl">
              Your persona should belong to you.
            </h2>
            <p className="mt-4 max-w-2xl text-[var(--muted)]">
              Export its identity and configuration, preserve its history and
              move between supported models and channels without rebuilding from
              zero.
            </p>
            <ul className="mt-8 flex flex-wrap gap-3">
              {OWNERSHIP.map((item) => (
                <li
                  key={item}
                  className="rounded-xl border border-[var(--line)] px-4 py-2.5 text-sm"
                >
                  {item}
                </li>
              ))}
            </ul>
          </BlurFade>
        </div>
      </section>

      {/* CLI for AI agents — keep near the end, but prominent */}
      <section
        id="cli"
        className="scroll-mt-24 border-y border-[var(--line)] bg-[var(--bg-elevated)]/35 py-16 sm:py-24"
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
                create personas with identity and memory layers — then hand you
                a chat key to put in front of users. Dashboard, CLI, or API —
                no click-ops required.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/integrations/claude"
                  className="inline-flex rounded-xl bg-[var(--accent)] px-6 py-3.5 text-sm font-medium text-[var(--accent-ink)]"
                >
                  Vibecode with Claude
                </Link>
                <Link
                  href="/docs#cli"
                  className="inline-flex rounded-xl border border-[var(--line)] px-6 py-3.5 text-sm"
                >
                  CLI docs
                </Link>
                <Link
                  href="/docs"
                  className="inline-flex rounded-xl border border-[var(--line)] px-6 py-3.5 text-sm"
                >
                  API documentation
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
# = identity + memory that persists`}
              </pre>
            </BlurFade>
          </div>
        </div>
      </section>

      {/* Pricing */}
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
          <div className="mt-12 grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
            {PRICING.map((tier, i) => (
              <BlurFade key={tier.name} delay={i * 0.06}>
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
                  <p className="mt-4 font-[family-name:var(--font-display)] text-4xl sm:text-5xl">
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
                  {tier.action === "business" ? (
                    <Link
                      href="/business"
                      className="mt-8 block w-full rounded-xl border border-[var(--line)] px-4 py-3 text-center font-medium text-[var(--ink)]"
                    >
                      {tier.cta}
                    </Link>
                  ) : (
                    <button
                      type="button"
                      className="mt-8 w-full rounded-xl bg-[var(--accent)] px-4 py-3 font-medium text-[var(--accent-ink)]"
                      onClick={() => app.redirectToSignUp()}
                    >
                      {tier.cta}
                    </button>
                  )}
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
            Meet one. Create one.{" "}
            <span className="italic text-[var(--accent-2)]">
              Let the relationship grow.
            </span>
          </h2>
          <p className="mt-5 max-w-xl text-[var(--muted)]">
            Build a digital personality that remembers, evolves and can become a
            companion, mentor, historical mind, creator or AI employee.
          </p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <ShimmerButton
              onClick={() => {
                window.location.href = "/explore";
              }}
            >
              Meet a persona
            </ShimmerButton>
            <button
              type="button"
              onClick={() => app.redirectToSignUp()}
              className="inline-flex items-center justify-center rounded-xl border border-[var(--line)] px-6 py-3.5"
            >
              Create your own
            </button>
          </div>
        </BlurFade>
      </section>

      <LegalFooter variant="marketing" />
    </div>
  );
}
