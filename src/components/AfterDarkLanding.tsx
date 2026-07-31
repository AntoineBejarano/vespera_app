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
    if (auth === "signin") void app.redirectToSignIn();
    if (auth === "signup") void app.redirectToSignUp();
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
              Uncensored · 18+ · multi-tenant
            </p>
          </BlurFade>
          <BlurFade delay={0.12}>
            <h1 className="mt-3 max-w-3xl font-[family-name:var(--font-display)] text-[1.85rem] leading-[1.05] text-[var(--ink)] sm:mt-4 sm:text-4xl sm:leading-[1.1]">
              Private AI companions without{" "}
              <span className="italic text-[var(--accent)]">broken memory</span>
              .
            </h1>
          </BlurFade>
          <BlurFade delay={0.18}>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-[var(--muted)] sm:mt-5 sm:text-lg">
              Build adult characters with consistent personalities, evolving
              relationships, private deployment and full control over their
              identity. Companions that stay horny, coherent, and yours —
              wired into creator platforms with a character engine that
              remembers.
            </p>
          </BlurFade>
          <BlurFade
            delay={0.26}
            className="mt-8 flex w-full flex-col gap-3 sm:mt-10 sm:w-auto sm:flex-row sm:flex-wrap sm:gap-4"
          >
            <ShimmerButton
              className="w-full sm:w-auto"
              onClick={() => app.redirectToSignUp()}
            >
              Enter 18+ — Deploy an agent €20/mo
            </ShimmerButton>
            <button
              type="button"
              className="w-full rounded-xl border border-[var(--line)] px-6 py-3 sm:w-auto"
              onClick={() => app.redirectToSignIn()}
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

      <section
        id="pipeline"
        className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-24"
      >
        <BlurFade>
          <h2 className="font-[family-name:var(--font-display)] text-3xl font-semibold sm:text-4xl">
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
            Why uncensored wins
          </h2>
          <p className="mt-3 max-w-2xl text-[var(--muted)]">
            Filtered models kill the scene mid-sentence. Vesperer is built
            for adult chemistry that stays explicit, teasing, and human —
            without therapist energy or corporate refusals.
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
      </section>

      <LegalFooter variant="after-dark" />
      <p className="px-6 pb-8 text-center text-xs text-[var(--muted)]">
        * Roadmap connectors. Telegram live today.
      </p>
    </div>
  );
}
