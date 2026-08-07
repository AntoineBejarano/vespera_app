import Link from "next/link";
import { LegalFooter } from "@/components/LegalFooter";
import { MarketingNav } from "@/components/MarketingNav";
import type { PublishedSeoGeneratedPage } from "@/lib/seo/generated/pages";

export function GeneratedSeoPageLayout({
  page,
}: {
  page: PublishedSeoGeneratedPage;
}) {
  const content = page.content;

  return (
    <div className="relative overflow-hidden">
      <MarketingNav variant="marketing" />

      <article className="mx-auto max-w-5xl px-4 pb-20 pt-10 sm:px-6 sm:pt-14">
        <nav className="flex flex-wrap gap-x-2 text-xs text-[var(--muted)]">
          <Link href="/explore" className="hover:text-[var(--ink)]">
            Explore
          </Link>
          <span>/</span>
          <Link href="/registry" className="hover:text-[var(--ink)]">
            Registry
          </Link>
          <span>/</span>
          <span className="text-[var(--ink)]">{page.category}</span>
        </nav>

        <header className="mt-8 max-w-3xl">
          <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--accent)]">
            Use case · {page.category}
          </p>
          <h1 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-semibold leading-tight sm:text-5xl">
            {page.h1}
          </h1>
          <p className="mt-5 text-base leading-relaxed text-[var(--muted)] sm:text-lg">
            {page.summary}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
              href="/bring"
              className="inline-flex items-center justify-center rounded-xl bg-[var(--accent)] px-6 py-3.5 font-medium text-[var(--accent-ink)]"
            >
              {content.ctaLabel}
            </Link>
            <Link
              href="/voice"
              className="inline-flex items-center justify-center rounded-xl border border-[var(--line)] px-6 py-3.5"
            >
              Try voice
            </Link>
          </div>
        </header>

        <section className="mt-14 grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-8">
            <p className="text-base leading-8 text-[var(--ink)]">
              {content.intro}
            </p>

            {content.sections.map((section) => (
              <section key={section.heading}>
                <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold">
                  {section.heading}
                </h2>
                <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
                  {section.body}
                </p>
              </section>
            ))}
          </div>

          <aside className="space-y-5">
            <div className="rounded-2xl border border-[var(--line)] bg-[var(--bg-elevated)]/40 p-5">
              <p className="text-[10px] uppercase tracking-[0.22em] text-[var(--muted)]">
                Platform fit
              </p>
              <ul className="mt-4 space-y-3">
                {content.platformFit.map((item) => (
                  <li
                    key={item}
                    className="border-l-2 border-[var(--accent)]/50 pl-3 text-sm leading-relaxed text-[var(--muted)]"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-[var(--line)] bg-[var(--bg-elevated)]/40 p-5">
              <p className="text-[10px] uppercase tracking-[0.22em] text-[var(--muted)]">
                Workflow
              </p>
              <ol className="mt-4 space-y-3">
                {content.sampleWorkflow.map((step, index) => (
                  <li key={step} className="flex gap-3 text-sm leading-relaxed">
                    <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border border-[var(--line)] text-xs">
                      {index + 1}
                    </span>
                    <span className="text-[var(--muted)]">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          </aside>
        </section>

        <section className="mt-14 rounded-2xl border border-[var(--line)] bg-[var(--bg-elevated)]/40 p-5">
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold">
            Starter prompt
          </h2>
          <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
            {content.promptExample}
          </p>
        </section>

        <section className="mt-14">
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold">
            Questions
          </h2>
          <dl className="mt-6 space-y-5">
            {content.faqs.map((faq) => (
              <div key={faq.q}>
                <dt className="font-medium text-[var(--ink)]">{faq.q}</dt>
                <dd className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
                  {faq.a}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="mt-14 border-t border-[var(--line)] pt-10">
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold">
            Build the persona
          </h2>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
              href="/personas"
              className="inline-flex rounded-xl border border-[var(--line)] px-4 py-2.5 text-sm hover:border-[var(--accent)]/50"
            >
              Open studio
            </Link>
            <Link
              href="/registry"
              className="inline-flex rounded-xl border border-[var(--line)] px-4 py-2.5 text-sm hover:border-[var(--accent)]/50"
            >
              Browse registry
            </Link>
            <Link
              href="/integrations/claude"
              className="inline-flex rounded-xl border border-[var(--line)] px-4 py-2.5 text-sm hover:border-[var(--accent)]/50"
            >
              Use with agents
            </Link>
          </div>
        </section>
      </article>

      <LegalFooter variant="marketing" />
    </div>
  );
}
