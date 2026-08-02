import type { Metadata } from "next";
import { IntegrationsClaudePage } from "@/components/IntegrationsClaudePage";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Vibecode AI characters from Claude",
  description:
    "Use Claude Code with the Vesperer CLI to create persistent AI personas — soul, style, rules, context, knowledge packs, and chat — with production tenant isolation.",
  alternates: { canonical: `${SITE_URL}/integrations/claude` },
  keywords: [
    "Claude Code AI character",
    "vibecode AI persona",
    "Claude CLI character creation",
    "Vesperer Claude integration",
    "AI agent create persona",
    "Cursor Claude Vesperer",
    "persistent AI character CLI",
    "Claude Code vibecoding",
  ],
  openGraph: {
    title: `Vibecode characters from Claude · ${SITE_NAME}`,
    description:
      "Point Claude at the Vesperer CLI. Provision personas, attach knowledge, chat with per-peer memory — multi-tenant safe.",
    url: `${SITE_URL}/integrations/claude`,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `Vibecode characters from Claude · ${SITE_NAME}`,
    description:
      "Claude Code + Vesperer CLI: create persistent AI personas with production isolation.",
  },
};

const faqLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Can Claude Code create a Vesperer persona?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Authenticate with a vsk_ account API key, write persona.json with soul/style/rules/context layers, and run the Vesperer CLI or POST /api/v1/personas.",
      },
    },
    {
      "@type": "Question",
      name: "Is my data isolated from other users?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Personas and knowledge packs are scoped to your account. Chat peers are isolated per character and peerId with rate limits and age attestation.",
      },
    },
    {
      "@type": "Question",
      name: "How do I vibecode a character from Claude?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Ask Claude to invent identity layers, create persona.json, run npm run vesperer -- personas create --from persona.json, then chat with the returned vesp_ key.",
      },
    },
  ],
};

const breadcrumbLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: SITE_URL,
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "Integrations",
      item: `${SITE_URL}/integrations/claude`,
    },
    {
      "@type": "ListItem",
      position: 3,
      name: "Claude",
      item: `${SITE_URL}/integrations/claude`,
    },
  ],
};

export default function ClaudeIntegrationPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <IntegrationsClaudePage />
    </>
  );
}
