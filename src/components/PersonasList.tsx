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
  hasApiKey: boolean;
  bots: Bot[];
  peerCount: number;
};

export function PersonasList({ initial }: { initial: Persona[] }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--accent)]">
            Admin
          </p>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl text-[var(--ink)]">
            Personas
          </h1>
          <p className="mt-2 max-w-lg text-[var(--muted)]">
            Create N personalities. Each one can power Telegram bots and a chat
            API — isolated conversations per peer.
          </p>
        </div>
        <Link
          href="/personas/new"
          className="bg-[var(--accent)] px-5 py-3 text-[var(--bg)]"
        >
          New persona
        </Link>
      </div>

      {initial.length === 0 ? (
        <div className="mt-16 text-center">
          <p className="text-[var(--muted)]">No personas yet.</p>
          <Link
            href="/personas/new"
            className="mt-6 inline-block border border-[var(--line)] px-5 py-3"
          >
            Create your first
          </Link>
        </div>
      ) : (
        <ul className="mt-10 space-y-3">
          {initial.map((p) => (
            <li key={p.id}>
              <Link
                href={`/personas/${p.id}`}
                className="block border border-[var(--line)] bg-[var(--bg-elevated)] p-4 transition hover:border-[var(--accent)]"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
                    {p.name}
                  </h2>
                  <span className="text-xs text-[var(--muted)]">
                    intensity {p.intensity}/5
                    {p.active ? " · default" : ""}
                  </span>
                </div>
                <p className="mt-2 text-sm text-[var(--muted)]">
                  {p.bots.length} bot{p.bots.length === 1 ? "" : "s"}
                  {p.bots.length
                    ? ` (${p.bots.map((b) => `@${b.username}`).join(", ")})`
                    : ""}
                  {" · "}
                  {p.peerCount} peers · {p.photoCount} photos
                  {p.hasApiKey ? " · API key" : ""}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
