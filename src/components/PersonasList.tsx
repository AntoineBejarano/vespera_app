"use client";

import Link from "next/link";
import { MagicCard } from "@/components/magicui/magic-card";

type Bot = {
  id: string;
  username: string;
  active: boolean;
  label: string | null;
  peerCount: number;
};

type Persona = {
  id: string;
  name: string;
  intensity: number;
  active: boolean;
  updatedAt: string;
  photoCount: number;
  hasApiKey: boolean;
  bots: Bot[];
  peerCount: number;
};

export function PersonasList({ initial }: { initial: Persona[] }) {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-[var(--accent)]">
            Roster
          </p>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl font-semibold tracking-tight text-[var(--ink)]">
            Personas
          </h1>
          <p className="mt-2 max-w-lg text-[var(--muted)]">
            Create N personalities. Each one can power Telegram bots and a chat
            API — isolated conversations per peer.
          </p>
        </div>
        <Link
          href="/personas/new"
          className="rounded-xl bg-[var(--accent)] px-5 py-3 font-medium text-white"
        >
          New persona
        </Link>
      </div>

      {initial.length === 0 ? (
        <div className="mt-16 text-center">
          <p className="text-[var(--muted)]">No personas yet.</p>
          <Link
            href="/personas/new"
            className="mt-6 inline-block rounded-xl border border-[var(--line)] px-5 py-3"
          >
            Create your first
          </Link>
        </div>
      ) : (
        <ul className="mt-10 grid gap-4 sm:grid-cols-2">
          {initial.map((p) => (
            <li key={p.id}>
              <Link href={`/personas/${p.id}`} className="block h-full">
                <MagicCard className="h-full">
                  <div className="p-5">
                    <div className="flex items-baseline justify-between gap-2">
                      <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-[var(--ink)]">
                        {p.name}
                      </h2>
                      <span className="text-xs text-[var(--muted)]">
                        {p.intensity}/5
                        {p.active ? " · live" : ""}
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
                      {p.bots.length} bot{p.bots.length === 1 ? "" : "s"}
                      {p.bots.length
                        ? ` · ${p.bots.map((b) => `@${b.username}`).join(", ")}`
                        : ""}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2 text-[11px] uppercase tracking-wider text-[var(--muted)]">
                      <span className="rounded-full border border-[var(--line)] px-2.5 py-1">
                        {p.peerCount} peers
                      </span>
                      <span className="rounded-full border border-[var(--line)] px-2.5 py-1">
                        {p.photoCount} photos
                      </span>
                      {p.hasApiKey ? (
                        <span className="rounded-full border border-[var(--accent)]/40 px-2.5 py-1 text-[var(--accent-2)]">
                          API
                        </span>
                      ) : null}
                    </div>
                  </div>
                </MagicCard>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
