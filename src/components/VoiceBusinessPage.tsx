"use client";

import Link from "next/link";
import { AppNav } from "@/components/AppNav";
import { LegalFooter } from "@/components/LegalFooter";
import { VoiceAgentWidget } from "@/components/VoiceAgentWidget";
import { BlurFade, ShimmerButton } from "@/components/magicui/effects";
import { useHexclaveApp } from "@hexclave/next";

const PILLARS = [
  {
    t: "Reliability on every call.",
    d: "Every voice turn runs on a persistent character identity. No sudden personality drift, no forgotten callers, no third-party black box rewriting who your agent is.",
  },
  {
    t: "Build production-ready agents with no experience.",
    d: "Describe the persona, paste an existing character, or import a card. Vesperer builds the voice-ready identity, memory rules, and relationship style.",
  },
  {
    t: "Test every scenario before going live.",
    d: "Talk, correct, and restore versions. Catch edge cases before customers hear them — then ship the version that stays consistent.",
  },
  {
    t: "Deploy one agent across many channels.",
    d: "Voice, web chat, Telegram, and APIs share the same memory. Callers never repeat themselves when the channel changes.",
  },
  {
    t: "See exactly what happens, every time.",
    d: "Conversation history, remembered facts, and relationship state stay inspectable so ops can QA what the agent knew and said.",
  },
  {
    t: "Plugs into your existing stack.",
    d: "Connect chat APIs, bots, and creator tools without rebuilding the character. Bring the systems you already run.",
  },
];

const USE_CASES = [
  {
    t: "IVR replacement",
    d: "Retire the press-1 phone tree. Callers say what they need in plain language, and the agent routes, resolves, or books it in one conversation — while remembering returning callers.",
  },
  {
    t: "AI call center",
    d: "Stand up an AI call center that answers volume spikes around the clock, without adding headcount, and keeps context across every follow-up.",
  },
  {
    t: "Inbound call agent",
    d: "An inbound agent greets every caller, verifies identity, answers questions, and hands complex cases to your team with full memory attached.",
  },
  {
    t: "AI phone calls",
    d: "Make and receive AI phone-style conversations with human cadence, durable personality, and long-term memory that compounds over time.",
  },
  {
    t: "Outbound call agent",
    d: "Outbound agents qualify leads, confirm appointments, and follow up politely at scale — recalling prior promises and preferences.",
  },
  {
    t: "AI-powered call intelligence",
    d: "Every conversation becomes searchable memory. Spot failure points, surface trends, and improve agents from real interactions.",
  },
  {
    t: "Automated call response system",
    d: "Pick up nights, weekends, and spikes so no caller lands in silence — and regulars are recognized instantly.",
  },
  {
    t: "AI phone agent",
    d: "Build an AI phone agent that sounds human, follows your playbook, and plugs into the tools your team already uses.",
  },
  {
    t: "Conversational voice AI",
    d: "Handle interruptions, topic changes, and emotional tone the way a person would — without wiping identity between turns.",
  },
  {
    t: "AI contact center",
    d: "Cover phone-style voice, SMS, and chat in one place, with every conversation logged, remembered, and routed with context.",
  },
];

const FAQ = [
  {
    q: "What is Vesperer Voice?",
    a: "Vesperer Voice is a voice AI layer for characters and agents that hold real conversations and remember callers over time. Use it for companions, mentors, creator lines, inbound support, and omnichannel deployments with unified memory.",
  },
  {
    q: "How is this different from Bland AI?",
    a: "Bland focuses on enterprise phone infrastructure. Vesperer focuses on the character layer: persistent identity, long-term memory, evolving relationships, versioning, and portability across models and channels — including voice demos and deployable agents.",
  },
  {
    q: "Does the agent really remember?",
    a: "Yes. Important facts, preferences, promises, and relationship context persist across sessions for the same peer. Unified memory means voice and chat share the same continuity.",
  },
  {
    q: "How long does it take to deploy?",
    a: "You can start a voice-ready character in minutes. Production rollouts with channels, testing, and ops review typically land in days to a few weeks depending on integrations.",
  },
  {
    q: "Can Vesperer replace my call center?",
    a: "Yes for high-volume, repeatable work — and alongside humans for edge cases. Start with intake, booking, FAQ, and returning-caller recognition, then expand coverage as memory and pathways harden.",
  },
  {
    q: "How is this different from an IVR?",
    a: "An IVR makes callers navigate menus. Vesperer replaces it with conversation: callers state what they need, and the agent understands, acts, and remembers them next time.",
  },
];

const TIMELINE = [
  { day: "Day 01", t: "Discovery + scoping", d: "We learn your business, callers, and memory rules." },
  { day: "Day 07", t: "Build phase begins", d: "Voice, conversation flow, identity, and testing." },
  { day: "Day 14", t: "First end-to-end run", d: "Agent in test calls with persistent memory." },
  { day: "Day 21", t: "Dry run + safety locks", d: "Edge cases pass. Ready for production." },
  { day: "Day 30", t: "Live in production", d: "Your team reviews conversations daily." },
];

export function VoiceBusinessPage() {
  const app = useHexclaveApp();

  return (
    <div className="relative min-h-screen overflow-hidden">
      <AppNav variant="marketing" />

      {/* Hero — Bland layout: headline + industries + speak widget */}
      <section className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-20">
        <BlurFade>
          <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--accent)]">
            Vesperer Voice
          </p>
          <h1 className="mt-4 font-[family-name:var(--font-display)] text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
            Voice AI for conversations where memory and trust actually matter.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-[var(--muted)]">
            Built for high-stakes calls and character experiences across
            companions, creators, mentors, support, and logistics-style
            follow-ups — with unified memory that never drops the thread.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ShimmerButton onClick={() => app.redirectToSignUp()}>
              Deploy a voice agent
            </ShimmerButton>
            <a
              href="#demo"
              className="rounded-xl border border-[var(--line)] px-5 py-3.5 text-sm"
            >
              Click to speak with an agent
            </a>
          </div>
          <p className="mt-6 text-sm text-[var(--muted)]">
            <span className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
              Persistent
            </span>{" "}
            memory across voice, chat, and channels.
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
            Trusted for security-conscious product and ops teams
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-[var(--ink)]">
            {["Companions", "Creators", "Mentors", "Support desks", "Studios"].map(
              (label) => (
                <span key={label} className="opacity-80">
                  {label}
                </span>
              ),
            )}
          </div>
        </div>
      </section>

      {/* One platform. Every call. */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <BlurFade>
          <h2 className="font-[family-name:var(--font-display)] text-3xl font-semibold sm:text-5xl">
            One platform.{" "}
            <span className="text-[var(--accent-2)]">Every call.</span>
          </h2>
          <p className="mt-4 max-w-2xl text-[var(--muted)]">
            Vesperer automates the conversations you thought required a human —
            and keeps the identity intact so every returning caller feels known.
          </p>
        </BlurFade>
        <div className="mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {PILLARS.map((p, i) => (
            <BlurFade key={p.t} delay={i * 0.05}>
              <article className="h-full rounded-2xl border border-[var(--line)] bg-[var(--bg-elevated)]/60 p-5">
                <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--accent)]">
                  {i === 0
                    ? "Infrastructure"
                    : i === 1
                      ? "Build"
                      : i === 2
                        ? "Test"
                        : i === 3
                          ? "Omnichannel"
                          : i === 4
                            ? "Observability"
                            : "Integrations"}
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

      {/* Latency */}
      <section className="border-y border-[var(--line)] bg-[var(--bg-elevated)]/35 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="max-w-3xl font-[family-name:var(--font-display)] text-3xl font-semibold sm:text-5xl">
            And all this with latency so low you might miss it.
          </h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            <div className="rounded-2xl border border-[var(--accent)]/40 bg-[var(--accent-soft)] p-6">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--accent-2)]">
                Vesperer voice turn
              </p>
              <p className="mt-3 font-[family-name:var(--font-display)] text-5xl">
                ~400ms*
              </p>
              <p className="mt-2 text-sm text-[var(--muted)]">
                Tuned for spoken cadence with memory retrieval in the loop.
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--line)] p-6">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                Typical stacked voice wrappers
              </p>
              <p className="mt-3 font-[family-name:var(--font-display)] text-5xl text-[var(--muted)]">
                1,240ms
              </p>
              <p className="mt-2 text-sm text-[var(--muted)]">
                Industry-average stacks that forget callers between tools.
              </p>
            </div>
          </div>
          <p className="mt-4 text-xs text-[var(--muted)]">
            *Demo and production latency vary by model, network, and channel.
          </p>
        </div>
      </section>

      {/* Timeline */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <h2 className="font-[family-name:var(--font-display)] text-3xl font-semibold sm:text-5xl">
          Enterprise deployments, live in production in 30 days.
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

      {/* How people use */}
      <section
        id="use-cases"
        className="border-y border-[var(--line)] py-16 sm:py-24"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="font-[family-name:var(--font-display)] text-3xl font-semibold sm:text-5xl">
            How people use Vesperer Voice
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

      {/* FAQ SEO */}
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
            Secure voice AI that remembers — and pays for itself.
          </h2>
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
