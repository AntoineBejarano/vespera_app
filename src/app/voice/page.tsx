import type { Metadata } from "next";
import { VoiceBusinessPage } from "@/components/VoiceBusinessPage";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Voice characters with persistent memory",
  description:
    "Vesperer Voice: the character layer for spoken AI — persistent characters, per-user relationships, emotional memory, chat↔voice continuity, creator studios, versions, engagement analytics, operator handoff, and premium monetization. Telephony (e.g. Bland) optional underneath.",
  alternates: { canonical: `${SITE_URL}/voice` },
  keywords: [
    "voice AI characters",
    "persistent AI character",
    "AI character memory",
    "chat voice continuity",
    "emotional memory AI",
    "creator character studio",
    "AI character versions",
    "voice agent monetization",
    "operator handoff AI",
    "Bland AI character layer",
    "conversational voice AI",
  ],
  openGraph: {
    title: `Voice characters with memory · ${SITE_NAME}`,
    description:
      "Speak with persistent characters that remember each user across chat and voice. Creator studios, variants, analytics, handoff, and premium — phone rails optional.",
    url: `${SITE_URL}/voice`,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `Voice characters with memory · ${SITE_NAME}`,
    description:
      "Spoken AI with persistent identity, per-user memory, and chat↔voice continuity.",
  },
};

const faqLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is Vesperer Voice?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Vesperer Voice is the spoken surface of the Vesperer character layer: persistent identities, per-user relationships, emotional memory, and continuity across chat and voice.",
      },
    },
    {
      "@type": "Question",
      name: "Is Bland AI a competitor to Vesperer?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Not necessarily. Bland provides phone infrastructure; Vesperer owns the character and memory layer. Bland can be used as an optional telephony dependency underneath Vesperer characters.",
      },
    },
    {
      "@type": "Question",
      name: "Does memory work across chat and voice?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Facts, preferences, promises, and emotional context persist for the same peer across chat, voice, and connected channels.",
      },
    },
  ],
};

export default function VoicePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
      />
      <VoiceBusinessPage />
    </>
  );
}
