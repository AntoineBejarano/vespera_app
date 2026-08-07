import type { Metadata } from "next";
import { ExploreHub } from "@/components/seo/ExploreHub";
import { listAllSeoPages, seoPath, VERB_LABELS } from "@/lib/seo/catalog";
import { breadcrumbJsonLd } from "@/lib/seo/breadcrumbs";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: `Explore what AI can become | ${SITE_NAME}`,
  description:
    "Meet great minds, learn with mentors, hire AI employees, or create a persona with memory — browse every Vesperer path in one place.",
  alternates: { canonical: `${SITE_URL}/explore` },
  openGraph: {
    title: `Explore what AI can become | ${SITE_NAME}`,
    description:
      "Characters, tutors, AI employees and creation paths — each with a substantial page, not an empty card.",
    url: `${SITE_URL}/explore`,
  },
};

type Props = { searchParams: Promise<{ filter?: string }> };

export default async function ExplorePage({ searchParams }: Props) {
  const { filter } = await searchParams;
  const pages = listAllSeoPages();
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        name: "Explore what AI can become",
        description: metadata.description,
        url: `${SITE_URL}/explore`,
        isPartOf: {
          "@type": "WebSite",
          name: SITE_NAME,
          url: SITE_URL,
        },
      },
      {
        "@type": "ItemList",
        name: "Vesperer AI persona paths",
        numberOfItems: pages.length,
        itemListElement: pages.map((page, index) => ({
          "@type": "ListItem",
          position: index + 1,
          url: `${SITE_URL}${seoPath(page.verb, page.slug)}`,
          name: page.name,
          description: page.summary,
          item: {
            "@type": "WebPage",
            name: page.h1,
            url: `${SITE_URL}${seoPath(page.verb, page.slug)}`,
            about: VERB_LABELS[page.verb],
          },
        })),
      },
      breadcrumbJsonLd([
        { name: "Home", path: "/" },
        { name: "Explore", path: "/explore" },
      ]),
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ExploreHub pages={pages} initialFilter={filter ?? null} />
    </>
  );
}
