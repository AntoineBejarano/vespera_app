import Link from "next/link";
import { LegalFooter } from "@/components/LegalFooter";
import { MarketingNav } from "@/components/MarketingNav";
import { seoPath, type SeoPage } from "@/lib/seo/catalog";

export type SeoHubLink = {
  href: string;
  label: string;
  description: string;
};

export type SeoHubPageProps = {
  eyebrow: string;
  title: string;
  description: string;
  intro: string;
  pages: SeoPage[];
  links: SeoHubLink[];
  footerLinks?: SeoHubLink[];
};

export function SeoHubPage({
  eyebrow,
  title,
  description,
  intro,
  pages,
  links,
  footerLinks = [],
}: SeoHubPageProps) {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <MarketingNav variant="marketing" />

      <main className="mx-auto max-w-6xl px-4 pb-20 pt-12 sm:px-6 sm:pt-16">
        <header className="max-w-3xl">
          <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--accent)]">
            {eyebrow}
          </p>
          <h1 className="mt-4 font-[family-name:var(--font-display)] text-4xl font-semibold leading-tight text-[var(--ink)] sm:text-5xl">
            {title}
          </h1>
          <p className="mt-5 text-base leading-relaxed text-[var(--muted)] sm:text-lg">
            {description}
          </p>
          <p className="mt-4 text-sm leading-relaxed text-[var(--muted)]">
            {intro}
          </p>
        </header>

        <section className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block rounded-xl border border-[var(--line)] bg-[var(--bg-elevated)]/30 p-5 transition hover:border-[var(--accent)]/50"
            >
              <h2 className="font-[family-name:var(--font-display)] text-xl text-[var(--ink)]">
                {link.label}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
                {link.description}
              </p>
            </Link>
          ))}
        </section>

        {pages.length ? (
          <section className="mt-16">
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-[var(--ink)]">
              Featured paths
            </h2>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {pages.map((page) => (
                <Link
                  key={`${page.verb}-${page.slug}`}
                  href={seoPath(page.verb, page.slug)}
                  className="rounded-xl border border-[var(--line)] p-5 transition hover:border-[var(--accent)]/50"
                >
                  <p className="text-[10px] uppercase tracking-[0.22em] text-[var(--accent)]">
                    {page.category}
                  </p>
                  <h3 className="mt-2 text-lg font-medium text-[var(--ink)]">
                    {page.name}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
                    {page.summary}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {footerLinks.length ? (
          <section className="mt-16 border-t border-[var(--line)] pt-10">
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-[var(--ink)]">
              Keep exploring
            </h2>
            <ul className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              {footerLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="inline-flex rounded-xl border border-[var(--line)] px-4 py-2.5 text-sm hover:border-[var(--accent)]/50"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </main>

      <LegalFooter variant="marketing" />
    </div>
  );
}
