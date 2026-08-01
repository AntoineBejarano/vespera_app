import type { Metadata } from "next";
import { Suspense } from "react";
import { ExploreHub } from "@/components/seo/ExploreHub";
import { PageSpinner } from "@/components/Spinner";
import { listAllSeoPages } from "@/lib/seo/catalog";
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

async function ExploreInner({ searchParams }: Props) {
  const { filter } = await searchParams;
  return (
    <ExploreHub pages={listAllSeoPages()} initialFilter={filter ?? null} />
  );
}

export default function ExplorePage(props: Props) {
  return (
    <Suspense fallback={<PageSpinner />}>
      <ExploreInner {...props} />
    </Suspense>
  );
}
