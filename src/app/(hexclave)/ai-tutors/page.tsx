import type { Metadata } from "next";
import { SeoHubPage, type SeoHubLink } from "@/components/seo/SeoHubPage";
import { listByVerb, seoPath } from "@/lib/seo/catalog";
import { breadcrumbJsonLd } from "@/lib/seo/breadcrumbs";
import { SITE_NAME, SITE_URL } from "@/lib/site";

const title = `AI Tutors That Remember Progress | ${SITE_NAME}`;
const description =
  "AI tutors for philosophy, history, physics, math, programming, writing, languages and interviews, differentiated by memory of user progress.";
const path = "/ai-tutors";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: `${SITE_URL}${path}` },
  openGraph: { title, description, url: `${SITE_URL}${path}`, type: "website" },
};

const links: SeoHubLink[] = [
  {
    href: "/learn/stoic-mentor",
    label: "Stoic Mentor",
    description: "Practice judgment, control and action with continuity.",
  },
  {
    href: "/learn/history-tutor",
    label: "History Tutor",
    description: "Essay and timeline coaching that keeps the thread.",
  },
  {
    href: "/learn/programming-tutor",
    label: "Programming Tutor",
    description: "Debugging and project learning with remembered context.",
  },
];

export default function AiTutorsHubPage() {
  const pages = listByVerb("learn");
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
        { name: "AI tutors", path },
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
        eyebrow="AI tutors"
        title="AI tutors that remember the student's progress"
        description={description}
        intro="The tutor cluster is built around one differentiator: memory. Each /learn page can target a subject or coaching use case while linking back here for the broader AI tutor architecture."
        links={links}
        pages={pages}
        footerLinks={[
          { href: "/historical-ai", label: "Historical AI", description: "" },
          { href: "/create/ai-character", label: "Create a tutor", description: "" },
          { href: "/explore?filter=learn", label: "All learn paths", description: "" },
        ]}
      />
    </>
  );
}
