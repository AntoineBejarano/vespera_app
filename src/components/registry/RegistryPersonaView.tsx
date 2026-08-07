"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "motion/react";
import { LegalFooter } from "@/components/LegalFooter";
import { MarketingNav } from "@/components/MarketingNav";
import { BlurFade, ShimmerButton } from "@/components/magicui/effects";
import type { RegistryPersonaView as RegistryPersona } from "@/lib/registry/public";

export function RegistryPersonaView({ persona }: { persona: RegistryPersona }) {
  const router = useRouter();
  const [loading, setLoading] = useState<"fork" | "talk" | null>(null);
  const [exporting, setExporting] = useState<"chai" | "character_card" | null>(
    null,
  );
  const [exportText, setExportText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function forkPersona(thenTalk: boolean) {
    setLoading(thenTalk ? "talk" : "fork");
    setError(null);
    try {
      const res = await fetch("/api/characters/fork", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          persona.source === "showcase"
            ? { showcaseSlug: persona.slug }
            : { characterId: persona.id },
        ),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          window.location.href = "/handler/sign-up";
          return;
        }
        throw new Error(data.error ?? "Could not fork");
      }
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

  async function loadExport(format: "chai" | "character_card") {
    setExporting(format);
    setError(null);
    try {
      const res = await fetch(
        `/api/public/characters/${persona.slug}/export?format=${format}`,
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Export failed");
      setExportText(JSON.stringify(data, null, 2));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed");
    } finally {
      setExporting(null);
    }
  }

  async function copyExport() {
    if (!exportText) return;
    await navigator.clipboard.writeText(exportText);
  }

  const avatar = persona.photoUrl;
  const initial = (persona.name.trim()[0] || "?").toUpperCase();

  return (
    <div
      className="relative min-h-screen overflow-hidden"
      data-theme={persona.isAdult ? "after-dark" : undefined}
    >
      <MarketingNav variant={persona.isAdult ? "after-dark" : "marketing"} />

      <header className="relative border-b border-[var(--line)]">
        <div
          className="pointer-events-none absolute inset-0 opacity-80"
          style={{
            background:
              "radial-gradient(ellipse 55% 80% at 10% 0%, var(--brand-glow), transparent 60%), radial-gradient(ellipse 40% 60% at 90% 20%, var(--brand-glow-2), transparent 55%)",
          }}
        />
        <motion.div
          className="pointer-events-none absolute right-1/4 top-8 h-40 w-40 rounded-full bg-[var(--accent)]/10 blur-3xl"
          animate={{ opacity: [0.15, 0.4, 0.15] }}
          transition={{ duration: 8, repeat: Infinity }}
        />

        <div className="relative mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
          <BlurFade>
            <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--accent)]">
              Persona Registry
            </p>
            <div className="mt-5 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex items-end gap-4">
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--bg-elevated)] sm:h-24 sm:w-24">
                  {avatar ? (
                    <Image
                      src={avatar}
                      alt={persona.name}
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
                  <h1 className="font-[family-name:var(--font-display)] text-4xl font-semibold tracking-tight text-[var(--ink)] sm:text-5xl md:text-6xl">
                    {persona.name}
                  </h1>
                  <p className="mt-2 text-sm text-[var(--muted)] sm:text-base">
                    Version {persona.version}
                    <span className="mx-2 text-[var(--line)]">·</span>
                    Created by {persona.creatorLabel}
                  </p>
                  <p className="mt-2 max-w-xl text-sm text-[var(--muted)]">
                    {persona.tagline}
                  </p>
                </div>
              </div>

              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                <ShimmerButton
                  className="w-full sm:w-auto"
                  onClick={() => void forkPersona(true)}
                >
                  {loading === "talk" ? "Opening…" : "Talk now"}
                </ShimmerButton>
                {persona.allowFork ? (
                  <button
                    type="button"
                    disabled={loading !== null}
                    onClick={() => void forkPersona(false)}
                    className="w-full rounded-xl border border-[var(--line)] px-5 py-3.5 text-sm sm:w-auto disabled:opacity-50"
                  >
                    {loading === "fork" ? "Forking…" : "Fork"}
                  </button>
                ) : null}
              </div>
            </div>
          </BlurFade>

          <BlurFade delay={0.06}>
            <div className="mt-8 flex flex-wrap gap-2">
              <span className="rounded-full border border-[var(--line)] px-3 py-1 text-[11px] uppercase tracking-[0.12em] text-[var(--muted)]">
                {persona.licenseLabel}
              </span>
              {persona.isAdult ? (
                <span className="rounded-full border border-[var(--accent)]/40 bg-[var(--accent-soft)] px-3 py-1 text-[11px] uppercase tracking-[0.12em] text-[var(--accent)]">
                  18+
                </span>
              ) : null}
              {persona.forkCount > 0 ? (
                <span className="rounded-full border border-[var(--line)] px-3 py-1 text-[11px] text-[var(--muted)]">
                  {persona.forkCount.toLocaleString()} forks
                </span>
              ) : null}
              {persona.categories.map((cat) => (
                <span
                  key={cat}
                  className="rounded-full border border-[var(--line)] px-3 py-1 text-[11px] uppercase tracking-[0.12em] text-[var(--muted)]"
                >
                  {cat}
                </span>
              ))}
            </div>
          </BlurFade>
          {error ? (
            <p className="mt-4 text-sm text-[var(--danger)]">{error}</p>
          ) : null}
        </div>
      </header>

      <main className="mx-auto grid max-w-5xl gap-12 px-4 py-14 sm:px-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-12">
          <BlurFade>
            <section>
              <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
                Identity
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
                {persona.soulPreview || persona.licenseBlurb}
              </p>
              {persona.forkedFrom ? (
                <p className="mt-4 text-sm text-[var(--muted)]">
                  Forked from{" "}
                  {persona.forkedFrom.slug ? (
                    <Link
                      href={`/p/${persona.forkedFrom.slug}`}
                      className="text-[var(--accent)] underline-offset-2 hover:underline"
                    >
                      {persona.forkedFrom.name}
                    </Link>
                  ) : (
                    persona.forkedFrom.name
                  )}
                </p>
              ) : (
                <p className="mt-4 text-sm text-[var(--muted)]">
                  Original character · {persona.licenseBlurb}
                </p>
              )}
            </section>
          </BlurFade>

          <BlurFade delay={0.04}>
            <section>
              <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
                Latest changes
              </h2>
              <ul className="mt-5 space-y-3">
                {persona.versions.slice(0, 6).map((v) => (
                  <li
                    key={`${v.version}-${v.createdAt}`}
                    className="border-l border-[var(--line)] pl-4"
                  >
                    <p className="text-sm text-[var(--ink)]">
                      <span className="font-medium">v{v.version}</span>
                      {v.changelog ? (
                        <span className="text-[var(--muted)]">
                          {" "}
                          — {v.changelog}
                        </span>
                      ) : null}
                    </p>
                    <p className="mt-1 text-[11px] text-[var(--muted)]">
                      {new Date(v.createdAt).toLocaleDateString()}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          </BlurFade>

          {persona.layers.length > 0 ? (
            <BlurFade delay={0.06}>
              <section>
                <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
                  Personality & rules
                </h2>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  {persona.layers.map((layer) => (
                    <div
                      key={layer.key}
                      className="rounded-2xl border border-[var(--line)] bg-[var(--bg-elevated)]/40 p-4"
                    >
                      <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--muted)]">
                        {layer.label}
                      </p>
                      <p className="mt-2 text-sm leading-relaxed text-[var(--ink)]">
                        {layer.preview}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            </BlurFade>
          ) : null}

          {persona.knowledgePacks.length > 0 ? (
            <BlurFade delay={0.08}>
              <section>
                <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
                  Knowledge packs
                </h2>
                <ul className="mt-5 space-y-3">
                  {persona.knowledgePacks.map((pack) => (
                    <li
                      key={pack.name}
                      className="rounded-xl border border-[var(--line)] px-4 py-3"
                    >
                      <p className="text-sm text-[var(--ink)]">{pack.name}</p>
                      {pack.description ? (
                        <p className="mt-1 text-xs text-[var(--muted)]">
                          {pack.description}
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </section>
            </BlurFade>
          ) : null}
        </div>

        <aside className="space-y-8">
          <BlurFade delay={0.05}>
            <section className="rounded-2xl border border-[var(--line)] bg-[var(--bg-elevated)]/35 p-5">
              <h2 className="text-[11px] uppercase tracking-[0.22em] text-[var(--muted)]">
                Works on
              </h2>
              <ul className="mt-4 flex flex-wrap gap-2">
                {persona.channelLabels.map((label) => (
                  <li
                    key={label}
                    className="rounded-full border border-[var(--line)] px-3 py-1 text-xs text-[var(--ink)]"
                  >
                    {label}
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-xs leading-relaxed text-[var(--muted)]">
                Canonical identity on Vesperer. Publish anywhere — including
                manual paste into Chai.
              </p>
            </section>
          </BlurFade>

          <BlurFade delay={0.07}>
            <section className="rounded-2xl border border-[var(--line)] p-5">
              <h2 className="text-[11px] uppercase tracking-[0.22em] text-[var(--muted)]">
                Export
              </h2>
              <div className="mt-4 flex flex-col gap-2">
                <button
                  type="button"
                  disabled={exporting !== null}
                  onClick={() => void loadExport("chai")}
                  className="rounded-xl border border-[var(--line)] px-4 py-2.5 text-left text-sm disabled:opacity-50"
                >
                  {exporting === "chai" ? "Preparing…" : "Export for Chai"}
                </button>
                <button
                  type="button"
                  disabled={exporting !== null}
                  onClick={() => void loadExport("character_card")}
                  className="rounded-xl border border-[var(--line)] px-4 py-2.5 text-left text-sm disabled:opacity-50"
                >
                  {exporting === "character_card"
                    ? "Preparing…"
                    : "Character Card / SillyTavern"}
                </button>
              </div>
              {exportText ? (
                <div className="mt-4 space-y-2">
                  <pre className="max-h-56 overflow-auto rounded-xl bg-[var(--bg)] p-3 text-[11px] leading-relaxed text-[var(--muted)]">
                    {exportText}
                  </pre>
                  <button
                    type="button"
                    onClick={() => void copyExport()}
                    className="text-xs text-[var(--accent)] underline-offset-2 hover:underline"
                  >
                    Copy to clipboard
                  </button>
                </div>
              ) : null}
              <p className="mt-4 text-[11px] leading-relaxed text-[var(--muted)]">
                Vesperer is not affiliated with or endorsed by Chai AI.
              </p>
            </section>
          </BlurFade>

          <BlurFade delay={0.09}>
            <section className="rounded-2xl border border-[var(--line)] p-5">
              <h2 className="text-[11px] uppercase tracking-[0.22em] text-[var(--muted)]">
                Runtime
              </h2>
              <p className="mt-3 text-sm text-[var(--muted)]">
                Talk with the live persona, or keep the registry page as the
                source of truth.
              </p>
              <div className="mt-4 flex flex-col gap-2">
                <Link
                  href={`/c/${persona.slug}`}
                  className="rounded-xl bg-[var(--accent)] px-4 py-2.5 text-center text-sm font-medium text-[var(--accent-ink)]"
                >
                  Open conversation
                </Link>
                <Link
                  href="/registry"
                  className="rounded-xl border border-[var(--line)] px-4 py-2.5 text-center text-sm"
                >
                  Browse registry
                </Link>
              </div>
            </section>
          </BlurFade>
        </aside>
      </main>

      <LegalFooter />
    </div>
  );
}
