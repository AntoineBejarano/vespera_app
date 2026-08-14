import type { Metadata } from "next";
import { SeoHubPage, type SeoHubLink } from "@/components/seo/SeoHubPage";
import { listByVerb, seoPath } from "@/lib/seo/catalog";
import { breadcrumbJsonLd } from "@/lib/seo/breadcrumbs";
import { SITE_NAME, SITE_URL } from "@/lib/site";

const title = `AI Character Tools | ${SITE_NAME}`;
const description =
  "Character Card, SillyTavern, Chai and import/export tools for AI characters with portable identity and long-term memory.";
const path = "/character-tools";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: `${SITE_URL}${path}` },
  openGraph: { title, description, url: `${SITE_URL}${path}`, type: "website" },
};

const links: SeoHubLink[] = [
  {
    href: "/create/character-card",
    label: "Character Card creator",
    description: "Build portable character-card snapshots from a master persona.",
  },
  {
    href: "/create/sillytavern-character",
    label: "SillyTavern import",
    description: "Create or import SillyTavern-style character workflows.",
  },
  {
    href: "/chai-character-creator",
    label: "Chai character creator",
    description: "Chai-specific creator page with copy-paste export intent.",
  },
];

export default function CharacterToolsHubPage() {
  const toolSlugs = new Set([
    "ai-character",
    "character-card",
    "sillytavern-character",
    "import-export-ai-characters",
    "character-ai-alternative",
    "chai-alternative",
  ]);
  const pages = listByVerb("create").filter((page) => toolSlugs.has(page.slug));
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        name: title,
        description,
        url: `${SITE_URL}${path}`,
      },
      {
        "@type": "ItemList",
        itemListElement: pages.map((page, index) => ({
          "@type": "ListItem",
          position: index + 1,
          url: `${SITE_URL}${seoPath(page.verb, page.slug)}`,
          name: page.name,
        })),
      },
      breadcrumbJsonLd([
        { name: "Home", path: "/" },
        { name: "Character tools", path },
      ]),
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SeoHubPage
        eyebrow="Character tools"
        title="AI character tools for portability, import and export"
        description={description}
        intro="This hub keeps tool intent separate from the primary AI character creator page. Use it for Character Card, SillyTavern, import/export and alternative-platform searches."
        links={links}
        pages={pages}
        footerLinks={[
          { href: "/create/ai-character", label: "AI character creator", description: "" },
          { href: "/bring", label: "Bring a character", description: "" },
          { href: "/registry", label: "Persona Registry", description: "" },
        ]}
      />
    </>
  );
}
