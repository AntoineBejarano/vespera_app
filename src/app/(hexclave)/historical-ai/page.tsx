import type { Metadata } from "next";
import { SeoHubPage, type SeoHubLink } from "@/components/seo/SeoHubPage";
import { listByVerb, seoPath } from "@/lib/seo/catalog";
import { breadcrumbJsonLd } from "@/lib/seo/breadcrumbs";
import { SITE_NAME, SITE_URL } from "@/lib/site";

const title = `Historical AI Personas | ${SITE_NAME}`;
const description =
  "Talk to historical AI personas with clear AI disclosure, factual context, provenance links and memory across sessions.";
const path = "/historical-ai";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: `${SITE_URL}${path}` },
  openGraph: { title, description, url: `${SITE_URL}${path}`, type: "website" },
};

const links: SeoHubLink[] = [
  {
    href: "/meet/plato",
    label: "Talk to Plato AI",
    description: "Dialogue about justice, virtue and knowledge.",
  },
  {
    href: "/meet/marcus-aurelius",
    label: "Talk to Marcus Aurelius AI",
    description: "Stoic reflection with remembered pressure points.",
  },
  {
    href: "/create/historical-persona",
    label: "Create a historical persona",
    description: "Build source-grounded personas for museums and education.",
  },
];

export default function HistoricalAiHubPage() {
  const pages = [
    ...listByVerb("meet"),
    ...listByVerb("create").filter((page) => page.slug === "historical-persona"),
    ...listByVerb("hire").filter((page) => page.slug === "museum-guide"),
    ...listByVerb("learn").filter((page) => page.slug === "history-tutor"),
  ];
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
        { name: "Historical AI", path },
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
        eyebrow="Historical AI"
        title="Historical AI personas with context and provenance"
        description={description}
        intro="The canonical SEO route for each person is /meet/{persona}. This hub groups those pages with history tutoring, museum-guide and historical-persona creation paths so users and crawlers understand the cluster without duplicating the same keywords."
        links={links}
        pages={pages}
        footerLinks={[
          { href: "/ai-tutors", label: "AI tutors", description: "" },
          { href: "/ai-characters", label: "AI characters", description: "" },
          { href: "/explore?filter=meet", label: "All great minds", description: "" },
        ]}
      />
    </>
  );
}
