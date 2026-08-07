"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { BrandLogo } from "@/components/BrandLogo";
import { LegalFooter } from "@/components/LegalFooter";
import { MarketingNav } from "@/components/MarketingNav";
import {
  BlurFade,
  Marquee,
  RetroGrid,
  ShimmerButton,
} from "@/components/magicui/effects";
import { SITE_URL } from "@/lib/site";
import { PARTNERS_EMAIL } from "@/lib/adult/constants";
import { PARTNERS_MAILTO } from "@/lib/adult/partners";

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
    price: "Custom",
    period: "",
    blurb: "Partner-only companion stack for verified adult operators.",
    features: [
      "1+ agent personas",
      "Memory & voice",
      "Channel connectors",
      "Contracted rollout",
    ],
    cta: "Apply for partner access",
  },
  {
    name: "Roster",
    price: "Custom",
    period: "",
    blurb: "Multi-persona ops for agencies — audited After Dark approval.",
    features: [
      "Workspace approval",
      "Ops tooling",
      "Policy controls",
      "Dedicated onboarding",
    ],
    cta: "Apply for partner access",
  },
  {
    name: "House",
    price: "Design partner",
    period: "",
    blurb: "Platform / large roster — talk to us.",
    features: [
      "Custom limits",
      "Integration support",
      "Roadmap priority",
      "Commercial terms",
    ],
    cta: "Apply for partner access",
  },
];

export function AfterDarkLanding() {
  const search = useSearchParams();

  useEffect(() => {
    // Invite-only: never auto-route guests into adult signup.
    void search.get("auth");
  }, [search]);

  return (
    <div className="relative overflow-hidden" data-theme="after-dark">
      <MarketingNav variant="after-dark" />
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
              subtitle="After Dark · Partner access"
            />
          </BlurFade>
          <BlurFade delay={0.08}>
            <p className="mt-4 text-[11px] uppercase tracking-[0.28em] text-[var(--accent)] sm:text-sm sm:tracking-[0.35em]">
              Invite-only · B2B · 18+
            </p>
          </BlurFade>
          <BlurFade delay={0.12}>
            <h1 className="mt-3 max-w-3xl font-[family-name:var(--font-display)] text-[1.85rem] leading-[1.05] text-[var(--ink)] sm:mt-4 sm:text-4xl sm:leading-[1.1]">
              Adult companion infrastructure —{" "}
              <span className="italic text-[var(--accent)]">
                by arrangement
              </span>
              .
            </h1>
          </BlurFade>
          <BlurFade delay={0.18}>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-[var(--muted)] sm:mt-5 sm:text-lg">
              After Dark is not self-service. Partners get audited workspace
              approval, policy controls, and contracted rollout. Consumer adult
              delivery requires highly effective age assurance — not a checkbox.
            </p>
          </BlurFade>
          <BlurFade
            delay={0.26}
            className="mt-8 flex w-full flex-col gap-3 sm:mt-10 sm:w-auto sm:flex-row sm:flex-wrap sm:gap-4"
          >
            <a href={PARTNERS_MAILTO} className="w-full sm:w-auto">
              <ShimmerButton className="w-full sm:w-auto">
                Apply for partner access
              </ShimmerButton>
            </a>
            <Link
              href={SITE_URL}
              className="w-full rounded-xl border border-[var(--line)] px-6 py-3 text-center sm:w-auto"
            >
              Vesperer SFW (main site)
            </Link>
          </BlurFade>
          <p className="mt-4 text-sm text-[var(--muted)]">{PARTNERS_EMAIL}</p>
        </div>
      </section>

      <section className="border-y border-[var(--line)] py-4">
        <Marquee className="[--duration:40s]">
          {INTEGRATIONS.map((name) => (
            <span
              key={name}
              className="mx-6 text-sm uppercase tracking-[0.2em] text-[var(--muted)]"
            >
              {name}
            </span>
          ))}
        </Marquee>
      </section>

      <section id="voice" className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
        <BlurFade>
          <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--accent)]">
            Voice
          </p>
          <h2 className="mt-2 font-[family-name:var(--font-display)] text-3xl text-[var(--ink)]">
            Demo voice (SFW preview)
          </h2>
          <p className="mt-3 max-w-xl text-[var(--muted)]">
            Public demos stay non-explicit. Full adult voice delivery is partner
            + age-assurance gated.
          </p>
        </BlurFade>
        <div className="mt-8 rounded-xl border border-[var(--line)] p-6 text-sm text-[var(--muted)]">
          Adult voice demos are disabled on the public partner landing until
          highly effective age assurance is live. Apply for partner access to
          discuss contracted previews.
        </div>
      </section>

      <section id="compete" className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
        <BlurFade>
          <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--accent)]">
            Compete
          </p>
          <h2 className="mt-2 font-[family-name:var(--font-display)] text-3xl text-[var(--ink)]">
            Private heats — partner roadmaps
          </h2>
        </BlurFade>
        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {COMPETE_STEPS.map((s) => (
            <BlurFade key={s.n}>
              <p className="text-xs text-[var(--accent)]">{s.n}</p>
              <h3 className="mt-2 text-lg text-[var(--ink)]">{s.t}</h3>
              <p className="mt-2 text-sm text-[var(--muted)]">{s.d}</p>
            </BlurFade>
          ))}
        </div>
        <div className="mt-12 space-y-3">
          {COMPETE_BOARD.map((row) => (
            <div
              key={row.place}
              className={`flex items-start justify-between gap-4 border-b border-[var(--line)] py-3 ${
                row.lead ? "text-[var(--accent)]" : "text-[var(--muted)]"
              }`}
            >
              <div>
                <p className="font-medium text-[var(--ink)]">
                  {row.place} · {row.name}
                </p>
                <p className="mt-1 text-sm">{row.note}</p>
              </div>
              <p className="shrink-0 text-lg tabular-nums">{row.score}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="pipeline" className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
        <BlurFade>
          <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--accent)]">
            How it works
          </p>
          <h2 className="mt-2 font-[family-name:var(--font-display)] text-3xl text-[var(--ink)]">
            Same engine. Partner controls.
          </h2>
        </BlurFade>
        <div className="mt-10 flex flex-wrap gap-3">
          {PIPELINE.map((step) => (
            <span
              key={step}
              className="rounded-full border border-[var(--line)] px-4 py-2 text-sm text-[var(--ink)]"
            >
              {step}
            </span>
          ))}
        </div>
        <div className="mt-10">
          <a href={PARTNERS_MAILTO}>
            <ShimmerButton>Apply for partner access</ShimmerButton>
          </a>
        </div>
      </section>

      <section id="pricing" className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
        <BlurFade>
          <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--accent)]">
            Pricing
          </p>
          <h2 className="mt-2 font-[family-name:var(--font-display)] text-3xl text-[var(--ink)]">
            Partner terms — not self-serve checkout
          </h2>
        </BlurFade>
        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {PRICING.map((tier) => (
            <BlurFade key={tier.name}>
              <div className="flex h-full flex-col border border-[var(--line)] p-6">
                <h3 className="text-xl text-[var(--ink)]">{tier.name}</h3>
                <p className="mt-4 font-[family-name:var(--font-display)] text-3xl text-[var(--ink)]">
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
                <a
                  href={PARTNERS_MAILTO}
                  className="mt-8 block w-full rounded-xl bg-[var(--accent)] px-4 py-3 text-center font-medium text-[var(--accent-ink)]"
                >
                  {tier.cta}
                </a>
              </div>
            </BlurFade>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-10 sm:px-6">
        <p className="text-center text-xs text-[var(--muted)]">
          Agencies & platforms:{" "}
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
        * Roadmap connectors. Partner access only — no public adult signup.
      </p>
    </div>
  );
}
