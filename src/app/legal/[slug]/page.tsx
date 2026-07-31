import Link from "next/link";
import { notFound } from "next/navigation";
import { BrandLogo } from "@/components/BrandLogo";
import { LegalFooter } from "@/components/LegalFooter";
import {
  LEGAL_PAGES,
  LEGAL_VERSION,
  type LegalSlug,
} from "@/lib/legal/constants";
import { getLegalBody } from "@/lib/legal/content";

const SLUGS = new Set(LEGAL_PAGES.map((p) => p.slug));

export function generateStaticParams() {
  return LEGAL_PAGES.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = LEGAL_PAGES.find((p) => p.slug === slug);
  if (!page) return { title: "Legal — Vesperer" };
  return {
    title: `${page.title} — Vesperer`,
    description: page.description,
  };
}

export default async function LegalPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!SLUGS.has(slug as LegalSlug)) notFound();
  const meta = LEGAL_PAGES.find((p) => p.slug === slug)!;
  const body = getLegalBody(slug as LegalSlug);

  return (
    <div className="min-h-dvh">
      <header className="safe-pad border-b border-[var(--line)] px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
          <BrandLogo href="/" size="sm" />
          <Link
            href="/age-gate"
            className="text-sm text-[var(--muted)] hover:text-[var(--ink)]"
          >
            Age gate
          </Link>
        </div>
      </header>
      <main className="safe-pad mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">
          Legal · v{LEGAL_VERSION}
        </p>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-semibold text-[var(--ink)] sm:text-4xl">
          {meta.title}
        </h1>
        <div className="mt-8 space-y-5 text-[15px] leading-relaxed text-[var(--muted)]">
          {body.map((paragraph) => (
            <p key={paragraph.slice(0, 48)} className="text-[var(--ink)]/90">
              {paragraph}
            </p>
          ))}
        </div>
        <nav className="mt-12 flex flex-wrap gap-x-4 gap-y-2 border-t border-[var(--line)] pt-6 text-sm text-[var(--muted)]">
          {LEGAL_PAGES.map((p) => (
            <Link
              key={p.slug}
              href={`/legal/${p.slug}`}
              className={
                p.slug === slug
                  ? "text-[var(--accent)]"
                  : "hover:text-[var(--ink)]"
              }
            >
              {p.title}
            </Link>
          ))}
        </nav>
      </main>
      <LegalFooter />
    </div>
  );
}
