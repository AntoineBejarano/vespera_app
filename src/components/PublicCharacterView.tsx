"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "motion/react";
import { useHexclaveApp, useUser } from "@hexclave/next";
import { AppNav } from "@/components/AppNav";
import { LegalFooter } from "@/components/LegalFooter";
import { BorderBeam } from "@/components/magicui/border-beam";
import { BlurFade, ShimmerButton } from "@/components/magicui/effects";
import { PublicMindPreview } from "@/components/persona/PublicMindPreview";
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

  const avatar = character.photoUrl;
  const initial = (character.name.trim()[0] || "?").toUpperCase();
  const gallery = character.photos.slice(0, 6);

  return (
    <div
      className="relative min-h-screen overflow-hidden"
      data-theme={character.isAdult ? "after-dark" : undefined}
    >
      <AppNav variant={character.isAdult ? "after-dark" : "marketing"} />

      {/* Compact identity bar — no giant header photo */}
      <header className="relative border-b border-[var(--line)]">
        <div
          className="pointer-events-none absolute inset-0 opacity-80"
          style={{
            background:
              "radial-gradient(ellipse 55% 80% at 10% 0%, var(--brand-glow), transparent 60%), radial-gradient(ellipse 40% 60% at 90% 20%, var(--brand-glow-2), transparent 55%)",
          }}
        />
        <motion.div
          className="pointer-events-none absolute left-1/4 top-0 h-32 w-32 rounded-full bg-[var(--accent)]/15 blur-3xl"
          animate={{ opacity: [0.2, 0.45, 0.2] }}
          transition={{ duration: 7, repeat: Infinity }}
        />

        <div className="relative mx-auto flex max-w-5xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-end sm:justify-between sm:px-6 sm:py-12">
          <BlurFade>
            <div className="flex items-end gap-4">
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--bg-elevated)] sm:h-24 sm:w-24">
                {avatar ? (
                  <Image
                    src={avatar}
                    alt={character.name}
                    fill
                    priority
                    sizes="96px"
                    className="object-cover object-top"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-[var(--accent-soft)] font-[family-name:var(--font-display)] text-3xl text-[var(--accent)]">
                    {initial}
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  {character.isAdult ? (
                    <span className="rounded-full border border-[var(--accent)]/40 bg-[var(--accent-soft)] px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] text-[var(--accent)]">
                      18+
                    </span>
                  ) : null}
                  <span className="text-xs text-[var(--muted)]">
                    by {character.creatorLabel}
                  </span>
                </div>
                <h1 className="mt-1 font-[family-name:var(--font-display)] text-4xl font-semibold tracking-tight text-[var(--ink)] sm:text-5xl md:text-6xl">
                  {character.name}
                </h1>
                <p className="mt-2 max-w-xl text-sm text-[var(--muted)] sm:text-base">
                  {character.tagline}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {character.categories.map((cat) => (
                    <span
                      key={cat}
                      className="rounded-full border border-[var(--line)] px-2.5 py-0.5 text-[11px] uppercase tracking-[0.12em] text-[var(--muted)]"
                    >
                      {cat}
                    </span>
                  ))}
                  <span className="rounded-full border border-[var(--line)] px-2.5 py-0.5 text-[11px] text-[var(--muted)]">
                    Intensity {character.intensity}/5
                  </span>
                  <span className="rounded-full border border-[var(--line)] px-2.5 py-0.5 text-[11px] text-[var(--muted)]">
                    {character.conversationCount.toLocaleString()} conversations
                  </span>
                </div>
              </div>
            </div>
          </BlurFade>

          <BlurFade delay={0.08}>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
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
                  className="w-full rounded-xl border border-[var(--line)] px-5 py-3.5 text-sm sm:w-auto disabled:opacity-50"
                >
                  {loading === "fork" ? "Creating…" : "Make your version"}
                </button>
              ) : null}
            </div>
            {error ? (
              <p className="mt-2 text-sm text-[var(--danger)]">{error}</p>
            ) : null}
          </BlurFade>
        </div>
      </header>

      {/* Mind graph is the wow centerpiece */}
      <section className="relative mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
        <BlurFade>
          <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--accent)]">
            Inside their mind
          </p>
          <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl text-[var(--ink)] sm:text-4xl">
            How {character.name} thinks
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">
            A live knowledge graph built from their soul, style, rules, context
            and linked knowledge — pan, zoom, click nodes. Private memories stay
            private.
          </p>
        </BlurFade>
        <div className="mt-8">
          <PublicMindPreview slug={character.slug} />
        </div>
      </section>

      {/* Opening + soul */}
      <section className="border-y border-[var(--line)] bg-[var(--bg-elevated)]/35">
        <div className="mx-auto grid max-w-5xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2">
          <BlurFade>
            <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--muted)]">
              First words
            </p>
            <blockquote className="mt-4 font-[family-name:var(--font-display)] text-2xl leading-snug text-[var(--ink)] sm:text-3xl">
              “{character.openingLine}”
            </blockquote>
          </BlurFade>
          {character.soulPreview ? (
            <BlurFade delay={0.05}>
              <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--muted)]">
                Who they are
              </p>
              <p className="mt-4 text-sm leading-relaxed text-[var(--ink)] sm:text-base">
                {character.soulPreview}
                {character.soulPreview.length >= 200 ? "…" : ""}
              </p>
            </BlurFade>
          ) : null}
        </div>
      </section>

      {character.layers.length > 1 ? (
        <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
          <BlurFade>
            <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--muted)]">
              Identity layers
            </p>
          </BlurFade>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {character.layers.map((layer, i) => (
              <BlurFade key={layer.key} delay={0.04 * i}>
                <div className="rounded-2xl border border-[var(--line)] bg-[var(--bg)]/50 p-4">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--accent)]">
                    {layer.label}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
                    {layer.preview}
                    {layer.preview.length >= 150 ? "…" : ""}
                  </p>
                </div>
              </BlurFade>
            ))}
          </div>
        </section>
      ) : null}

      {gallery.length > 1 ? (
        <section className="border-t border-[var(--line)]">
          <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
            <BlurFade>
              <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--muted)]">
                Presence
              </p>
            </BlurFade>
            <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3">
              {gallery.map((url, i) => (
                <BlurFade key={url} delay={0.03 * i}>
                  <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-[var(--line)]">
                    <Image
                      src={url}
                      alt=""
                      fill
                      sizes="(max-width: 768px) 50vw, 33vw"
                      className="object-cover transition duration-700 hover:scale-[1.03]"
                    />
                  </div>
                </BlurFade>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
        <BlurFade>
          <div className="relative overflow-hidden rounded-3xl border border-[var(--line)] px-6 py-12 text-center sm:px-12">
            <div
              className="pointer-events-none absolute inset-0 opacity-50"
              style={{
                background:
                  "radial-gradient(ellipse 60% 80% at 50% 0%, var(--brand-glow), transparent 70%)",
              }}
            />
            <p className="relative font-[family-name:var(--font-display)] text-3xl text-[var(--ink)]">
              Step into {character.name}
            </p>
            <div className="relative mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <ShimmerButton onClick={() => void forkCharacter(true)}>
                {loading === "talk" ? "Opening…" : "Talk now"}
              </ShimmerButton>
              <Link
                href="/explore"
                className="rounded-xl border border-[var(--line)] px-6 py-3.5 text-sm text-[var(--muted)] hover:text-[var(--ink)]"
              >
                Explore more
              </Link>
            </div>
            <BorderBeam
              size={120}
              duration={9}
              colorFrom="var(--accent)"
              colorTo="var(--accent-2)"
            />
          </div>
        </BlurFade>
      </section>

      <LegalFooter variant="marketing" />
    </div>
  );
}
