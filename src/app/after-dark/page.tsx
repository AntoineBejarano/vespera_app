import type { Metadata } from "next";
import { Suspense } from "react";
import { AfterDarkLanding } from "@/components/AfterDarkLanding";
import { AFTER_DARK_KEYWORDS } from "@/lib/seo/keywords";
import { AFTER_DARK_URL, SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: `After Dark — Private AI companions | ${SITE_NAME}`,
  description:
    "Build adult AI companions with consistent personalities, evolving relationships, private deployment and full control over their identity. 18+ only.",
  alternates: { canonical: AFTER_DARK_URL },
  keywords: AFTER_DARK_KEYWORDS,
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: `Vesperer After Dark — Private AI companions`,
    description:
      "Adult characters with memory, relationship progression and creator-owned identity. Enter 18+.",
    url: AFTER_DARK_URL,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `Vesperer After Dark — Private AI companions`,
    description:
      "Adult AI companions with persistent memory and creator-owned identity. 18+ only.",
  },
};

export default function AfterDarkPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-[var(--muted)]">
          Loading…
        </div>
      }
    >
      <AfterDarkLanding />
    </Suspense>
  );
}
