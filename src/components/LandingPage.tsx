"use client";

import { useEffect } from "react";
import Image from "next/image";
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
import { LANDING_IMAGES } from "@/lib/landing/images";
import { VoiceLandingSection } from "@/components/VoiceLandingSection";

const CATEGORIES = [
  {
    id: "companions",
    title: "Companions",
    body: "Characters built for connection, intimacy and long-term relationships.",
    href: "/c/luna",
    image: LANDING_IMAGES.companion,
  },
  {
    id: "historical",
    title: "Historical Minds",
    body: "Learn and debate with personalities inspired by history’s greatest thinkers.",
    href: "/c/einstein",
    image: LANDING_IMAGES.einstein,
  },
  {
    id: "roleplay",
    title: "Roleplay & Stories",
    body: "Build characters for worlds, adventures and interactive fiction.",
    href: "/c/aiko",
    image: LANDING_IMAGES.anime,
  },
  {
    id: "mentors",
    title: "Mentors",
    body: "Create coaches, tutors and guides that understand their users over time.",
    href: "/c/stoic-mentor",
    image: LANDING_IMAGES.stoic,
  },
  {
    id: "creators",
    title: "Virtual Creators",
    body: "Build original digital personalities for communities and audiences.",
    href: "#creators",
    image: LANDING_IMAGES.creator,
  },
  {
    id: "original",
    title: "Original Characters",
    body: "Turn any idea, artwork or story into an interactive personality.",
    href: "/c/luna",
    image: LANDING_IMAGES.fantasy,
  },
];

const PROBLEMS = [
  {
    t: "They forget",
    d: "Important moments vanish after a few conversations.",
  },
  {
    t: "They drift",
    d: "Personality, tone and relationships become inconsistent.",
  },
  {
    t: "They stay trapped",
    d: "Your character cannot easily move to another model or platform.",
  },
];

const SOLUTIONS = [
  {
    t: "A real identity",
    d: "Define who they are, what they want, how they speak and what they will never become.",
  },
  {
    t: "Long-term memory",
    d: "They remember people, events, preferences, promises and the moments that shape the relationship.",
  },
  {
    t: "Evolving relationships",
    d: "Every user develops a different history with the same character.",
  },
  {
    t: "Consistent anywhere",
    d: "Keep the same identity when you change models, devices or channels.",
  },
];

const STEPS = [
  {
    n: "1",
    t: "Describe them",
    d: "Start with a sentence, an image, an existing character file or your own detailed configuration.",
  },
  {
    n: "2",
    t: "Shape their personality",
    d: "Adjust voice, boundaries, humor, emotion, knowledge and relationship style.",
  },
  {
    n: "3",
    t: "Talk and improve",
    d: "Test conversations, correct mistakes and teach the character what should remain consistent.",
  },
  {
    n: "4",
    t: "Share or deploy",
    d: "Chat privately, publish a link or connect the character to supported channels.",
  },
];

const IMPORT_OPTIONS = [
  "Upload a Character Card",
  "Paste a character prompt",
  "Import JSON",
  "Upload conversations",
  "Rebuild from a description",
];

const COMPARE = [
  {
    ordinary: "Forgets past conversations",
    vesperer: "Remembers meaningful events",
  },
  {
    ordinary: "Repeats the same behavior",
    vesperer: "Evolves through interaction",
  },
  {
    ordinary: "Personality drifts",
    vesperer: "Keeps a stable identity",
  },
  {
    ordinary: "Locked to one platform",
    vesperer: "Can move across supported environments",
  },
  {
    ordinary: "Hard to improve safely",
    vesperer: "Test, compare and restore versions",
  },
];

const VERSIONS = [
  "Luna — Original",
  "Luna — More playful",
  "Luna — Dark romance",
  "Luna — Public version",
];

const AUDIENCES = [
  {
    t: "For yourself",
    d: "Create private companions, mentors and characters that remain entirely yours.",
  },
  {
    t: "For creators",
    d: "Build original personalities your audience can talk to every day.",
  },
  {
    t: "For studios",
    d: "Manage, test and deploy multiple characters from one workspace.",
  },
];

const MOSAIC = [
  { label: "Companion", image: LANDING_IMAGES.companion, href: "/c/luna" },
  { label: "Einstein", image: LANDING_IMAGES.einstein, href: "/c/einstein" },
  { label: "Anime", image: LANDING_IMAGES.anime, href: "/c/aiko" },
  {
    label: "Stoic mentor",
    image: LANDING_IMAGES.stoic,
    href: "/c/stoic-mentor",
  },
  { label: "Fantasy", image: LANDING_IMAGES.fantasy, href: "/c/luna" },
];

const PRICING = [
  {
    name: "Starter",
    price: "Free",
    period: "",
    blurb: "Create your first character and start talking.",
    features: [
      "1 character",
      "Long-term memory basics",
      "Private chat",
      "Bring an existing character",
    ],
    cta: "Create a character",
    highlight: false,
  },
  {
    name: "Creator",
    price: "€20",
    period: "/mo",
    blurb: "One living character with deeper memory and deploy options.",
    features: [
      "1 production character",
      "Persistent memory",
      "Version history",
      "Channel deploy (Telegram)",
      "Export identity & config",
    ],
    cta: "Start creating",
    highlight: true,
  },
  {
    name: "Studio",
    price: "€59",
    period: "/mo",
    blurb: "A small roster for creators and teams.",
    features: [
      "Up to 3 characters",
      "Compare & restore versions",
      "Priority routing",
      "Multi-channel deploy",
      "Workspace controls",
    ],
    cta: "Scale to Studio",
    highlight: false,
  },
];

export function LandingPage() {
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
    <div className="relative overflow-hidden">
      <AppNav variant="marketing" />

      {/* 1. Hero */}
      <section className="relative min-h-[90dvh] px-4 pb-16 pt-10 sm:min-h-[92vh] sm:px-6 sm:pb-20 sm:pt-14">
        <RetroGrid />
        <div className="relative mx-auto grid max-w-6xl gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-16">
          <div>
            <BlurFade>
              <BrandLogo href="/" size="hero" priority className="mb-6" />
            </BlurFade>
            <BlurFade delay={0.06}>
              <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--accent)] sm:text-xs sm:tracking-[0.35em]">
                AI character creation
              </p>
            </BlurFade>
            <BlurFade delay={0.1}>
              <h1 className="mt-3 max-w-xl font-[family-name:var(--font-display)] text-[2.15rem] leading-[1.05] tracking-tight text-[var(--ink)] sm:text-5xl sm:leading-[1.05]">
                Create characters people{" "}
                <span className="italic text-[var(--accent-2)]">never forget</span>
                .
              </h1>
            </BlurFade>
            <BlurFade delay={0.16}>
              <p className="mt-5 max-w-lg text-base leading-relaxed text-[var(--muted)] sm:text-lg">
                Give any AI character a consistent personality, long-term memory
                and relationships that evolve naturally over time.
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
                Create your first character
              </ShimmerButton>
              <Link
                href="/bring"
                className="inline-flex w-full items-center justify-center rounded-xl border border-[var(--line)] px-6 py-3.5 text-center sm:w-auto"
              >
                Bring an existing character
              </Link>
            </BlurFade>
            <p className="mt-4 text-xs text-[var(--muted)]">
              Start free. No technical setup required.
            </p>
          </div>

          <BlurFade delay={0.18} className="relative w-full">
            <div className="grid grid-cols-3 gap-2 pb-2 sm:gap-3 sm:pb-3">
              {MOSAIC.map((item, i) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`group relative aspect-[3/4] overflow-hidden rounded-2xl ring-1 ring-white/10 transition duration-500 hover:ring-[var(--accent-2)]/50 ${
                    i === 2 ? "translate-y-3 sm:translate-y-4" : ""
                  } ${i === 1 || i === 4 ? "translate-y-1.5 sm:translate-y-2" : ""}`}
                >
                  <Image
                    src={item.image.src}
                    alt={item.image.alt}
                    fill
                    sizes="(max-width: 1024px) 30vw, 180px"
                    priority={i < 3}
                    className="object-cover object-top transition duration-700 group-hover:scale-[1.04]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-2.5 sm:p-3">
                    <span className="text-[10px] uppercase tracking-[0.2em] text-[var(--accent-2)]">
                      {item.label}
                    </span>
                  </div>
                </Link>
              ))}
            </div>

            <div className="relative z-10 mx-auto mt-3 w-[min(100%,22rem)] rounded-2xl border border-[var(--line)] bg-[var(--bg-elevated)]/95 p-3.5 shadow-[0_16px_50px_rgba(91,173,238,0.16)] backdrop-blur-md sm:mt-4 sm:w-[min(100%,24rem)] sm:p-4">
              <p className="text-[10px] uppercase tracking-[0.22em] text-[var(--muted)]">
                Memory · live
              </p>
              <div className="mt-2.5 space-y-2 text-sm">
                <p className="ml-8 rounded-xl bg-[var(--accent-soft)] px-3 py-2 text-right text-[var(--ink)] sm:ml-10">
                  You remembered.
                </p>
                <p className="mr-4 rounded-xl bg-[var(--bg)] px-3 py-2 text-[var(--ink)] sm:mr-6">
                  Of course. You told me before your interview last Thursday.
                </p>
              </div>
              <p className="mt-2.5 text-xs text-[var(--accent-2)]">
                Your character remembers everything that matters.
              </p>
            </div>
          </BlurFade>
        </div>
      </section>

      {/* Category strip */}
      <section className="border-y border-[var(--line)] py-6">
        <Marquee className="px-4">
          {CATEGORIES.map((c) => (
            <span
              key={c.id}
              className="whitespace-nowrap text-sm uppercase tracking-[0.22em] text-[var(--muted)]"
            >
              {c.title}
            </span>
          ))}
        </Marquee>
      </section>

      {/* 2. Categories */}
      <section
        id="explore"
        className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24"
      >
        <BlurFade>
          <h2 className="font-[family-name:var(--font-display)] text-3xl font-semibold sm:text-4xl">
            Who do you want to bring to life?
          </h2>
        </BlurFade>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CATEGORIES.map((cat, i) => (
            <BlurFade key={cat.id} delay={i * 0.05}>
              <a
                href={cat.href}
                className="group flex h-full flex-col overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--bg-elevated)]/70 transition hover:border-[var(--accent)]/40 hover:bg-[var(--bg-elevated)]"
              >
                <div className="relative aspect-[16/10] overflow-hidden">
                  <Image
                    src={cat.image.src}
                    alt={cat.image.alt}
                    fill
                    sizes="(max-width: 1024px) 50vw, 360px"
                    className="object-cover object-top transition duration-700 group-hover:scale-[1.04]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-elevated)] via-transparent to-transparent" />
                </div>
                <div className="flex flex-1 flex-col p-5 pt-3">
                  <h3 className="font-[family-name:var(--font-display)] text-xl font-semibold">
                    {cat.title}
                  </h3>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-[var(--muted)]">
                    {cat.body}
                  </p>
                </div>
              </a>
            </BlurFade>
          ))}
        </div>
        <p className="mt-6 text-sm text-[var(--muted)]">
          Private adult companions live separately in{" "}
          <Link href="/after-dark" className="text-[var(--accent-2)]">
            Vesperer After Dark
          </Link>
          .
        </p>
      </section>

      <VoiceLandingSection />

      {/* 3. Problem */}
      <section className="border-y border-[var(--line)] bg-[var(--bg-elevated)]/35 py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <BlurFade>
            <h2 className="max-w-2xl font-[family-name:var(--font-display)] text-3xl font-semibold sm:text-4xl">
              Most AI characters forget who they are.
            </h2>
            <p className="mt-4 max-w-2xl text-[var(--muted)]">
              Their personality changes. Their memories disappear. Every
              conversation starts feeling the same. And when the platform
              changes, the character you built may be gone.
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

      {/* 4. Solution */}
      <section
        id="features"
        className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24"
      >
        <BlurFade>
          <h2 className="font-[family-name:var(--font-display)] text-3xl font-semibold sm:text-4xl">
            A character that actually grows with you.
          </h2>
          <p className="mt-3 max-w-2xl text-[var(--muted)]">
            Create it once. Let it live anywhere.
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
      </section>

      {/* 5. Creation flow */}
      <section
        id="create"
        className="border-y border-[var(--line)] py-16 sm:py-24"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <BlurFade>
            <h2 className="font-[family-name:var(--font-display)] text-3xl font-semibold sm:text-4xl">
              From idea to living character in minutes.
            </h2>
            <p className="mt-3 max-w-2xl text-[var(--muted)]">
              Describe. Talk. Improve. Share.
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
              Build a character
            </ShimmerButton>
          </BlurFade>
        </div>
      </section>

      {/* 6. Bring character */}
      <section
        id="bring"
        className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24"
      >
        <div className="grid gap-10 lg:grid-cols-[1fr_1fr] lg:items-center">
          <BlurFade>
            <h2 className="font-[family-name:var(--font-display)] text-3xl font-semibold sm:text-4xl">
              Already created a character somewhere else?
            </h2>
            <p className="mt-4 max-w-xl text-[var(--muted)]">
              Bring your own character description, prompt, card or conversation
              history. Vesperer helps reconstruct its identity and memories
              without forcing you to start from zero.
            </p>
            <div className="mt-8">
              <Link
                href="/bring"
                className="inline-flex rounded-xl bg-[var(--accent)] px-6 py-3.5 font-medium text-[var(--accent-ink)]"
              >
                Bring my character
              </Link>
            </div>
            <p className="mt-4 max-w-md text-xs leading-relaxed text-[var(--muted)]/80">
              Only import characters and content you created or have permission
              to use.
            </p>
          </BlurFade>
          <BlurFade delay={0.1}>
            <ul className="space-y-3">
              {IMPORT_OPTIONS.map((opt) => (
                <li
                  key={opt}
                  className="rounded-xl border border-[var(--line)] bg-[var(--bg-elevated)] px-4 py-3 text-sm"
                >
                  {opt}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-[var(--muted)]">
              Supported formats: Character Card · JSON · prompt & description ·
              conversation export · SillyTavern · manual recreation · your own
              files.
            </p>
          </BlurFade>
        </div>
      </section>

      {/* 7. Before / after */}
      <section className="border-y border-[var(--line)] bg-[var(--bg-elevated)]/35 py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <BlurFade>
            <h2 className="font-[family-name:var(--font-display)] text-3xl font-semibold sm:text-4xl">
              Not just another prompt.
            </h2>
          </BlurFade>
          <div className="mt-10 overflow-hidden rounded-2xl border border-[var(--line)]">
            <div className="grid grid-cols-2 bg-[var(--bg)] text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
              <div className="border-b border-r border-[var(--line)] px-4 py-3">
                Ordinary character
              </div>
              <div className="border-b border-[var(--line)] px-4 py-3 text-[var(--accent)]">
                Vesperer character
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

      {/* 8. Versioning */}
      <section
        id="versions"
        className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24"
      >
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <BlurFade>
            <h2 className="font-[family-name:var(--font-display)] text-3xl font-semibold sm:text-4xl">
              Change them without losing who they were.
            </h2>
            <p className="mt-4 max-w-xl text-[var(--muted)]">
              Try a warmer personality, a darker storyline or a different
              speaking style. Compare versions and return to an earlier one
              whenever you need.
            </p>
            <p className="mt-4 text-sm text-[var(--muted)]/80">
              Version history, forks and behavioral comparison — when you want
              the deeper tools.
            </p>
          </BlurFade>
          <BlurFade delay={0.1}>
            <div className="rounded-2xl border border-[var(--line)] bg-[var(--bg-elevated)] p-5">
              <ul className="space-y-2">
                {VERSIONS.map((v, i) => (
                  <li
                    key={v}
                    className={`rounded-xl px-4 py-3 text-sm ${
                      i === 0
                        ? "bg-[var(--accent-soft)] text-[var(--ink)] ring-1 ring-[var(--accent)]/40"
                        : "bg-[var(--bg)] text-[var(--muted)]"
                    }`}
                  >
                    {v}
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex flex-wrap gap-2">
                {["Compare", "Restore", "Duplicate"].map((action) => (
                  <span
                    key={action}
                    className="rounded-lg border border-[var(--line)] px-3 py-1.5 text-xs uppercase tracking-[0.16em] text-[var(--muted)]"
                  >
                    {action}
                  </span>
                ))}
              </div>
            </div>
          </BlurFade>
        </div>
      </section>

      {/* 9. Audiences */}
      <section
        id="creators"
        className="border-y border-[var(--line)] py-16 sm:py-24"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <BlurFade>
            <h2 className="max-w-3xl font-[family-name:var(--font-display)] text-3xl font-semibold sm:text-4xl">
              Keep it private. Share it with one person. Or build an audience.
            </h2>
          </BlurFade>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {AUDIENCES.map((a, i) => (
              <BlurFade key={a.t} delay={i * 0.07}>
                <div
                  id={a.t === "For studios" ? "studios" : undefined}
                  className="h-full rounded-2xl border border-[var(--line)] bg-[var(--bg-elevated)]/70 p-6"
                >
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
        </div>
      </section>

      {/* Ownership */}
      <section
        id="ownership"
        className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20"
      >
        <BlurFade>
          <h2 className="font-[family-name:var(--font-display)] text-3xl font-semibold sm:text-4xl">
            Your character should belong to you.
          </h2>
          <p className="mt-4 max-w-2xl text-[var(--muted)]">
            Export its identity, memories and configuration. Your character is
            not permanently tied to one model or one platform.
          </p>
        </BlurFade>
      </section>

      {/* Pricing */}
      <section
        id="pricing"
        className="border-y border-[var(--line)] bg-[var(--bg-elevated)]/35 py-16 sm:py-24"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <BlurFade>
            <h2 className="font-[family-name:var(--font-display)] text-3xl font-semibold sm:text-4xl">
              Pricing
            </h2>
            <p className="mt-3 text-[var(--muted)]">
              Start free. Grow when your characters do.
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
          <p className="mt-6 text-sm text-[var(--muted)]">
            Looking for private adult companions and agency seats?{" "}
            <Link href="/after-dark#pricing" className="text-[var(--accent)]">
              See Vesperer After Dark
            </Link>
            .
          </p>
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
        <BlurFade>
          <h2 className="max-w-3xl font-[family-name:var(--font-display)] text-3xl font-semibold leading-tight sm:text-5xl">
            Some characters are used for a conversation.
            <span className="mt-3 block italic text-[var(--accent-2)]">
              The best ones become part of your life.
            </span>
          </h2>
          <div className="mt-10">
            <ShimmerButton onClick={() => app.redirectToSignUp()}>
              Create your first character
            </ShimmerButton>
          </div>
        </BlurFade>
      </section>

      <LegalFooter variant="marketing" />
    </div>
  );
}
