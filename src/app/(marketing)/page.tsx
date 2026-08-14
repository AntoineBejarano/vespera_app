import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LandingPage } from "@/components/LandingPage";
import { getAppUser } from "@/lib/session";
import {
  SITE_DESCRIPTION,
  SITE_DOMAIN,
  SITE_NAME,
  SITE_URL,
} from "@/lib/site";

export const metadata: Metadata = {
  title: {
    absolute: `AI Character Creator with Long-Term Memory | ${SITE_NAME}`,
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
    "Live Personas",
    "AI persona continuous knowledge",
    "AI interpretation public sources",
  ],
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: SITE_DOMAIN,
    title: `AI Character Creator with Long-Term Memory | ${SITE_NAME}`,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: `AI Character Creator with Long-Term Memory | ${SITE_NAME}`,
    description: SITE_DESCRIPTION,
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://deevlylabs.com/#organization",
      name: "Deevly Labs LTD",
      url: "https://deevlylabs.com",
      logo: `${SITE_URL}/brand/logo.png`,
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: SITE_NAME,
      description: SITE_DESCRIPTION,
      publisher: { "@id": "https://deevlylabs.com/#organization" },
      inLanguage: "en",
    },
    {
      "@type": "SoftwareApplication",
      name: SITE_NAME,
      applicationCategory: "EntertainmentApplication",
      operatingSystem: "Web",
      url: SITE_URL,
      description: SITE_DESCRIPTION,
      provider: { "@id": "https://deevlylabs.com/#organization" },
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

export default async function HomePage() {
  // Logged-in users must never render the marketing landing (Hexclave can
  // bounce back to `/` via after_auth_return_to). One server hop → continue.
  const user = await getAppUser();
  if (user) {
    redirect("/auth/continue");
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LandingPage />
    </>
  );
}
