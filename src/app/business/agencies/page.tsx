import type { Metadata } from "next";
import Link from "next/link";
import { BusinessDocLayout } from "@/components/business/BusinessDocLayout";
import {
  AGENCY_CAPABILITIES,
  AGENCY_FAQS,
  AGENCY_HERO,
} from "@/lib/business/content";
import { breadcrumbJsonLd } from "@/lib/seo/breadcrumbs";
import { AGENCY_KEYWORDS } from "@/lib/seo/keywords";
import { AFTER_DARK_URL, SITE_NAME, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "For agencies — manage AI identities across your roster",
  description:
    "Vesperer for Agencies: multi-talent workspaces, operator roles, persistent per-fan memory, Telegram and voice channels, human handoff and kill switches for creator networks.",
  alternates: { canonical: `${SITE_URL}/business/agencies` },
  keywords: AGENCY_KEYWORDS,
  openGraph: {
    title: `Vesperer for Agencies · ${SITE_NAME}`,
    description:
      "Run multiple AI identities with memory, handoff and team access — without building the stack yourself.",
    url: `${SITE_URL}/business/agencies`,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `Vesperer for Agencies · ${SITE_NAME}`,
    description:
      "Multi-talent AI identity workspaces with memory, channels and human handoff.",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      name: "Vesperer for Agencies",
      description: AGENCY_HERO.description,
      url: `${SITE_URL}/business/agencies`,
    },
    {
      "@type": "FAQPage",
      mainEntity: AGENCY_FAQS.map((faq) => ({
        "@type": "Question",
        name: faq.q,
        acceptedAnswer: { "@type": "Answer", text: faq.a },
      })),
    },
    breadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "Business", path: "/business" },
      { name: "Agencies", path: "/business/agencies" },
    ]),
  ],
};

export default function BusinessAgenciesPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <BusinessDocLayout
        eyebrow={AGENCY_HERO.eyebrow}
        title={AGENCY_HERO.title}
        description={AGENCY_HERO.description}
        breadcrumbs={[
          { name: "Home", href: "/" },
          { name: "Business", href: "/business" },
          { name: "Agencies", href: "/business/agencies" },
        ]}
        capabilities={AGENCY_CAPABILITIES}
        faqs={AGENCY_FAQS}
        primaryCta={{
          href: "mailto:legal@vesperer.com?subject=Vesperer%20Agencies%20design%20partner",
          label: "Book a design-partner call",
        }}
        secondaryCta={{ href: "/docs", label: "Read API docs" }}
      >
        <section className="mt-14">
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold sm:text-3xl">
            Typical agency workflow
          </h2>
          <ol className="mt-8 space-y-5">
            {[
              {
                n: "01",
                t: "Create a workspace",
                d: "Invite operators and keep client or talent work separated from day one.",
              },
              {
                n: "02",
                t: "Define each identity",
                d: "Layer personality, rules, knowledge packs and approved sources so the voice stays consistent under load.",
              },
              {
                n: "03",
                t: "Deploy channels",
                d: "Connect Telegram, web chat and voice. Issue chat keys only where end users need them.",
              },
              {
                n: "04",
                t: "Operate with handoff",
                d: "Let the persona handle volume; escalate to humans when chemistry, sales or risk requires it.",
              },
            ].map((step) => (
              <li key={step.n} className="flex gap-4">
                <span className="font-[family-name:var(--font-display)] text-sm text-[var(--accent)]">
                  {step.n}
                </span>
                <div>
                  <p className="font-[family-name:var(--font-display)] text-lg font-semibold">
                    {step.t}
                  </p>
                  <p className="mt-1 text-sm text-[var(--muted)]">{step.d}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-14 rounded-2xl border border-[var(--line)] p-6">
          <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold">
            Adult talent?
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
            18+ creator lines live on{" "}
            <a
              href={AFTER_DARK_URL}
              className="text-[var(--ink)] underline-offset-2 hover:underline"
            >
              After Dark
            </a>
            . The emotional surface stays premium for fans; agency operations,
            workspaces and platform integrations are documented here under
            Business.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/business/platforms"
              className="rounded-xl border border-[var(--line)] px-5 py-3 text-sm"
            >
              Platform integrations
            </Link>
            <Link
              href="/business"
              className="rounded-xl border border-[var(--line)] px-5 py-3 text-sm"
            >
              All business capabilities
            </Link>
          </div>
        </section>
      </BusinessDocLayout>
    </>
  );
}
