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
  Marquee,
  RetroGrid,
  ShimmerButton,
} from "@/components/magicui/effects";
import { VoiceAgentWidget } from "@/components/VoiceAgentWidget";
import { SITE_URL } from "@/lib/site";

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

const COMPETE_STEPS = [
  {
    n: "01",
    t: "Start a heat",
    d: "Invite up to 5 friends into a private competition with the same girl.",
  },
  {
    n: "02",
    t: "Each flirts alone",
    d: "Separate chats. Separate memory. Nobody sees anyone else’s game.",
  },
  {
    n: "03",
    t: "She ranks you",
    d: "Tatiana scores chemistry, confidence, and how well you listen — live.",
  },
];

const COMPETE_BOARD = [
  {
    place: "1st",
    name: "Marco",
    score: 86,
    note: "“He actually remembered what I said. That’s rare.”",
    lead: true,
  },
  {
    place: "2nd",
    name: "Leo",
    score: 71,
    note: "“Funny. A little try-hard. Still in the game.”",
    lead: false,
  },
  {
    place: "3rd",
    name: "Sam",
    score: 54,
    note: "“Cute opener. Then he repeated himself.”",
    lead: false,
  },
  {
    place: "4th",
    name: "Jules",
    score: 38,
    note: "“Too fast. Slow down if you want me.”",
    lead: false,
  },
  {
    place: "5th",
    name: "Nik",
    score: 22,
    note: "“He sent ‘hey’ three times. I’m not a slot machine.”",
    lead: false,
  },
];

const PRICING = [
  {
    name: "Agent",
    price: "€20",
    period: "/agent /mo",
    blurb: "One private companion that remembers.",
    features: [
      "1 agent persona",
      "Telegram bot included",
      "Persistent memory",
      "Photo tags + multi-bubble chat",
      "Chat API access",
    ],
    cta: "Start with 1 agent",
    highlight: true,
    action: "signup" as const,
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
    action: "signup" as const,
  },
  {
    name: "House",
    price: "€179",
    period: "/mo",
    blurb: "One identity or an entire roster. Every conversation stays consistent.",
    features: [
      "Up to 12 agents",
      "Connector pack (OF / Fansly / Fanvue)",
      "Team seats (soon)",
      "SLA + private Slack",
      "Custom handoff workflows",
    ],
    cta: "Talk to sales",
    highlight: false,
    action: "sales" as const,
  },
];

/** Adult creator landing — moved from the main homepage. */
export function AfterDarkLanding() {
  const app = useHexclaveApp();
  const user = useUser({ or: "return-null" });
  const search = useSearchParams();

  useEffect(() => {
    if (search.get("hexclave_cross_domain_auth")) return;

    if (user) {
      window.location.replace("/personas");
      return;
    }
    const auth = search.get("auth");
    if (auth === "signin") {
      window.location.replace("/age-gate?zone=adult&intent=signin");
      return;
    }
    if (auth === "signup") {
      window.location.replace("/age-gate?zone=adult&intent=signup");
      return;
    }
  }, [app, search, user]);

  return (
    <div className="relative overflow-hidden" data-theme="after-dark">
      <AppNav variant="after-dark" />
      <section className="relative min-h-[88dvh] px-4 pb-16 pt-10 sm:min-h-[92vh] sm:px-6 sm:pb-20 sm:pt-16">
        <RetroGrid />
        <div className="relative mx-auto flex max-w-5xl flex-col items-start">
          <BlurFade>
            <BrandLogo
              href="/after-dark"
              size="hero"
              priority
              variant="after-dark"
              className="mb-2"
              subtitle="After Dark · 18+"
            />
          </BlurFade>
          <BlurFade delay={0.08}>
            <p className="mt-4 text-[11px] uppercase tracking-[0.28em] text-[var(--accent)] sm:text-sm sm:tracking-[0.35em]">
              18+ · Private · Persistent
            </p>
          </BlurFade>
          <BlurFade delay={0.12}>
            <h1 className="mt-3 max-w-3xl font-[family-name:var(--font-display)] text-[1.85rem] leading-[1.05] text-[var(--ink)] sm:mt-4 sm:text-4xl sm:leading-[1.1]">
              Someone who remembers exactly{" "}
              <span className="italic text-[var(--accent)]">what you like</span>
              .
            </h1>
          </BlurFade>
          <BlurFade delay={0.18}>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-[var(--muted)] sm:mt-5 sm:text-lg">
              Private, persistent and entirely yours. The chemistry stays. The
              memory does too — it doesn&apos;t reset when the conversation gets
              interesting.
            </p>
          </BlurFade>
          <BlurFade
            delay={0.26}
            className="mt-8 flex w-full flex-col gap-3 sm:mt-10 sm:w-auto sm:flex-row sm:flex-wrap sm:gap-4"
          >
            <ShimmerButton
              className="w-full sm:w-auto"
              onClick={() => {
                window.location.href = "/age-gate?zone=adult&intent=signup";
              }}
            >
              Enter 18+ — from €20/mo
            </ShimmerButton>
            <button
              type="button"
              className="w-full rounded-xl border border-[var(--line)] px-6 py-3 sm:w-auto"
              onClick={() => {
                window.location.href = "/age-gate?zone=adult&intent=signin";
              }}
            >
              Sign in
            </button>
            <Link
              href="/"
              className="w-full rounded-xl border border-[var(--line)] px-6 py-3 text-center text-sm text-[var(--muted)] sm:w-auto"
            >
              ← Back to Vesperer
            </Link>
          </BlurFade>
          <p className="mt-4 text-xs text-[var(--muted)]">
            18+ only. By continuing you already attested age and accepted our{" "}
            <a href="/legal/terms" className="text-[var(--accent)]">
              Terms
            </a>
            .
          </p>

          <BlurFade delay={0.35} className="mt-12 w-full max-w-md sm:mt-16">
            <div className="rounded-2xl border border-[var(--line)] bg-[var(--bg-elevated)]/90 p-3 shadow-[0_0_60px_rgba(255,77,109,0.12)] sm:p-4">
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
                Explicit · multi-bubble · memory that doesn&apos;t kill the
                chemistry.
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

      <section
        id="voice"
        className="scroll-mt-24 border-b border-[var(--line)] bg-[var(--bg-elevated)]/30 py-16 sm:py-24"
      >
        <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <BlurFade>
            <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--accent)]">
              After Dark Voice · 18+
            </p>
            <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-semibold sm:text-5xl">
              Talk to Tatiana — she remembers what you like.
            </h2>
            <p className="mt-4 max-w-xl text-[var(--muted)]">
              Adult companions with a dedicated voice and the same memory layer
              as chat — intimacy that compounds instead of resetting every
              session.
            </p>
            <ul className="mt-6 space-y-2 text-sm text-[var(--muted)]">
              <li>· Dedicated voice for Tatiana</li>
              <li>· Per-user relationship memory</li>
              <li>· Voice + chat continuity for creator lines</li>
            </ul>
          </BlurFade>
          <BlurFade delay={0.08}>
            <VoiceAgentWidget
              compact
              catalog="after-dark"
              defaultAgent="tatiana"
            />
          </BlurFade>
        </div>
      </section>

      <section
        id="compete"
        className="scroll-mt-24 border-b border-[var(--line)] py-16 sm:py-24"
      >
        <div className="mx-auto grid max-w-6xl gap-12 px-4 sm:px-6 lg:grid-cols-[1fr_1.05fr] lg:items-start">
          <BlurFade>
            <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--accent)]">
              Friend heat · 18+
            </p>
            <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-semibold leading-[1.05] sm:text-5xl">
              Who in your group actually{" "}
              <span className="italic text-[var(--accent)]">lands her</span>?
            </h2>
            <p className="mt-4 max-w-xl text-[var(--muted)]">
              Create a competition with your friends. Everyone chats Tatiana in
              private — she keeps a separate memory for each of you, then ranks
              who’s winning based on how she feels about the conversation.
            </p>
            <ol className="mt-8 space-y-5">
              {COMPETE_STEPS.map((step) => (
                <li key={step.n} className="flex gap-4">
                  <span className="font-[family-name:var(--font-display)] text-sm text-[var(--accent)]">
                    {step.n}
                  </span>
                  <div>
                    <p className="font-[family-name:var(--font-display)] text-lg font-semibold">
                      {step.t}
                    </p>
                    <p className="mt-1 text-sm text-[var(--muted)]">{step.d}</p>
                  </div>
                </li>
              ))}
            </ol>
            <div className="mt-8 flex flex-wrap gap-3">
              <ShimmerButton
                onClick={() => {
                  window.location.href = "/age-gate?zone=adult&intent=signup";
                }}
              >
                Start a competition
              </ShimmerButton>
              <a
                href="#voice"
                className="inline-flex items-center rounded-xl border border-[var(--line)] px-5 py-3.5 text-sm"
              >
                Practice with Tatiana first
              </a>
            </div>
            <p className="mt-4 text-xs text-[var(--muted)]">
              Private chats only. She never leaks your friends’ messages — just
              the scoreboard and her verdict.
            </p>
          </BlurFade>

          <BlurFade delay={0.1}>
            <div className="border border-[var(--line)] bg-[var(--bg-elevated)]/80 p-5 sm:p-6">
              <div className="flex items-end justify-between gap-3 border-b border-[var(--line)] pb-4">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.22em] text-[var(--muted)]">
                    Live board · Friday night heat
                  </p>
                  <p className="mt-1 font-[family-name:var(--font-display)] text-xl font-semibold">
                    Tatiana’s ranking
                  </p>
                </div>
                <p className="text-xs text-[var(--accent-2)]">updating…</p>
              </div>
              <ul className="mt-2 divide-y divide-[var(--line)]">
                {COMPETE_BOARD.map((row) => (
                  <li
                    key={row.name}
                    className={`py-4 ${row.lead ? "bg-[var(--accent-soft)]/40 px-3 -mx-3 sm:px-4 sm:-mx-4" : ""}`}
                  >
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="font-[family-name:var(--font-display)] text-lg font-semibold">
                        <span className="mr-2 text-[var(--muted)]">
                          {row.place}
                        </span>
                        {row.name}
                        {row.lead ? (
                          <span className="ml-2 text-xs uppercase tracking-[0.18em] text-[var(--accent)]">
                            leading
                          </span>
                        ) : null}
                      </p>
                      <p className="font-[family-name:var(--font-display)] text-2xl tabular-nums text-[var(--accent-2)]">
                        {row.score}
                      </p>
                    </div>
                    <p className="mt-2 text-sm italic leading-relaxed text-[var(--muted)]">
                      {row.note}
                    </p>
                  </li>
                ))}
              </ul>
              <p className="mt-5 border-t border-[var(--line)] pt-4 text-xs text-[var(--muted)]">
                Scores from chemistry, wit, listening, and whether she’d keep
                talking — judged in-character by Tatiana.
              </p>
            </div>
          </BlurFade>
        </div>
      </section>

      <section
        id="pipeline"
        className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-24"
      >
        <BlurFade>
          <h2 className="font-[family-name:var(--font-display)] text-3xl font-semibold sm:text-4xl">
            Platform → persona → continuity
          </h2>
          <p className="mt-3 max-w-2xl text-[var(--muted)]">
            Integrations feed the connector. The character engine keeps her
            consistent. Memory keeps the chemistry. Human handoff when you want
            the real you to take over.
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
            <BlurFade
              key={step}
              delay={0.1 + i * 0.06}
              className="flex items-center gap-3"
            >
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

      <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6 sm:py-16">
        <BlurFade>
          <h2 className="font-[family-name:var(--font-display)] text-3xl font-semibold sm:text-4xl">
            Nothing breaks the chemistry
          </h2>
          <p className="mt-3 max-w-2xl text-[var(--muted)]">
            Filtered models kill the scene mid-sentence. After Dark stays
            explicit, teasing and human — with memory that compounds instead of
            resetting every night.
          </p>
        </BlurFade>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {[
            {
              t: "Stay in the fantasy",
              d: "Heat matches the moment instead of lecturing you out of it.",
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
              <div className="h-full rounded-2xl border border-[var(--line)] bg-[var(--bg-elevated)] p-5">
                <h3 className="font-[family-name:var(--font-display)] text-2xl font-semibold">
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

      <section
        id="adult-features"
        className="mx-auto max-w-5xl px-4 py-14 sm:px-6 sm:py-16"
      >
        <BlurFade>
          <h2 className="font-[family-name:var(--font-display)] text-3xl font-semibold sm:text-4xl">
            Built for adult creators
          </h2>
          <p className="mt-3 max-w-2xl text-[var(--muted)]">
            Same character core as Vesperer — with tone controls, private
            infrastructure and strict prohibition of minors and non-consensual
            personas.
          </p>
        </BlurFade>
        <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            "Adult tone controls",
            "Relationship progression",
            "Long-term memory",
            "Creator-owned characters",
            "Private infrastructure",
            "Human handoff",
            "Agency workspace",
            "Analytics",
            "Age assurance",
          ].map((item, i) => (
            <BlurFade key={item} delay={i * 0.04}>
              <li className="rounded-xl border border-[var(--line)] bg-[var(--bg-elevated)] px-4 py-3 text-sm">
                {item}
              </li>
            </BlurFade>
          ))}
        </ul>
      </section>

      <section
        id="pricing"
        className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-24"
      >
        <BlurFade>
          <h2 className="font-[family-name:var(--font-display)] text-3xl font-semibold sm:text-4xl">
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
                    ? "flex h-full flex-col rounded-2xl border border-[var(--accent)] bg-[var(--accent-soft)] p-6"
                    : "flex h-full flex-col rounded-2xl border border-[var(--line)] bg-[var(--bg-elevated)] p-6"
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
                {tier.action === "sales" ? (
                  <a
                    href={`${SITE_URL}/business/agencies`}
                    className="mt-8 block w-full rounded-xl bg-[var(--accent)] px-4 py-3 text-center font-medium text-[var(--accent-ink)]"
                  >
                    {tier.cta}
                  </a>
                ) : (
                  <button
                    type="button"
                    className="mt-8 w-full rounded-xl bg-[var(--accent)] px-4 py-3 font-medium text-[var(--accent-ink)]"
                    onClick={() => {
                      window.location.href =
                        "/age-gate?zone=adult&intent=signup";
                    }}
                  >
                    {tier.cta}
                  </button>
                )}
              </div>
            </BlurFade>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-10 sm:px-6">
        <p className="text-center text-xs text-[var(--muted)]">
          Running a roster or integrating a platform?{" "}
          <a
            href={`${SITE_URL}/business/agencies`}
            className="text-[var(--ink)] underline-offset-2 hover:underline"
          >
            Vesperer for Agencies
          </a>
          {" · "}
          <a
            href={`${SITE_URL}/business/platforms`}
            className="text-[var(--ink)] underline-offset-2 hover:underline"
          >
            for Platforms
          </a>
        </p>
      </section>
      <LegalFooter variant="after-dark" />
      <p className="px-6 pb-8 text-center text-xs text-[var(--muted)]">
        * Roadmap connectors. Telegram live today.
      </p>
    </div>
  );
}
