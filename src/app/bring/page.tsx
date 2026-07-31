import type { Metadata } from "next";
import { Suspense } from "react";
import { BringCharacterFlow } from "@/components/BringCharacterFlow";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Bring an existing character",
  description:
    "Import a Character Card, JSON, prompt, SillyTavern export or conversation history. Rebuild identity and continue without starting from zero.",
  alternates: { canonical: `${SITE_URL}/bring` },
  keywords: [
    "import AI character",
    "character card import",
    "SillyTavern import",
    "how to back up an AI character",
    "how to move an AI character between platforms",
    "how to recreate your Chai character",
  ],
  openGraph: {
    title: `Bring an existing character · ${SITE_NAME}`,
    description:
      "Import characters you created or have permission to use. Preserve identity and memories.",
    url: `${SITE_URL}/bring`,
  },
};

export default function BringPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-[var(--muted)]">
          Loading…
        </div>
      }
    >
      <BringCharacterFlow />
    </Suspense>
  );
}
