import Link from "next/link";
import { AppNav } from "@/components/AppNav";
import { LegalFooter } from "@/components/LegalFooter";
import { BlurFade } from "@/components/magicui/effects";
import { RoiHint } from "@/components/seo/RoiHint";
import {
  VERB_LABELS,
  seoPath,
  type SeoPage,
} from "@/lib/seo/catalog";

export function SeoPageLayout({ page }: { page: SeoPage }) {
  return (
    <div className="relative overflow-hidden">
      <AppNav variant="marketing" />

      <article className="mx-auto max-w-6xl px-4 pb-20 pt-10 sm:px-6 sm:pt-14">
        <BlurFade>
          <nav className="flex flex-wrap gap-x-2 text-xs text-[var(--muted)]">
            <Link href="/explore" className="hover:text-[var(--ink)]">
              Explore
            </Link>
            <span>/</span>
            <Link
              href={`/explore?filter=${page.verb}`}
              className="hover:text-[var(--ink)]"
            >
              {VERB_LABELS[page.verb]}
            </Link>
            <span>/</span>
            <span className="text-[var(--ink)]">{page.name}</span>
          </nav>
        </BlurFade>

        <BlurFade delay={0.05}>
          <p className="mt-8 text-[11px] uppercase tracking-[0.28em] text-[var(--accent)]">
            {VERB_LABELS[page.verb]} · {page.category}
            {page.voiceHint ? " · Voice-ready" : ""}
          </p>
          <h1 className="mt-3 max-w-3xl font-[family-name:var(--font-display)] text-3xl font-semibold leading-tight sm:text-5xl">
            {page.h1}
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-[var(--muted)] sm:text-lg">
            {page.summary}
          </p>
        </BlurFade>

        <BlurFade
          delay={0.1}
          className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap"
        >
          <a
            href={page.ctaPrimary.href}
            className="inline-flex items-center justify-center rounded-xl bg-[var(--accent)] px-6 py-3.5 font-medium text-[var(--accent-ink)]"
          >
            {page.ctaPrimary.label}
          </a>
          <a
            href={page.ctaSecondary.href}
            className="inline-flex items-center justify-center rounded-xl border border-[var(--line)] px-6 py-3.5"
          >
            {page.ctaSecondary.label}
          </a>
        </BlurFade>

        {page.disclaimer ? (
          <p className="mt-6 max-w-2xl text-xs leading-relaxed text-[var(--muted)]/80">
            {page.disclaimer}
          </p>
        ) : null}

        <section className="mt-14 grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold">
              What it can do
            </h2>
            <ul className="mt-4 space-y-3">
              {page.bullets.map((b) => (
                <li
                  key={b}
                  className="border-l-2 border-[var(--accent)]/50 pl-4 text-sm leading-relaxed text-[var(--muted)]"
                >
                  {b}
                </li>
              ))}
            </ul>
            {page.topics.length ? (
              <div className="mt-8 flex flex-wrap gap-2">
                {page.topics.map((t) => (
                  <span
                    key={t}
                    className="rounded-xl border border-[var(--line)] px-3 py-1.5 text-xs text-[var(--ink)]"
                  >
                    {t}
                  </span>
                ))}
              </div>
            ) : null}
          </div>

          <div className="rounded-2xl border border-[var(--line)] bg-[var(--bg-elevated)]/40 p-5">
            <p className="text-[10px] uppercase tracking-[0.22em] text-[var(--muted)]">
              Example conversation
            </p>
            <div className="mt-4 space-y-3 text-sm">
              {page.sampleDialogue.map((line, i) => (
                <p
                  key={`${line.role}-${i}`}
                  className={
                    line.role === "user"
                      ? "ml-6 rounded-xl bg-[var(--accent-soft)] px-3 py-2.5 text-right text-[var(--ink)] sm:ml-10"
                      : "mr-4 rounded-xl border border-[var(--line)] bg-[var(--bg)] px-3 py-2.5 text-[var(--ink)] sm:mr-8"
                  }
                >
                  {line.text}
                </p>
              ))}
            </div>
          </div>
        </section>

        {page.roiHints ? (
          <section className="mt-14">
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold">
              What continuity can recover
            </h2>
            <div className="mt-6">
              <RoiHint {...page.roiHints} />
            </div>
          </section>
        ) : null}

        {page.faqs.length ? (
          <section className="mt-14">
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold">
              Questions
            </h2>
            <dl className="mt-6 space-y-5">
              {page.faqs.map((faq) => (
                <div key={faq.q}>
                  <dt className="font-medium text-[var(--ink)]">{faq.q}</dt>
                  <dd className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
                    {faq.a}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        ) : null}

        {page.related.length ? (
          <section className="mt-14 border-t border-[var(--line)] pt-10">
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold">
              Related
            </h2>
            <ul className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              {page.related.map((r) => (
                <li key={`${r.verb}-${r.slug}`}>
                  <Link
                    href={seoPath(r.verb, r.slug)}
                    className="inline-flex rounded-xl border border-[var(--line)] px-4 py-2.5 text-sm hover:border-[var(--accent)]/50"
                  >
                    {r.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/explore"
                  className="inline-flex rounded-xl border border-[var(--line)] px-4 py-2.5 text-sm hover:border-[var(--accent)]/50"
                >
                  Back to Explore
                </Link>
              </li>
            </ul>
          </section>
        ) : null}
      </article>

      <LegalFooter variant="marketing" />
    </div>
  );
}
