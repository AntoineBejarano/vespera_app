import type { Metadata } from "next";
import {
  RegistryIndex,
  type RegistryDisplayItem,
} from "@/components/registry/RegistryIndex";
import { SHOWCASE_CHARACTERS } from "@/lib/characters/showcase";
import { isProfessionalPersona } from "@/lib/professionals";
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
  const community = (await listRegistryPersonas({ adult: false, limit: 48 })).map<RegistryDisplayItem>(
    (persona) => ({
      ...persona,
      href: `/p/${persona.slug}`,
      professional: isProfessionalPersona(persona.categories),
    }),
  );
  const communitySlugs = new Set(community.map((persona) => persona.slug));
  const ownedByVesperer = SHOWCASE_CHARACTERS
    .filter((persona) => !persona.isAdult && !communitySlugs.has(persona.slug))
    .map<RegistryDisplayItem>((persona) => ({
      slug: persona.slug,
      href: `/c/${persona.slug}`,
      name: persona.name,
      tagline: persona.tagline,
      creatorLabel: persona.creatorLabel,
      version: "1.0",
      licenseLabel: "Vesperer curated",
      categories: persona.categories,
      photoUrl: persona.imageUrl,
      forkCount: 0,
      isAdult: false,
      channelLabels: ["Vesperer", "Web"],
      professional: persona.categories.some(
        (category) => category.toLocaleLowerCase("en") === "professionals",
      ),
    }));
  const personas = [...ownedByVesperer, ...community];
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
          url: `${SITE_URL}${persona.href}`,
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
      <RegistryIndex
        ownedByVesperer={ownedByVesperer}
        community={community}
      />
    </>
  );
}
