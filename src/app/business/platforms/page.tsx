import type { Metadata } from "next";
import Link from "next/link";
import { BusinessDocLayout } from "@/components/business/BusinessDocLayout";
import {
  PLATFORM_CAPABILITIES,
  PLATFORM_FAQS,
  PLATFORM_HERO,
} from "@/lib/business/content";
import { breadcrumbJsonLd } from "@/lib/seo/breadcrumbs";
import { PLATFORM_KEYWORDS } from "@/lib/seo/keywords";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "For platforms — embed AI identities via API",
  description:
    "Vesperer for Platforms: API-first AI identity infrastructure with chat keys, multi-tenant isolation, persistent memory, channel connectors, disclosure hooks and operational kill switches.",
  alternates: { canonical: `${SITE_URL}/business/platforms` },
  keywords: PLATFORM_KEYWORDS,
  openGraph: {
    title: `Vesperer for Platforms · ${SITE_NAME}`,
    description:
      "Embed governed conversational identities into your product with API keys, isolation and continuity.",
    url: `${SITE_URL}/business/platforms`,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `Vesperer for Platforms · ${SITE_NAME}`,
    description:
      "API-first AI identity layer: personas, memory, chat keys and multi-tenant control.",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      name: "Vesperer for Platforms",
      description: PLATFORM_HERO.description,
      url: `${SITE_URL}/business/platforms`,
    },
    {
      "@type": "FAQPage",
      mainEntity: PLATFORM_FAQS.map((faq) => ({
        "@type": "Question",
        name: faq.q,
        acceptedAnswer: { "@type": "Answer", text: faq.a },
      })),
    },
    breadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "Business", path: "/business" },
      { name: "Platforms", path: "/business/platforms" },
    ]),
  ],
};

const INTEGRATION_STEPS = [
  {
    n: "01",
    t: "Authenticate with an account key",
    d: "Use a server-side account API key (vsk_…) for provisioning. Never expose it in browsers.",
  },
  {
    n: "02",
    t: "Create personas programmatically",
    d: "Define identity layers and knowledge via API or CLI — including agent-driven setup from Cursor or Claude.",
  },
  {
    n: "03",
    t: "Issue chat keys to your surfaces",
    d: "Give each end-user channel a chat key scoped to the persona. Keep peer memory isolated in Vesperer.",
  },
  {
    n: "04",
    t: "Add channels and controls",
    d: "Connect Telegram or voice, wire handoff webhooks, and keep kill switches ready for operational incidents.",
  },
];

export default function BusinessPlatformsPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <BusinessDocLayout
        eyebrow={PLATFORM_HERO.eyebrow}
        title={PLATFORM_HERO.title}
        description={PLATFORM_HERO.description}
        breadcrumbs={[
          { name: "Home", href: "/" },
          { name: "Business", href: "/business" },
          { name: "Platforms", href: "/business/platforms" },
        ]}
        capabilities={PLATFORM_CAPABILITIES}
        faqs={PLATFORM_FAQS}
        primaryCta={{ href: "/docs", label: "Open API documentation" }}
        secondaryCta={{
          href: "mailto:legal@mail.vesperer.com?subject=Vesperer%20Platform%20integration",
          label: "Discuss integration",
        }}
      >
        <section className="mt-14">
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold sm:text-3xl">
            Integration path
          </h2>
          <ol className="mt-8 space-y-5">
            {INTEGRATION_STEPS.map((step) => (
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

        <section className="mt-14 rounded-2xl border border-[var(--line)] bg-[var(--bg-elevated)]/40 p-6">
          <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold">
            Key separation model
          </h2>
          <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
            <li>
              · <span className="text-[var(--ink)]">Account API keys</span> —
              provision personas, knowledge and settings (server / CLI / agents).
            </li>
            <li>
              · <span className="text-[var(--ink)]">Chat keys</span> — end-user
              conversation surfaces with peer-isolated memory.
            </li>
            <li>
              · <span className="text-[var(--ink)]">Workspace boundaries</span> —
              tenants, secrets and identities stay separated.
            </li>
          </ul>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/docs"
              className="rounded-xl border border-[var(--line)] px-5 py-3 text-sm"
            >
              Docs
            </Link>
            <Link
              href="/integrations/claude"
              className="rounded-xl border border-[var(--line)] px-5 py-3 text-sm"
            >
              Vibecode with Claude
            </Link>
            <Link
              href="/technology"
              className="rounded-xl border border-[var(--line)] px-5 py-3 text-sm"
            >
              Technology
            </Link>
          </div>
        </section>
      </BusinessDocLayout>
    </>
  );
}
