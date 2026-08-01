import type { Metadata } from "next";
import { Suspense } from "react";
import { LandingPage } from "@/components/LandingPage";
import {
  SITE_DESCRIPTION,
  SITE_DOMAIN,
  SITE_NAME,
  SITE_TAGLINE,
  SITE_URL,
} from "@/lib/site";

export const metadata: Metadata = {
  title: {
    absolute: `${SITE_NAME} — ${SITE_TAGLINE}`,
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "AI characters that remember",
    "AI personas with memory",
    "AI character creator",
    "historical AI personalities",
    "AI mentor tutor",
    "AI employee receptionist",
    "character card import",
    "SillyTavern character",
    "Chat API AI persona",
    "AI voice characters",
  ],
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: SITE_DOMAIN,
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: SITE_NAME,
      url: SITE_URL,
      logo: `${SITE_URL}/brand/logo.png`,
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: SITE_NAME,
      description: SITE_DESCRIPTION,
      publisher: { "@id": `${SITE_URL}/#organization` },
      inLanguage: "en",
    },
    {
      "@type": "SoftwareApplication",
      name: SITE_NAME,
      applicationCategory: "EntertainmentApplication",
      operatingSystem: "Web",
      url: SITE_URL,
      description: SITE_DESCRIPTION,
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "EUR",
        description: "Free to start creating characters",
      },
    },
    {
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "What is Vesperer?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Vesperer is a platform for AI personas that remember, evolve and act — with stable identity, long-term memory, and relationships that continue across chat, voice and channels.",
          },
        },
        {
          "@type": "Question",
          name: "Can I import an existing AI character?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes. Import Character Card v2, SillyTavern exports, or your own configuration on vesperer.com/bring.",
          },
        },
        {
          "@type": "Question",
          name: "Do Vesperer characters remember past conversations?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes. Vesperer stores people, preferences, promises, and meaningful moments per user so relationships evolve instead of resetting.",
          },
        },
      ],
    },
  ],
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center text-[var(--muted)]">
            Loading…
          </div>
        }
      >
        <LandingPage />
      </Suspense>
    </>
  );
}
