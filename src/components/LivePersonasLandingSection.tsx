"use client";

import Link from "next/link";
import { BlurFade, ShimmerButton } from "@/components/magicui/effects";
import {
  CONVERSATION_MODES,
  IDENTITY_LAYERS,
  LIVE_PERSONA_DISCLOSURE,
  LIVE_PERSONA_TAGLINE,
  LIVE_PERSONA_USE_CASES,
  LIVE_PIPELINE,
  SOURCE_TIERS,
} from "@/lib/knowledge/live-persona";

export function LivePersonasLandingSection() {
  return (
    <section
      id="live-personas"
      className="scroll-mt-24 border-y border-[var(--line)] bg-[var(--bg-elevated)]/25 py-16 sm:py-24"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <BlurFade>
          <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--accent)]">
            Live Personas
          </p>
          <h2 className="mt-3 max-w-3xl font-[family-name:var(--font-display)] text-3xl font-semibold sm:text-5xl">
            Keep a persona current without erasing who they were.
          </h2>
          <p className="mt-4 max-w-2xl text-[var(--muted)]">
            {LIVE_PERSONA_TAGLINE}
          </p>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--muted)]">
            For a living public figure, frame it as an AI interpretation based
            on public statements and verified sources — not the real person, not
            an official account, and never a source of private thoughts.
          </p>
        </BlurFade>

        {/* Pipeline */}
        <BlurFade delay={0.06}>
          <ol className="mt-12 flex flex-col gap-0 border-l border-[var(--line)] sm:flex-row sm:border-l-0 sm:border-t">
            {LIVE_PIPELINE.map((step, i) => (
              <li
                key={step}
                className="relative flex-1 border-[var(--line)] py-4 pl-5 sm:border-t-0 sm:border-l sm:px-4 sm:py-6 sm:pl-4 first:sm:border-l-0"
              >
                <span className="font-[family-name:var(--font-display)] text-xs text-[var(--accent)]">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <p className="mt-2 text-sm font-medium leading-snug text-[var(--ink)]">
                  {step}
                </p>
              </li>
            ))}
          </ol>
        </BlurFade>

        {/* Source tiers + identity layers */}
        <div className="mt-14 grid gap-12 lg:grid-cols-2">
          <BlurFade delay={0.08}>
            <h3 className="font-[family-name:var(--font-display)] text-2xl font-semibold">
              Source registry
            </h3>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Every Live Persona keeps an explicit list of trusted sources.
              Weight follows provenance — commentary never defines the
              character.
            </p>
            <ul className="mt-6 space-y-5">
              {SOURCE_TIERS.map((tier) => (
                <li key={tier.tier} className="border-l-2 border-[var(--accent)]/40 pl-4">
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <span className="font-[family-name:var(--font-display)] text-lg font-semibold">
                      Tier {tier.tier} — {tier.name}
                    </span>
                    <span className="text-[10px] uppercase tracking-[0.2em] text-[var(--muted)]">
                      {tier.weight}
                    </span>
                  </div>
                  <p className="mt-1.5 text-sm leading-relaxed text-[var(--muted)]">
                    {tier.examples.join(" · ")}
                  </p>
                </li>
              ))}
            </ul>
          </BlurFade>

          <BlurFade delay={0.1}>
            <h3 className="font-[family-name:var(--font-display)] text-2xl font-semibold">
              Identity in layers
            </h3>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Do not rewrite the whole character every time a new post appears.
              Separate what is stable from what moves.
            </p>
            <ul className="mt-6 space-y-6">
              {IDENTITY_LAYERS.map((layer) => (
                <li key={layer.name}>
                  <div className="flex flex-wrap items-baseline gap-x-3">
                    <h4 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--accent-2)]">
                      {layer.name}
                    </h4>
                    <span className="text-[10px] uppercase tracking-[0.2em] text-[var(--muted)]">
                      {layer.cadence}
                    </span>
                  </div>
                  <p className="mt-1.5 text-sm leading-relaxed text-[var(--muted)]">
                    {layer.items.join(" · ")}
                  </p>
                </li>
              ))}
            </ul>
            <p className="mt-8 font-[family-name:var(--font-display)] text-xl text-[var(--ink)]">
              Core identity + historical record + current public state + user
              relationship + retrieved evidence.
            </p>
          </BlurFade>
        </div>

        {/* Modes + freshness */}
        <div className="mt-14 grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
          <BlurFade delay={0.12}>
            <h3 className="font-[family-name:var(--font-display)] text-2xl font-semibold">
              Conversation modes
            </h3>
            <p className="mt-2 max-w-xl text-sm text-[var(--muted)]">
              The runtime knows whether it is repeating a documented statement,
              summarising sources, extrapolating, or roleplaying — and can say
              so.
            </p>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {CONVERSATION_MODES.map((mode) => (
                <li
                  key={mode.id}
                  className="rounded-xl border border-[var(--line)] px-4 py-3"
                >
                  <p className="text-sm font-medium text-[var(--ink)]">
                    {mode.name}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-[var(--muted)]">
                    {mode.description}
                  </p>
                </li>
              ))}
            </ul>
          </BlurFade>

          <BlurFade delay={0.14}>
            <div className="rounded-2xl border border-[var(--line)] bg-[var(--bg)]/60 p-5 sm:p-6">
              <p className="text-[10px] uppercase tracking-[0.22em] text-[var(--muted)]">
                Freshness
              </p>
              <p className="mt-3 font-[family-name:var(--font-display)] text-2xl font-semibold leading-snug">
                Updated 3 hours ago
              </p>
              <dl className="mt-5 space-y-3 text-sm">
                <div className="flex justify-between gap-3 border-b border-[var(--line)]/70 pb-2">
                  <dt className="text-[var(--muted)]">Verified sources</dt>
                  <dd>127</dd>
                </div>
                <div className="flex justify-between gap-3 border-b border-[var(--line)]/70 pb-2">
                  <dt className="text-[var(--muted)]">Latest source</dt>
                  <dd>Jul 31, 2026</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-[var(--muted)]">Identity changes</dt>
                  <dd>Reviewed</dd>
                </div>
              </dl>
              <p className="mt-5 text-xs leading-relaxed text-[var(--accent-2)]">
                Continuous ingestion + temporal identity + source attribution +
                controlled personality evolution.
              </p>
            </div>
          </BlurFade>
        </div>

        {/* Use cases */}
        <BlurFade delay={0.16}>
          <h3 className="mt-14 font-[family-name:var(--font-display)] text-2xl font-semibold">
            One capability. Many kinds of people.
          </h3>
          <ul className="mt-6 grid gap-2 sm:grid-cols-2">
            {LIVE_PERSONA_USE_CASES.map((item) => (
              <li
                key={item}
                className="border-l border-[var(--line)] pl-4 text-sm leading-relaxed text-[var(--muted)]"
              >
                {item}
              </li>
            ))}
          </ul>
        </BlurFade>

        {/* Disclosure */}
        <BlurFade delay={0.18}>
          <aside className="mt-12 border border-[var(--line)] bg-[var(--bg)]/50 px-5 py-5 sm:px-6">
            <p className="text-[10px] uppercase tracking-[0.22em] text-[var(--accent)]">
              Required disclosure
            </p>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-[var(--ink)]">
              {LIVE_PERSONA_DISCLOSURE}
            </p>
            <p className="mt-3 max-w-3xl text-xs leading-relaxed text-[var(--muted)]">
              Sensitive identity changes — politics, religion, health, family,
              endorsements — require human review. Publicly expressed sentiment
              is never presented as private emotion.
            </p>
          </aside>
        </BlurFade>

        <BlurFade delay={0.2} className="mt-10 flex flex-wrap items-center gap-4">
          <ShimmerButton href="/handler/sign-up">
            Build a Live Persona
          </ShimmerButton>
          <Link
            href="/knowledge"
            className="inline-flex rounded-xl border border-[var(--line)] px-5 py-3 text-sm hover:border-[var(--accent)]"
          >
            Open knowledge sources →
          </Link>
        </BlurFade>
      </div>
    </section>
  );
}
