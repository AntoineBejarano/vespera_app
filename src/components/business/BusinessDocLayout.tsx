import type { ReactNode } from "react";
import Link from "next/link";
import { LegalFooter } from "@/components/LegalFooter";
import { MarketingNav } from "@/components/MarketingNav";

type Capability = { title: string; body: string };
type Cta = { href: string; label: string };

function CtaLink({
  cta,
  className,
}: {
  cta: Cta;
  className: string;
}) {
  if (cta.href.startsWith("mailto:") || cta.href.startsWith("http")) {
    return (
      <a href={cta.href} className={className}>
        {cta.label}
      </a>
    );
  }
  return (
    <Link href={cta.href} className={className}>
      {cta.label}
    </Link>
  );
}

export function BusinessDocLayout({
  eyebrow,
  title,
  description,
  breadcrumbs,
  children,
  capabilities,
  faqs,
  primaryCta,
  secondaryCta,
}: {
  eyebrow: string;
  title: string;
  description: string;
  breadcrumbs: { name: string; href: string }[];
  children?: ReactNode;
  capabilities: readonly Capability[];
  faqs: readonly { q: string; a: string }[];
  primaryCta?: Cta;
  secondaryCta?: Cta;
}) {
  return (
    <div className="relative min-h-screen">
      <MarketingNav variant="marketing" />
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
        <nav aria-label="Breadcrumb" className="text-xs text-[var(--muted)]">
          <ol className="flex flex-wrap items-center gap-1.5">
            {breadcrumbs.map((crumb, i) => (
              <li key={crumb.href} className="flex items-center gap-1.5">
                {i > 0 ? <span aria-hidden>/</span> : null}
                {i === breadcrumbs.length - 1 ? (
                  <span className="text-[var(--ink)]">{crumb.name}</span>
                ) : (
                  <Link href={crumb.href} className="hover:text-[var(--ink)]">
                    {crumb.name}
                  </Link>
                )}
              </li>
            ))}
          </ol>
        </nav>

        <p className="mt-6 text-[11px] uppercase tracking-[0.28em] text-[var(--accent)]">
          {eyebrow}
        </p>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-semibold tracking-tight sm:text-5xl">
          {title}
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-[var(--muted)]">
          {description}
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          {primaryCta ? (
            <CtaLink
              cta={primaryCta}
              className="rounded-xl bg-[var(--accent)] px-5 py-3 text-sm font-medium text-[var(--accent-ink)]"
            />
          ) : null}
          {secondaryCta ? (
            <CtaLink
              cta={secondaryCta}
              className="rounded-xl border border-[var(--line)] px-5 py-3 text-sm"
            />
          ) : null}
        </div>

        {children}

        <section className="mt-16">
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold sm:text-3xl">
            Capabilities
          </h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {capabilities.map((item) => (
              <article
                key={item.title}
                className="rounded-2xl border border-[var(--line)] bg-[var(--bg-elevated)]/70 p-5"
              >
                <h3 className="font-[family-name:var(--font-display)] text-xl font-semibold">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
                  {item.body}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-16">
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold sm:text-3xl">
            Frequently asked questions
          </h2>
          <dl className="mt-8 space-y-6">
            {faqs.map((faq) => (
              <div key={faq.q}>
                <dt className="font-[family-name:var(--font-display)] text-lg font-semibold">
                  {faq.q}
                </dt>
                <dd className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
                  {faq.a}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="mt-16 rounded-2xl border border-[var(--line)] p-6 sm:p-8">
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold">
            Ready to evaluate Vesperer?
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-[var(--muted)]">
            Start with the docs, spin up a workspace, or talk to us about a paid
            design partnership for agencies and platforms.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/handler/sign-in"
              className="rounded-xl bg-[var(--accent)] px-5 py-3 text-sm font-medium text-[var(--accent-ink)]"
            >
              Sign in for docs
            </Link>
            <Link
              href="/register"
              className="rounded-xl border border-[var(--line)] px-5 py-3 text-sm"
            >
              Create a workspace
            </Link>
            <a
              href="mailto:legal@mail.vesperer.com?subject=Vesperer%20Business%20design%20partner"
              className="rounded-xl border border-[var(--line)] px-5 py-3 text-sm"
            >
              Contact sales
            </a>
          </div>
        </section>
      </main>
      <LegalFooter variant="marketing" />
    </div>
  );
}
