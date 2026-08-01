"use client";

import Link from "next/link";
import { BorderBeam } from "@/components/magicui/border-beam";
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
      className="px-4 py-6 sm:px-6 sm:py-8"
      data-theme={persona.isAdult ? "after-dark" : undefined}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-5">
        <div className="relative h-16 w-16 shrink-0 sm:h-20 sm:w-20">
          <div className="absolute inset-0 overflow-hidden rounded-xl border border-white/[0.08] bg-[var(--bg-elevated)]">
            {cover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={cover}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-[var(--accent-soft)] font-[family-name:var(--font-display)] text-2xl text-[var(--accent)]">
                {initial}
              </div>
            )}
          </div>
          <BorderBeam
            size={60}
            duration={7}
            colorFrom="var(--accent)"
            colorTo="var(--accent-2)"
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight text-[var(--ink)] sm:text-3xl">
              {displayName}
            </h1>
            {persona.isAdult ? (
              <span className="rounded border border-[var(--accent)]/40 bg-[var(--accent-soft)] px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-[var(--accent)]">
                18+
              </span>
            ) : null}
            {persona.isPublic ? (
              <span className="rounded border border-[var(--line)] px-2 py-0.5 text-[10px] uppercase tracking-wider text-[var(--muted)]">
                Public
              </span>
            ) : null}
          </div>
          {persona.tagline ? (
            <p className="mt-1 max-w-xl text-sm text-[var(--muted)]">
              {persona.tagline}
            </p>
          ) : (
            <p className="mt-1 text-sm text-[var(--muted)]">
              Identity, memory, and every channel she lives on.
            </p>
          )}
          <div className="mt-2 flex flex-wrap gap-2 text-xs text-[var(--muted)]">
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
        </div>

        <div className="flex flex-wrap gap-2">
          <CtaLink href={`/chat?characterId=${persona.id}`}>Test chat</CtaLink>
          <CtaLink href={`/personas/${persona.id}/memory`}>Memory</CtaLink>
          <CtaLink href={`/knowledge?characterId=${persona.id}`}>
            Live sources
          </CtaLink>
        </div>
      </div>

      {message ? (
        <p className="mt-4 text-sm text-[var(--accent)]">{message}</p>
      ) : null}

      <div className="mt-6 border-b border-white/[0.06]">
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
                    ? "relative whitespace-nowrap border-b-2 border-[var(--accent)] px-3 py-2.5 text-sm font-medium text-[var(--ink)]"
                    : "whitespace-nowrap border-b-2 border-transparent px-3 py-2.5 text-sm text-[var(--muted)] transition hover:text-[var(--ink)]"
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
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-white/[0.08] bg-[var(--bg-elevated)]/70 px-2.5 py-1">
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
      className="rounded-lg border border-white/[0.08] bg-[var(--bg-elevated)]/80 px-3 py-2 text-sm text-[var(--ink)] transition hover:border-[var(--accent)]/40"
    >
      {children}
    </Link>
  );
}
