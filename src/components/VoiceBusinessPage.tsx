"use client";

import Link from "next/link";
import { AppNav } from "@/components/AppNav";
import { LegalFooter } from "@/components/LegalFooter";
import { VoiceAgentWidget } from "@/components/VoiceAgentWidget";
import { BlurFade, ShimmerButton } from "@/components/magicui/effects";
import { useHexclaveApp } from "@hexclave/next";

const PILLARS = [
  {
    tag: "Characters",
    t: "Persistent characters, not disposable scripts.",
    d: "One identity survives every session. Personality, boundaries, and voice stay stable — so fans and users meet the same person tomorrow.",
  },
  {
    tag: "Relationships",
    t: "A different relationship with every user.",
    d: "The same character can be mentor to one person and companion to another. Memory and tone evolve per peer, not as a shared global chat.",
  },
  {
    tag: "Continuity",
    t: "Chat and voice share one memory.",
    d: "Say it in text, continue by voice. Switch Telegram, web, or a phone line — the relationship does not reset at the channel boundary.",
  },
  {
    tag: "Emotion",
    t: "Emotional memory that compounds.",
    d: "Preferences, promises, moods, and unfinished threads stick. The character recalls how things felt, not only what was typed.",
  },
  {
    tag: "Studio",
    t: "Creator studios that ship versions.",
    d: "Publish characters, fork variants, A/B openings, and restore a prior version when a release drifts. Built for multi-character catalogs.",
  },
  {
    tag: "Business",
    t: "Engagement, handoff, and premium.",
    d: "See what keeps people talking, escalate to a human operator with full context, and gate deeper access behind premium — without losing the relationship.",
  },
];

const USE_CASES = [
  {
    t: "Persistent character lines",
    d: "Ship companions, mentors, and brand personas that fans return to for months — same voice, same continuity, no amnesia between visits.",
  },
  {
    t: "Per-user relationships",
    d: "One character, many bonds. Each user gets a private memory lane so intimacy and trust grow independently.",
  },
  {
    t: "Chat ↔ voice continuity",
    d: "Start in chat, pick up by voice (or the reverse). Unified memory means nobody repeats their name, goals, or last chapter.",
  },
  {
    t: "Emotional memory loops",
    d: "Track what mattered emotionally — celebrations, fears, boundaries — and bring them back naturally in later turns.",
  },
  {
    t: "Creator studios",
    d: "Studios and creators manage a roster: publish, import cards, tune style, and keep ownership of the character layer.",
  },
  {
    t: "Multi-character worlds",
    d: "Run several characters side by side — each with its own identity, memory rules, and relationship graph.",
  },
  {
    t: "Variants & versions",
    d: "Ship soft launches, seasonal variants, and rollbacks. Version the character the way you version a product.",
  },
  {
    t: "Engagement analytics",
    d: "Measure return rate, depth, voice vs chat mix, and which memories drive retention — then improve the character, not just the prompt.",
  },
  {
    t: "Operator handoff",
    d: "When the moment needs a human, escalate with the full relationship attached so ops never cold-start the conversation.",
  },
  {
    t: "Premium monetization",
    d: "Unlock longer memory, exclusive variants, voice minutes, or private lines — paid access that deepens the bond instead of breaking it.",
  },
];

const FAQ = [
  {
    q: "What is Vesperer Voice?",
    a: "Vesperer Voice is the spoken surface of the Vesperer character layer: persistent identities, per-user relationships, emotional memory, and continuity across chat and voice — for creators, studios, and products that need characters people never forget.",
  },
  {
    q: "Is Bland AI a competitor?",
    a: "Not necessarily. Bland is strong phone infrastructure (dialing, telephony, call routing). Vesperer is the character and memory layer on top. You can use Bland (or similar) as an initial dependency for phone rails while Vesperer owns identity, relationships, versions, analytics, handoff, and monetization.",
  },
  {
    q: "Does memory work across chat and voice?",
    a: "Yes. Facts, preferences, promises, and emotional context persist for the same peer across web chat, voice demos, Telegram, and APIs — so the relationship is channel-agnostic.",
  },
  {
    q: "Can creators run multiple characters and versions?",
    a: "Yes. Creator studios can publish multiple characters, fork variants, and restore prior versions when a release drifts — without rebuilding memory from scratch.",
  },
  {
    q: "How do engagement analytics and operator handoff work?",
    a: "Conversation history and remembered state stay inspectable. Ops can see what the character knew, measure engagement, and hand complex moments to a human with full context attached.",
  },
  {
    q: "How does premium monetization fit?",
    a: "Gate deeper memory, exclusive variants, voice access, or private lines behind premium — while keeping the same persistent character so paying users deepen a relationship they already trust.",
  },
];

const TIMELINE = [
  { day: "Day 01", t: "Characters + relationships", d: "Define identities, memory rules, and who each user is to the character." },
  { day: "Day 07", t: "Chat + voice continuity", d: "Wire unified memory across text and speak; prove no reset on channel switch." },
  { day: "Day 14", t: "Studio + versions", d: "Multi-character roster, variants, and rollback paths for creators." },
  { day: "Day 21", t: "Analytics + handoff", d: "Engagement signals live; operators can take over with full context." },
  { day: "Day 30", t: "Premium live", d: "Monetize depth — memory, voice, exclusives — without breaking the bond." },
];

export function VoiceBusinessPage() {
  const app = useHexclaveApp();

  return (
    <div className="relative min-h-screen overflow-hidden">
      <AppNav variant="marketing" />

      <section className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-20">
        <BlurFade>
          <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--accent)]">
            Vesperer Voice · Character layer
          </p>
          <h1 className="mt-4 font-[family-name:var(--font-display)] text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
            Characters that speak — and never forget who you are.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-[var(--muted)]">
            The voice surface for persistent characters, per-user relationships,
            emotional memory, and chat↔voice continuity. Telephony rails like
            Bland can sit underneath; the character layer is Vesperer.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ShimmerButton onClick={() => app.redirectToSignUp()}>
              Build a character
            </ShimmerButton>
            <a
              href="#demo"
              className="rounded-xl border border-[var(--line)] px-5 py-3.5 text-sm"
            >
              Click to speak with a character
            </a>
          </div>
          <p className="mt-6 text-sm text-[var(--muted)]">
            <span className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
              One memory
            </span>{" "}
            across chat, voice, and channels.
          </p>
        </BlurFade>

        <div id="demo" className="scroll-mt-24">
          <BlurFade delay={0.1}>
            <VoiceAgentWidget />
          </BlurFade>
        </div>
      </section>

      <section className="border-y border-[var(--line)] py-10">
        <div className="mx-auto max-w-6xl px-4 text-center sm:px-6">
          <p className="text-sm uppercase tracking-[0.22em] text-[var(--muted)]">
            Built for creators, studios, and products that ship characters
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-[var(--ink)]">
            {[
              "Companions",
              "Creator studios",
              "Mentors",
              "Brand personas",
              "Premium lines",
            ].map((label) => (
              <span key={label} className="opacity-80">
                {label}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <BlurFade>
          <h2 className="font-[family-name:var(--font-display)] text-3xl font-semibold sm:text-5xl">
            One character layer.{" "}
            <span className="text-[var(--accent-2)]">Every channel.</span>
          </h2>
          <p className="mt-4 max-w-2xl text-[var(--muted)]">
            Optimize for lasting relationships — not disposable phone scripts.
            Identity, memory, versions, and monetization stay in Vesperer
            whether the audio runs in-browser or over a phone stack.
          </p>
        </BlurFade>
        <div className="mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {PILLARS.map((p, i) => (
            <BlurFade key={p.t} delay={i * 0.05}>
              <article className="h-full rounded-2xl border border-[var(--line)] bg-[var(--bg-elevated)]/60 p-5">
                <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--accent)]">
                  {p.tag}
                </p>
                <h3 className="mt-3 font-[family-name:var(--font-display)] text-xl font-semibold">
                  {p.t}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
                  {p.d}
                </p>
              </article>
            </BlurFade>
          ))}
        </div>
      </section>

      <section className="border-y border-[var(--line)] bg-[var(--bg-elevated)]/35 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="max-w-3xl font-[family-name:var(--font-display)] text-3xl font-semibold sm:text-5xl">
            Continuity so tight you forget which channel you started on.
          </h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            <div className="rounded-2xl border border-[var(--accent)]/40 bg-[var(--accent-soft)] p-6">
              <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--accent-2)]">
                Vesperer character layer
              </p>
              <p className="mt-3 font-[family-name:var(--font-display)] text-4xl sm:text-5xl">
                Chat + voice
              </p>
              <p className="mt-2 text-sm text-[var(--muted)]">
                Same peer memory, emotional state, and relationship — whether
                they type or speak.
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--line)] p-6">
              <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--muted)]">
                Phone-only stacks alone
              </p>
              <p className="mt-3 font-[family-name:var(--font-display)] text-4xl sm:text-5xl text-[var(--muted)]">
                Call silos
              </p>
              <p className="mt-2 text-sm text-[var(--muted)]">
                Great for dialing. Weak for lasting characters, variants, and
                creator monetization unless you own the layer above.
              </p>
            </div>
          </div>
          <p className="mt-4 text-xs text-[var(--muted)]">
            Telephony providers (including Bland) can power phone rails; Vesperer
            owns who the character is.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <h2 className="font-[family-name:var(--font-display)] text-3xl font-semibold sm:text-5xl">
          From first character to premium line in 30 days.
        </h2>
        <div className="mt-10 grid gap-3 md:grid-cols-5">
          {TIMELINE.map((step) => (
            <div
              key={step.day}
              className="rounded-2xl border border-[var(--line)] bg-[var(--bg-elevated)]/50 p-4"
            >
              <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--accent)]">
                {step.day}
              </p>
              <h3 className="mt-2 font-[family-name:var(--font-display)] text-lg font-semibold">
                {step.t}
              </h3>
              <p className="mt-2 text-sm text-[var(--muted)]">{step.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section
        id="use-cases"
        className="border-y border-[var(--line)] py-16 sm:py-24"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="font-[family-name:var(--font-display)] text-3xl font-semibold sm:text-5xl">
            What the character layer is optimized for
          </h2>
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {USE_CASES.map((item) => (
              <article
                key={item.t}
                className="rounded-2xl border border-[var(--line)] p-5"
              >
                <h3 className="font-[family-name:var(--font-display)] text-xl font-semibold">
                  {item.t}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
                  {item.d}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <h2 className="font-[family-name:var(--font-display)] text-3xl font-semibold sm:text-5xl">
          Frequently asked questions
        </h2>
        <div className="mt-10 space-y-4">
          {FAQ.map((item) => (
            <details
              key={item.q}
              className="group rounded-2xl border border-[var(--line)] bg-[var(--bg-elevated)]/40 p-5"
            >
              <summary className="cursor-pointer list-none font-[family-name:var(--font-display)] text-lg font-semibold marker:content-none">
                {item.q}
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </section>

      <section className="border-t border-[var(--line)] px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="font-[family-name:var(--font-display)] text-3xl font-semibold sm:text-5xl">
            Own the character. Rent the phone line if you need it.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-[var(--muted)]">
            Start with in-app voice and chat memory. Add telephony later —
            without rebuilding who your characters are.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <ShimmerButton onClick={() => app.redirectToSignUp()}>
              Start free
            </ShimmerButton>
            <Link
              href="/bring"
              className="rounded-xl border border-[var(--line)] px-5 py-3.5 text-sm"
            >
              Bring an existing character
            </Link>
          </div>
        </div>
      </section>

      <LegalFooter variant="marketing" />
    </div>
  );
}
