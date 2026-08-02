import type { Metadata } from "next";
import Link from "next/link";
import { BusinessDocLayout } from "@/components/business/BusinessDocLayout";
import {
  BUSINESS_CAPABILITIES,
  BUSINESS_FAQS,
  BUSINESS_HERO,
  BUSINESS_SEGMENTS,
} from "@/lib/business/content";
import { breadcrumbJsonLd } from "@/lib/seo/breadcrumbs";
import { BUSINESS_KEYWORDS } from "@/lib/seo/keywords";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Business — operate persistent AI identities at scale",
  description:
    "Vesperer for Business: workspaces, permissions, persistent AI identities, knowledge packs, API keys, Telegram and voice channels, human handoff, audit controls and ownership for agencies, platforms, creators and brands.",
  alternates: { canonical: `${SITE_URL}/business` },
  keywords: BUSINESS_KEYWORDS,
  openGraph: {
    title: `Vesperer for Business · ${SITE_NAME}`,
    description:
      "Create, manage and deploy conversational identities with memory, permissions, API access and operational control.",
    url: `${SITE_URL}/business`,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `Vesperer for Business · ${SITE_NAME}`,
    description:
      "Operate persistent AI identities with workspaces, API keys, channels and human handoff.",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      name: "Vesperer for Business",
      description: BUSINESS_HERO.description,
      url: `${SITE_URL}/business`,
    },
    {
      "@type": "SoftwareApplication",
      name: "Vesperer for Business",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      description: BUSINESS_HERO.description,
      url: `${SITE_URL}/business`,
      provider: {
        "@type": "Organization",
        name: "Deevly Labs LTD",
        url: "https://deevlylabs.com",
      },
    },
    {
      "@type": "FAQPage",
      mainEntity: BUSINESS_FAQS.map((faq) => ({
        "@type": "Question",
        name: faq.q,
        acceptedAnswer: {
          "@type": "Answer",
          text: faq.a,
        },
      })),
    },
    breadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "Business", path: "/business" },
    ]),
  ],
};

export default function BusinessPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <BusinessDocLayout
        eyebrow={BUSINESS_HERO.eyebrow}
        title={BUSINESS_HERO.title}
        description={BUSINESS_HERO.description}
        breadcrumbs={[
          { name: "Home", href: "/" },
          { name: "Business", href: "/business" },
        ]}
        capabilities={BUSINESS_CAPABILITIES.map((c) => ({
          title: c.title,
          body: c.body,
        }))}
        faqs={BUSINESS_FAQS}
        primaryCta={{ href: "/docs", label: "API & CLI docs" }}
        secondaryCta={{
          href: "mailto:legal@mail.vesperer.com?subject=Vesperer%20Business",
          label: "Talk to us",
        }}
      >
        <section className="mt-14">
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold sm:text-3xl">
            Who it is for
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--muted)]">
            Same product core as consumer Vesperer — explained here for teams
            evaluating infrastructure, not for viral curiosity.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {BUSINESS_SEGMENTS.map((segment) => (
              <Link
                key={segment.slug}
                href={segment.href}
                className="rounded-2xl border border-[var(--line)] bg-[var(--bg-elevated)]/70 p-5 transition-colors hover:border-[var(--accent)]"
              >
                <h3 className="font-[family-name:var(--font-display)] text-xl font-semibold">
                  {segment.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
                  {segment.result}
                </p>
                <p className="mt-4 text-xs uppercase tracking-[0.2em] text-[var(--accent)]">
                  Learn more →
                </p>
              </Link>
            ))}
          </div>
        </section>

        <section id="creators" className="mt-16 scroll-mt-24">
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold sm:text-3xl">
            For creators
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--muted)]">
            Publish one coherent identity your audience can return to — with
            per-fan memory, voice, Telegram and exportable ownership. Start
            self-serve; grow into Studio when the roster expands.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/#creators"
              className="rounded-xl border border-[var(--line)] px-5 py-3 text-sm"
            >
              Creator overview
            </Link>
            <Link
              href="/create/ai-character"
              className="rounded-xl border border-[var(--line)] px-5 py-3 text-sm"
            >
              Create a persona
            </Link>
          </div>
        </section>

        <section id="brands" className="mt-16 scroll-mt-24">
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold sm:text-3xl">
            For brands & institutions
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--muted)]">
            Receptionists, advisors, mentors and historical figures that stay
            consistent across chat and voice — grounded in approved sources via
            Live Personas, with human handoff when a conversation needs a person.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/explore?filter=hire"
              className="rounded-xl border border-[var(--line)] px-5 py-3 text-sm"
            >
              AI employees
            </Link>
            <Link
              href="/technology"
              className="rounded-xl border border-[var(--line)] px-5 py-3 text-sm"
            >
              How the engine works
            </Link>
            <Link
              href="/legal/acceptable-use"
              className="rounded-xl border border-[var(--line)] px-5 py-3 text-sm"
            >
              Safety & acceptable use
            </Link>
          </div>
        </section>

        <section className="mt-16 rounded-2xl border border-[var(--line)] bg-[var(--bg-elevated)]/40 p-6 sm:p-8">
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold">
            Documentation map
          </h2>
          <ul className="mt-6 space-y-3 text-sm text-[var(--muted)]">
            <li>
              <Link href="/docs" className="text-[var(--ink)] hover:underline">
                /docs
              </Link>
              {" — "}Chat API, CLI and key model for agents and backends.
            </li>
            <li>
              <Link
                href="/technology"
                className="text-[var(--ink)] hover:underline"
              >
                /technology
              </Link>
              {" — "}Identity layers, memory and continuity architecture.
            </li>
            <li>
              <Link
                href="/business/agencies"
                className="text-[var(--ink)] hover:underline"
              >
                /business/agencies
              </Link>
              {" — "}Multi-talent operations, handoff and roster control.
            </li>
            <li>
              <Link
                href="/business/platforms"
                className="text-[var(--ink)] hover:underline"
              >
                /business/platforms
              </Link>
              {" — "}API integration, multi-tenant isolation and embedding.
            </li>
            <li>
              <Link
                href="/legal/terms"
                className="text-[var(--ink)] hover:underline"
              >
                /legal/*
              </Link>
              {" — "}Terms, AI transparency, acceptable use and adult notice.
            </li>
          </ul>
        </section>
      </BusinessDocLayout>
    </>
  );
}
