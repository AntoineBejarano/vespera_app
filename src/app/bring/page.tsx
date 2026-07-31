import type { Metadata } from "next";
import { Suspense } from "react";
import { BringCharacterFlow } from "@/components/BringCharacterFlow";
import { breadcrumbJsonLd } from "@/lib/seo/breadcrumbs";
import { SITE_NAME, SITE_URL } from "@/lib/site";

const description =
  "Import a Character Card, JSON, prompt, SillyTavern export or conversation history. Rebuild identity and continue without starting from zero.";

export const metadata: Metadata = {
  title: "Bring an existing character",
  description,
  alternates: { canonical: `${SITE_URL}/bring` },
  keywords: [
    "import AI character",
    "character card import",
    "SillyTavern import",
    "how to back up an AI character",
    "how to move an AI character between platforms",
    "how to recreate your Chai character",
    "Character Card v2 import",
    "migrate AI companion to new platform",
  ],
  openGraph: {
    title: `Bring an existing character · ${SITE_NAME}`,
    description:
      "Import characters you created or have permission to use. Preserve identity and memories.",
    url: `${SITE_URL}/bring`,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `Bring an existing character · ${SITE_NAME}`,
    description:
      "Import Character Card, SillyTavern, or your own config into Vesperer.",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "HowTo",
      name: "Import an AI character to Vesperer",
      description,
      step: [
        {
          "@type": "HowToStep",
          name: "Export your character",
          text: "Export a Character Card v2, SillyTavern JSON, or your existing prompt and memory files.",
        },
        {
          "@type": "HowToStep",
          name: "Upload to Vesperer",
          text: "Open Bring a character and paste or upload your export on vesperer.com/bring.",
        },
        {
          "@type": "HowToStep",
          name: "Continue with memory",
          text: "Review identity layers, adjust boundaries, and resume conversations without starting from zero.",
        },
      ],
    },
    {
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "Can I import a SillyTavern character to Vesperer?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes. Vesperer supports Character Card v2 and SillyTavern exports so you can preserve identity and continue with long-term memory.",
          },
        },
        {
          "@type": "Question",
          name: "How do I back up an AI character before switching platforms?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Export your character card or configuration from your current tool, then import it on vesperer.com/bring to rebuild identity and memory in Vesperer.",
          },
        },
      ],
    },
    breadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "Bring a character", path: "/bring" },
    ]),
  ],
};

export default function BringPage() {
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
        <BringCharacterFlow />
      </Suspense>
    </>
  );
}
