import type { Metadata } from "next";
import { RegistryIndex } from "@/components/registry/RegistryIndex";
import { listRegistryPersonas } from "@/lib/registry/public";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Persona Registry",
  description:
    "Canonical AI personas with versions, licenses, knowledge packs, and multi-platform export. Create on Vesperer. Publish anywhere.",
  alternates: { canonical: `${SITE_URL}/registry` },
  keywords: [
    "AI persona registry",
    "character version control",
    "Chai character creator",
    "export AI character",
    "canonical AI persona",
  ],
  openGraph: {
    title: `Persona Registry · ${SITE_NAME}`,
    description:
      "Build, version, and distribute AI personas. Keep the original. Publish everywhere.",
    url: `${SITE_URL}/registry`,
    type: "website",
  },
};

export default async function RegistryPage() {
  const personas = await listRegistryPersonas({ adult: false, limit: 48 });
  return <RegistryIndex personas={personas} />;
}
