"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useHexclaveApp, useUser } from "@hexclave/next";
import { AppNav } from "@/components/AppNav";
import { LegalFooter } from "@/components/LegalFooter";
import { ShimmerButton } from "@/components/magicui/effects";
import type { PublicCharacterView as PublicCharacter } from "@/lib/characters/public";

export function PublicCharacterView({
  character,
}: {
  character: PublicCharacter;
}) {
  const app = useHexclaveApp();
  const user = useUser({ or: "return-null" });
  const router = useRouter();
  const [loading, setLoading] = useState<"talk" | "fork" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function forkCharacter(thenTalk: boolean) {
    if (!user) {
      void app.redirectToSignUp();
      return;
    }
    setLoading(thenTalk ? "talk" : "fork");
    setError(null);
    try {
      const res = await fetch("/api/characters/fork", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          character.source === "showcase"
            ? { showcaseSlug: character.slug }
            : { characterId: character.id },
        ),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not create your version");
      router.push(
        thenTalk
          ? `/chat?characterId=${data.character.id}`
          : `/personas/${data.character.id}`,
      );
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(null);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <AppNav variant="marketing" />
      <main className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-start lg:py-16">
        <section>
          <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--accent)]">
            Public character
          </p>
          <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-semibold tracking-tight sm:text-5xl">
            {character.name}
          </h1>
          <p className="mt-4 max-w-xl text-lg text-[var(--muted)]">
            {character.tagline}
          </p>

          <div className="mt-6 flex flex-wrap gap-2">
            {character.categories.map((cat) => (
              <span
                key={cat}
                className="rounded-lg border border-[var(--line)] px-3 py-1 text-xs uppercase tracking-[0.16em] text-[var(--muted)]"
              >
                {cat}
              </span>
            ))}
            {character.isAdult ? (
              <span className="rounded-lg border border-[var(--accent)]/40 px-3 py-1 text-xs uppercase tracking-[0.16em] text-[var(--accent)]">
                18+
              </span>
            ) : null}
          </div>

          <dl className="mt-8 grid grid-cols-2 gap-4 text-sm sm:max-w-md">
            <div>
              <dt className="text-[var(--muted)]">Conversations</dt>
              <dd className="mt-1 font-[family-name:var(--font-display)] text-2xl">
                {character.conversationCount.toLocaleString()}
              </dd>
            </div>
            <div>
              <dt className="text-[var(--muted)]">Creator</dt>
              <dd className="mt-1 font-[family-name:var(--font-display)] text-2xl">
                {character.creatorLabel}
              </dd>
            </div>
          </dl>

          <div className="mt-10 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <ShimmerButton
              className="w-full sm:w-auto"
              onClick={() => void forkCharacter(true)}
            >
              {loading === "talk" ? "Opening…" : "Talk now"}
            </ShimmerButton>
            {character.allowFork ? (
              <button
                type="button"
                disabled={loading !== null}
                onClick={() => void forkCharacter(false)}
                className="w-full rounded-xl border border-[var(--line)] px-6 py-3.5 sm:w-auto disabled:opacity-50"
              >
                {loading === "fork"
                  ? "Creating…"
                  : "Create your own version"}
              </button>
            ) : null}
          </div>
          {character.allowFork ? (
            <p className="mt-3 text-xs text-[var(--muted)]">
              Fork this character to keep your own evolving version.
            </p>
          ) : null}
          {error ? (
            <p className="mt-3 text-sm text-[var(--danger)]">{error}</p>
          ) : null}
        </section>

        <section className="rounded-2xl border border-[var(--line)] bg-[var(--bg-elevated)]/80 p-5 shadow-[0_20px_80px_rgba(0,0,0,0.35)]">
          {character.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={character.photoUrl}
              alt=""
              className="mb-5 aspect-[4/5] w-full rounded-xl object-cover"
            />
          ) : (
            <div className="mb-5 flex aspect-[4/5] items-end rounded-xl bg-gradient-to-b from-[#122033] to-[#0a1018] p-5">
              <span className="font-[family-name:var(--font-display)] text-3xl">
                {character.name}
              </span>
            </div>
          )}
          <p className="text-[10px] uppercase tracking-[0.22em] text-[var(--muted)]">
            Opening line
          </p>
          <p className="mt-3 rounded-xl bg-[var(--bg)] px-4 py-3 text-[var(--ink)]">
            {character.openingLine}
          </p>
          {character.soulPreview ? (
            <>
              <p className="mt-6 text-[10px] uppercase tracking-[0.22em] text-[var(--muted)]">
                Who they are
              </p>
              <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
                {character.soulPreview}
                {character.soulPreview.length >= 200 ? "…" : ""}
              </p>
            </>
          ) : null}
        </section>
      </main>

      <div className="mx-auto max-w-6xl px-4 pb-10 sm:px-6">
        <Link
          href="/#explore"
          className="text-sm text-[var(--muted)] hover:text-[var(--ink)]"
        >
          ← Explore more characters
        </Link>
      </div>
      <LegalFooter variant="marketing" />
    </div>
  );
}
