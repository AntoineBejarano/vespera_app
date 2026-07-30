"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useHexclaveApp } from "@hexclave/next";
import { AppNav } from "@/components/AppNav";
import {
  BlurFade,
  Marquee,
  RetroGrid,
  ShimmerButton,
} from "@/components/magicui/effects";

const INTEGRATIONS = [
  "OnlyFans",
  "Fansly",
  "Fanvue",
  "Telegram",
  "Discord",
  "WhatsApp*",
];

const PIPELINE = [
  "Connector",
  "Character Engine",
  "Memory",
  "LLM",
  "Human Handoff",
];

const PRICING = [
  {
    name: "Agent",
    price: "€20",
    period: "/agent /mo",
    blurb: "One uncensored companion that remembers.",
    features: [
      "1 agent persona",
      "Telegram bot included",
      "Persistent memory",
      "Photo tags + multi-bubble chat",
      "Chat API access",
    ],
    cta: "Start with 1 agent",
    highlight: true,
  },
  {
    name: "Studio",
    price: "€59",
    period: "/mo",
    blurb: "Run a small roster without losing the plot.",
    features: [
      "Up to 3 agents",
      "Multi-bot / multi-peer",
      "Shared photo libraries",
      "Priority model routing",
      "Human handoff hooks",
    ],
    cta: "Scale to Studio",
    highlight: false,
  },
  {
    name: "House",
    price: "€179",
    period: "/mo",
    blurb: "Agency-grade: many girls, many chats, one brain.",
    features: [
      "Up to 12 agents",
      "Connector pack (OF / Fansly / Fanvue)",
      "Team seats (soon)",
      "SLA + private Slack",
      "Custom handoff workflows",
    ],
    cta: "Talk to sales",
    highlight: false,
  },
];

export function LandingPage() {
  const app = useHexclaveApp();
  const search = useSearchParams();

  useEffect(() => {
    const auth = search.get("auth");
    if (auth === "signin") app.redirectToSignIn();
    if (auth === "signup") app.redirectToSignUp();
  }, [app, search]);

  return (
    <div className="relative overflow-hidden">
      <AppNav />
      <section className="relative min-h-[92vh] px-6 pb-20 pt-16">
        <RetroGrid />
        <div className="relative mx-auto flex max-w-5xl flex-col items-start">
          <BlurFade>
            <p className="text-sm uppercase tracking-[0.35em] text-[var(--accent)]">
              Uncensored · 18+ · multi-tenant
            </p>
          </BlurFade>
          <BlurFade delay={0.08}>
            <h1 className="mt-5 max-w-3xl font-[family-name:var(--font-display)] text-5xl leading-[0.95] text-[var(--ink)] sm:text-7xl">
              Companions that stay horny, coherent, and{" "}
              <span className="italic text-[var(--accent)]">yours</span>.
            </h1>
          </BlurFade>
          <BlurFade delay={0.16}>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-[var(--muted)]">
              Vespera wires creator platforms into a character engine with real
              memory — then texts like a person, not a filtered chatbot. Built
              for adults who need heat without the lecture.
            </p>
          </BlurFade>
          <BlurFade delay={0.24} className="mt-10 flex flex-wrap gap-4">
            <ShimmerButton onClick={() => app.redirectToSignUp()}>
              Deploy an agent — €20/mo
            </ShimmerButton>
            <button
              type="button"
              className="border border-[var(--line)] px-6 py-3"
              onClick={() => app.redirectToSignIn()}
            >
              Sign in
            </button>
          </BlurFade>

          <BlurFade delay={0.35} className="mt-16 w-full max-w-md">
            <div className="border border-[var(--line)] bg-[var(--bg-elevated)]/90 p-4 shadow-[0_0_60px_rgba(196,165,116,0.08)]">
              <p className="text-xs uppercase tracking-wider text-[var(--muted)]">
                Live vibe · example
              </p>
              <div className="mt-4 space-y-3 text-sm">
                <p className="ml-8 rounded bg-[var(--accent-soft)] px-3 py-2 text-right">
                  can&apos;t stop thinking about you rn
                </p>
                <p className="mr-8 rounded bg-[var(--bg)] px-3 py-2 text-[var(--ink)]">
                  fuck — say that again
                </p>
                <p className="mr-8 rounded bg-[var(--bg)] px-3 py-2 text-[var(--ink)]">
                  wish i was there instead of your hand
                </p>
                <p className="ml-8 rounded bg-[var(--accent-soft)] px-3 py-2 text-right">
                  send me something
                </p>
                <p className="mr-8 text-[var(--muted)]">[photo · tagged: face]</p>
                <p className="mr-8 rounded bg-[var(--bg)] px-3 py-2">
                  here. don&apos;t be gentle
                </p>
              </div>
              <p className="mt-3 text-xs text-[var(--muted)]">
                Uncensored LLM · multi-bubble · memory that doesn&apos;t reset
                the horniness.
              </p>
            </div>
          </BlurFade>
        </div>
      </section>

      <section className="border-y border-[var(--line)] py-8">
        <Marquee className="px-4">
          {INTEGRATIONS.map((name) => (
            <span
              key={name}
              className="whitespace-nowrap text-sm uppercase tracking-[0.25em] text-[var(--muted)]"
            >
              {name}
            </span>
          ))}
        </Marquee>
      </section>

      <section id="pipeline" className="mx-auto max-w-5xl px-6 py-24">
        <BlurFade>
          <h2 className="font-[family-name:var(--font-display)] text-4xl">
            Platform → persona → payout energy
          </h2>
          <p className="mt-3 max-w-2xl text-[var(--muted)]">
            Integrations feed the connector. The character engine keeps the
            girl consistent. Memory + LLM do the talking. Human handoff when you
            want the real you to take over.
          </p>
        </BlurFade>
        <div className="mt-12 flex flex-col gap-3 md:flex-row md:flex-wrap md:items-center">
          {["OnlyFans", "Fansly", "Fanvue", "Telegram"].map((s, i) => (
            <BlurFade key={s} delay={i * 0.05}>
              <span className="inline-block border border-[var(--line)] px-4 py-2 text-sm">
                {s}
              </span>
            </BlurFade>
          ))}
        </div>
        <div className="mt-4 text-[var(--muted)]">↓</div>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          {PIPELINE.map((step, i) => (
            <BlurFade key={step} delay={0.1 + i * 0.06} className="flex items-center gap-3">
              <span className="border border-[var(--accent)]/50 bg-[var(--accent-soft)] px-4 py-3 text-sm text-[var(--ink)]">
                {step}
              </span>
              {i < PIPELINE.length - 1 ? (
                <span className="hidden text-[var(--muted)] sm:inline">→</span>
              ) : null}
            </BlurFade>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-16">
        <BlurFade>
          <h2 className="font-[family-name:var(--font-display)] text-4xl">
            Why uncensored wins
          </h2>
          <p className="mt-3 max-w-2xl text-[var(--muted)]">
            Filtered models kill the scene mid-sentence. Vespera is built for
            adult chemistry that stays explicit, teasing, and human — without
            therapist energy or corporate refusals.
          </p>
        </BlurFade>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {[
            {
              t: "No prudish interrupts",
              d: "Stay in the fantasy. The model matches heat instead of lecturing.",
            },
            {
              t: "Memory that flirts back",
              d: "She remembers what you like — and what you asked for last night.",
            },
            {
              t: "Human when it matters",
              d: "Handoff to a real operator without breaking the character frame.",
            },
          ].map((card, i) => (
            <BlurFade key={card.t} delay={i * 0.08}>
              <div className="h-full border border-[var(--line)] bg-[var(--bg-elevated)] p-5">
                <h3 className="font-[family-name:var(--font-display)] text-2xl">
                  {card.t}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
                  {card.d}
                </p>
              </div>
            </BlurFade>
          ))}
        </div>
      </section>

      <section id="pricing" className="mx-auto max-w-5xl px-6 py-24">
        <BlurFade>
          <h2 className="font-[family-name:var(--font-display)] text-4xl">
            Pricing
          </h2>
          <p className="mt-3 text-[var(--muted)]">
            Pay per agent. Simple. Adult-friendly billing coming via
            creator-native rails.
          </p>
        </BlurFade>
        <div className="mt-12 grid gap-4 lg:grid-cols-3">
          {PRICING.map((tier, i) => (
            <BlurFade key={tier.name} delay={i * 0.08}>
              <div
                className={
                  tier.highlight
                    ? "flex h-full flex-col border border-[var(--accent)] bg-[var(--accent-soft)] p-6"
                    : "flex h-full flex-col border border-[var(--line)] bg-[var(--bg-elevated)] p-6"
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
                  className="mt-8 w-full bg-[var(--accent)] px-4 py-3 text-[var(--bg)]"
                  onClick={() => app.redirectToSignUp()}
                >
                  {tier.cta}
                </button>
              </div>
            </BlurFade>
          ))}
        </div>
      </section>

      <footer className="border-t border-[var(--line)] px-6 py-10 text-sm text-[var(--muted)]">
        <div className="mx-auto flex max-w-5xl flex-wrap justify-between gap-4">
          <p>Vespera · private AI relationships for adults · 18+</p>
          <p>* Roadmap connectors. Telegram live today.</p>
        </div>
      </footer>
    </div>
  );
}
