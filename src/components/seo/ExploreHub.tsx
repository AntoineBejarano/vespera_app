"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AppNav } from "@/components/AppNav";
import { LegalFooter } from "@/components/LegalFooter";
import { BlurFade } from "@/components/magicui/effects";
import {
  VERB_LABELS,
  seoPath,
  type SeoPage,
  type SeoVerb,
} from "@/lib/seo/catalog";
import { AFTER_DARK_URL } from "@/lib/site";

const FILTERS: { id: "all" | SeoVerb; label: string }[] = [
  { id: "all", label: "All" },
  { id: "meet", label: "Characters & great minds" },
  { id: "learn", label: "Learn" },
  { id: "hire", label: "AI employees" },
  { id: "create", label: "Create" },
];

export function ExploreHub({
  pages,
  initialFilter,
}: {
  pages: SeoPage[];
  initialFilter?: string | null;
}) {
  const start =
    initialFilter &&
    FILTERS.some((f) => f.id === initialFilter && f.id !== "all")
      ? (initialFilter as SeoVerb)
      : "all";
  const [filter, setFilter] = useState<"all" | SeoVerb>(start);

  const visible = useMemo(
    () =>
      filter === "all" ? pages : pages.filter((p) => p.verb === filter),
    [filter, pages],
  );

  return (
    <div className="relative overflow-hidden">
      <AppNav variant="marketing" />

      <section className="mx-auto max-w-6xl px-4 pb-20 pt-12 sm:px-6 sm:pt-16">
        <BlurFade>
          <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--accent)]">
            Explore
          </p>
          <h1 className="mt-3 max-w-3xl font-[family-name:var(--font-display)] text-3xl font-semibold sm:text-5xl">
            Explore what AI can become
          </h1>
          <p className="mt-4 max-w-2xl text-[var(--muted)]">
            Meet someone impossible. Learn from a mentor. Hire an AI employee.
            Create a persona your audience returns to — each page is a real
            path, not an empty card.
          </p>
        </BlurFade>

        <div className="mt-8 flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={
                filter === f.id
                  ? "rounded-xl border border-[var(--accent)] bg-[var(--accent-soft)] px-3 py-2 text-sm text-[var(--ink)]"
                  : "rounded-xl border border-[var(--line)] px-3 py-2 text-sm text-[var(--muted)] hover:text-[var(--ink)]"
              }
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((page, i) => (
            <BlurFade key={`${page.verb}-${page.slug}`} delay={i * 0.02}>
              <Link
                href={seoPath(page.verb, page.slug)}
                className="group flex h-full flex-col border-l-2 border-[var(--accent)]/40 pl-4 transition hover:border-[var(--accent)]"
              >
                <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--muted)]">
                  {VERB_LABELS[page.verb]}
                  {page.voiceHint ? " · Voice" : ""}
                </p>
                <h2 className="mt-2 font-[family-name:var(--font-display)] text-xl font-semibold group-hover:text-[var(--accent-2)]">
                  {page.name}
                </h2>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-[var(--muted)]">
                  {page.summary}
                </p>
                <span className="mt-4 text-sm text-[var(--accent)]">
                  Open →
                </span>
              </Link>
            </BlurFade>
          ))}
        </div>

        <BlurFade delay={0.15} className="mt-16 border-t border-[var(--line)] pt-10">
          <p className="text-sm text-[var(--muted)]">
            Looking for private 18+ experiences?{" "}
            <a
              href={AFTER_DARK_URL}
              className="underline decoration-[var(--line)] underline-offset-2 hover:text-[var(--ink)]"
            >
              Visit After Dark
            </a>
            .
          </p>
        </BlurFade>
      </section>

      <LegalFooter variant="marketing" />
    </div>
  );
}
