import type { Metadata } from "next";
import { Suspense } from "react";
import { AfterDarkLanding } from "@/components/AfterDarkLanding";
import { PageSpinner } from "@/components/Spinner";
import { AFTER_DARK_KEYWORDS } from "@/lib/seo/keywords";
import { AFTER_DARK_URL, SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: `After Dark — Private companions that remember | ${SITE_NAME}`,
  description:
    "Someone who remembers exactly what you like. Private, persistent adult AI companions with evolving chemistry and creator-owned identity. 18+ only.",
  alternates: { canonical: AFTER_DARK_URL },
  keywords: AFTER_DARK_KEYWORDS,
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: `Vesperer After Dark — Private companions that remember`,
    description:
      "Private, persistent and entirely yours. The chemistry stays. The memory does too. 18+.",
    url: AFTER_DARK_URL,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `Vesperer After Dark — Private companions that remember`,
    description:
      "Adult AI companions with persistent memory and creator-owned identity. 18+ only.",
  },
};

export default function AfterDarkPage() {
  return (
    <Suspense fallback={<PageSpinner variant="after-dark" />}>
      <AfterDarkLanding />
    </Suspense>
  );
}
