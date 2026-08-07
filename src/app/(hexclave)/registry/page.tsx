import type { Metadata } from "next";
import { RegistryIndex } from "@/components/registry/RegistryIndex";
import { listRegistryPersonas } from "@/lib/registry/public";
import { breadcrumbJsonLd } from "@/lib/seo/breadcrumbs";
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
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        name: "Persona Registry",
        description: metadata.description,
        url: `${SITE_URL}/registry`,
        isPartOf: {
          "@type": "WebSite",
          name: SITE_NAME,
          url: SITE_URL,
        },
      },
      {
        "@type": "ItemList",
        name: "Public AI personas on Vesperer",
        numberOfItems: personas.length,
        itemListElement: personas.map((persona, index) => ({
          "@type": "ListItem",
          position: index + 1,
          url: `${SITE_URL}/p/${persona.slug}`,
          name: persona.name,
          description: persona.tagline,
        })),
      },
      breadcrumbJsonLd([
        { name: "Home", path: "/" },
        { name: "Persona Registry", path: "/registry" },
      ]),
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <RegistryIndex personas={personas} />
    </>
  );
}
