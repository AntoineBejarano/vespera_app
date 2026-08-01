"use client";

import Link from "next/link";

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
  coverUrl?: string | null;
  hasApiKey: boolean;
  bots: Bot[];
  peerCount: number;
};

export function PersonasList({ initial }: { initial: Persona[] }) {
  return (
    <div className="px-4 py-6 sm:px-6 sm:py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight text-[var(--ink)] sm:text-3xl">
            Personas
          </h1>
          <p className="mt-1 max-w-xl text-sm text-[var(--muted)]">
            Identity, memory, bots and API — one roster for every channel.
          </p>
        </div>
        <Link
          href="/personas/new"
          className="rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
        >
          New persona
        </Link>
      </div>

      {initial.length === 0 ? (
        <div className="mt-16 rounded-xl border border-dashed border-white/[0.1] px-6 py-16 text-center">
          <p className="text-[var(--muted)]">No personas yet.</p>
          <Link
            href="/personas/new"
            className="mt-4 inline-block rounded-lg border border-[var(--line)] px-4 py-2.5 text-sm"
          >
            Create your first
          </Link>
        </div>
      ) : (
        <ul className="mt-6 divide-y divide-white/[0.06] rounded-xl border border-white/[0.06] bg-[var(--bg-elevated)]/40">
          {initial.map((p) => {
            const initialLetter = (p.name.trim()[0] || "?").toUpperCase();
            return (
              <li key={p.id}>
                <div className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:gap-4 sm:px-5">
                  <Link
                    href={`/personas/${p.id}`}
                    className="flex min-w-0 flex-1 items-center gap-3"
                  >
                    <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border border-white/[0.08] bg-[var(--accent-soft)]">
                      {p.coverUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={p.coverUrl}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-sm font-medium text-[var(--accent)]">
                          {initialLetter}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="truncate font-medium text-[var(--ink)]">
                          {p.name}
                        </h2>
                        {p.active ? (
                          <span className="rounded border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-emerald-300">
                            Live
                          </span>
                        ) : null}
                        {p.hasApiKey ? (
                          <span className="rounded border border-[var(--accent)]/30 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-[var(--accent-2)]">
                            API
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-0.5 truncate text-xs text-[var(--muted)]">
                        Intensity {p.intensity}/5
                        {p.bots.length
                          ? ` · ${p.bots.map((b) => `@${b.username}`).join(", ")}`
                          : " · No bots"}
                        {` · ${p.peerCount} peers · ${p.photoCount} photos`}
                      </p>
                    </div>
                  </Link>
                  <div className="flex shrink-0 items-center gap-3 pl-[3.25rem] text-sm sm:pl-0">
                    <Link
                      href={`/chat?characterId=${p.id}`}
                      className="text-[var(--muted)] transition hover:text-[var(--ink)]"
                    >
                      Chat
                    </Link>
                    <Link
                      href={`/personas/${p.id}/memory`}
                      className="text-[var(--muted)] transition hover:text-[var(--ink)]"
                    >
                      Memory
                    </Link>
                    <Link
                      href={`/personas/${p.id}`}
                      className="rounded-lg border border-white/[0.08] px-3 py-1.5 text-[var(--ink)] transition hover:border-[var(--accent)]/40"
                    >
                      Open
                    </Link>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
