"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { BorderBeam } from "@/components/magicui/border-beam";
import { BlurFade } from "@/components/magicui/effects";
import type { PersonaProfile, PersonaTab } from "./types";

const TABS: { id: PersonaTab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "mind", label: "Mind" },
  { id: "connections", label: "Connections" },
  { id: "photos", label: "Photos" },
  { id: "publish", label: "Publish" },
];

export function PersonaProfileShell({
  persona,
  displayName,
  tab,
  onTabChange,
  message,
  telegramPeerCount,
  children,
}: {
  persona: PersonaProfile;
  displayName: string;
  tab: PersonaTab;
  onTabChange: (tab: PersonaTab) => void;
  message: string | null;
  telegramPeerCount: number;
  children: React.ReactNode;
}) {
  const cover = persona.coverUrl ?? persona.photos[0]?.url ?? null;
  const initial = (displayName.trim()[0] || "?").toUpperCase();

  return (
    <div
      className="min-h-[calc(100vh-4rem)]"
      data-theme={persona.isAdult ? "after-dark" : undefined}
    >
      {/* Cover */}
      <div className="relative h-48 overflow-hidden sm:h-64 md:h-72">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 80% 60% at 30% 40%, var(--brand-glow), transparent 60%), radial-gradient(ellipse 50% 50% at 80% 20%, var(--brand-glow-2), transparent 55%), linear-gradient(160deg, var(--bg-elevated), var(--bg))",
            }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg)] via-[var(--bg)]/40 to-transparent" />
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 30%, var(--accent) 0.5px, transparent 0.6px), radial-gradient(circle at 70% 60%, var(--accent-2) 0.4px, transparent 0.5px)",
            backgroundSize: "48px 48px, 72px 72px",
          }}
        />
        <motion.div
          className="pointer-events-none absolute -left-20 top-10 h-40 w-40 rounded-full bg-[var(--accent)]/20 blur-3xl"
          animate={{ x: [0, 40, 0], opacity: [0.25, 0.45, 0.25] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="pointer-events-none absolute -right-10 bottom-0 h-48 w-48 rounded-full bg-[var(--accent-2)]/15 blur-3xl"
          animate={{ y: [0, -24, 0], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />

        <div className="absolute left-4 top-4 z-10 sm:left-6">
          <Link
            href="/personas"
            className="rounded-full border border-white/15 bg-black/30 px-3 py-1.5 text-sm text-white/90 backdrop-blur-md transition hover:bg-black/45"
          >
            ← Personas
          </Link>
        </div>
      </div>

      <div className="relative mx-auto max-w-5xl px-4 pb-16 sm:px-6">
        {/* Identity row */}
        <div className="relative -mt-14 flex flex-col gap-4 sm:-mt-16 sm:flex-row sm:items-end sm:gap-6">
          <BlurFade>
            <div className="relative h-28 w-28 shrink-0 sm:h-36 sm:w-36">
              <div className="absolute inset-0 overflow-hidden rounded-2xl border-4 border-[var(--bg)] bg-[var(--bg-elevated)] shadow-[0_12px_40px_rgba(0,0,0,0.35)]">
                {cover ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={cover}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-[var(--accent-soft)] font-[family-name:var(--font-display)] text-4xl text-[var(--accent)] sm:text-5xl">
                    {initial}
                  </div>
                )}
              </div>
              <BorderBeam
                size={80}
                duration={7}
                colorFrom="var(--accent)"
                colorTo="var(--accent-2)"
              />
            </div>
          </BlurFade>

          <div className="min-w-0 flex-1 pb-1">
            <BlurFade delay={0.05}>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-[var(--ink)] sm:text-4xl md:text-5xl">
                  {displayName}
                </h1>
                {persona.isAdult ? (
                  <span className="rounded-full border border-[var(--accent)]/40 bg-[var(--accent-soft)] px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-[var(--accent)]">
                    18+
                  </span>
                ) : null}
                {persona.isPublic ? (
                  <span className="rounded-full border border-[var(--line)] px-2 py-0.5 text-[10px] uppercase tracking-wider text-[var(--muted)]">
                    Public
                  </span>
                ) : null}
              </div>
              {persona.tagline ? (
                <p className="mt-1 max-w-xl text-sm text-[var(--muted)] sm:text-base">
                  {persona.tagline}
                </p>
              ) : (
                <p className="mt-1 text-sm text-[var(--muted)]">
                  Enter her mind — identity, memory, and every channel she lives
                  on.
                </p>
              )}
            </BlurFade>

            <BlurFade delay={0.1}>
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-[var(--muted)]">
                <Chip>Intensity {persona.intensity}/5</Chip>
                <Chip>
                  {persona.relationshipCount} relationship
                  {persona.relationshipCount === 1 ? "" : "s"}
                </Chip>
                <Chip>
                  {telegramPeerCount} Telegram peer
                  {telegramPeerCount === 1 ? "" : "s"}
                </Chip>
                <Chip>
                  {persona.memoryCount} memor
                  {persona.memoryCount === 1 ? "y" : "ies"}
                </Chip>
              </div>
            </BlurFade>
          </div>

          <BlurFade delay={0.12} className="flex flex-wrap gap-2 sm:pb-1">
            <CtaLink href={`/chat?characterId=${persona.id}`}>
              Test chat
            </CtaLink>
            <CtaLink href={`/personas/${persona.id}/memory`}>Memory</CtaLink>
            <CtaLink href={`/knowledge?characterId=${persona.id}`}>
              Live sources
            </CtaLink>
          </BlurFade>
        </div>

        {message ? (
          <p className="mt-4 text-sm text-[var(--accent)]">{message}</p>
        ) : null}

        {/* Tabs */}
        <div className="mt-6 border-b border-[var(--line)]">
          <nav className="-mb-px flex gap-1 overflow-x-auto" role="tablist">
            {TABS.map((t) => {
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => onTabChange(t.id)}
                  className={
                    active
                      ? "relative whitespace-nowrap border-b-2 border-[var(--accent)] px-4 py-3 text-sm font-medium text-[var(--ink)]"
                      : "whitespace-nowrap border-b-2 border-transparent px-4 py-3 text-sm text-[var(--muted)] transition hover:text-[var(--ink)]"
                  }
                >
                  {t.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="mt-6" role="tabpanel">
          {children}
        </div>
      </div>
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-[var(--line)] bg-[var(--bg-elevated)]/70 px-2.5 py-1 backdrop-blur-sm">
      {children}
    </span>
  );
}

function CtaLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="rounded-xl border border-[var(--line)] bg-[var(--bg-elevated)]/80 px-3.5 py-2 text-sm text-[var(--ink)] backdrop-blur-sm transition hover:border-[var(--accent)]"
    >
      {children}
    </Link>
  );
}
