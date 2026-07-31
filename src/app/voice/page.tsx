import type { Metadata } from "next";
import { VoiceBusinessPage } from "@/components/VoiceBusinessPage";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Voice AI agents with long-term memory",
  description:
    "Vesperer Voice: conversational voice AI and AI phone agents with unified memory across voice, chat, and channels. IVR replacement, inbound agents, outbound follow-ups, and AI contact center use cases.",
  alternates: { canonical: `${SITE_URL}/voice` },
  keywords: [
    "voice AI",
    "AI phone agent",
    "conversational voice AI",
    "IVR replacement",
    "AI call center",
    "inbound call agent",
    "outbound call agent",
    "AI contact center",
    "voice AI with memory",
    "Bland AI alternative",
    "AI phone calls",
  ],
  openGraph: {
    title: `Voice AI agents with memory · ${SITE_NAME}`,
    description:
      "Click to speak with an agent. Unified memory means your voice AI never loses context across calls and channels.",
    url: `${SITE_URL}/voice`,
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
        text: "Vesperer Voice is a voice AI layer for characters and agents that hold real conversations and remember callers over time across voice, chat, and channels.",
      },
    },
    {
      "@type": "Question",
      name: "Can Vesperer replace an IVR or call center?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Use natural-language voice agents for IVR replacement, inbound and outbound calls, and AI contact center workflows, with durable memory for returning callers.",
      },
    },
    {
      "@type": "Question",
      name: "Does the voice agent remember previous conversations?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Important facts, preferences, promises, and relationship context persist across sessions for the same peer.",
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
