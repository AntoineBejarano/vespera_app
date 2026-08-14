import type { Metadata } from "next";
import { SeoHubPage, type SeoHubLink } from "@/components/seo/SeoHubPage";
import { listAllSeoPages, seoPath } from "@/lib/seo/catalog";
import { breadcrumbJsonLd } from "@/lib/seo/breadcrumbs";
import { SITE_NAME, SITE_URL } from "@/lib/site";

const title = `AI Characters with Memory | ${SITE_NAME}`;
const description =
  "Create, meet and import AI characters with persistent identity, long-term memory and portable exports.";
const path = "/ai-characters";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: `${SITE_URL}${path}` },
  openGraph: { title, description, url: `${SITE_URL}${path}`, type: "website" },
};

const links: SeoHubLink[] = [
  {
    href: "/create/ai-character",
    label: "AI character creator",
    description:
      "Primary creator page for persistent identity, memory and portability.",
  },
  {
    href: "/historical-ai",
    label: "Historical AI",
    description:
      "Great minds and historical personas with transparent provenance.",
  },
  {
    href: "/character-tools",
    label: "Character tools",
    description:
      "Character Card, SillyTavern, Chai and import/export workflows.",
  },
];

export default function AiCharactersHubPage() {
  const pages = listAllSeoPages().filter(
    (page) =>
      page.verb === "create" ||
      ["plato", "socrates", "ada-lovelace", "marie-curie"].includes(page.slug),
  );
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
        { name: "AI characters", path },
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
        eyebrow="AI characters"
        title="AI characters with memory and portable identity"
        description={description}
        intro="Vesperer positions the character as a durable identity, not a disposable prompt. Use this hub to move between creation, historical personas, imports, exports and live examples without splitting the same search intent across duplicate pages."
        links={links}
        pages={pages}
        footerLinks={[
          { href: "/explore", label: "Explore all paths", description: "" },
          { href: "/registry", label: "Persona Registry", description: "" },
          { href: "/ai-tutors", label: "AI tutors", description: "" },
        ]}
      />
    </>
  );
}
