import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SeoPageLayout } from "@/components/seo/SeoPageLayout";
import { breadcrumbJsonLd } from "@/lib/seo/breadcrumbs";
import {
  getSeoPage,
  listByVerb,
  seoPath,
  VERB_LABELS,
  type SeoVerb,
} from "@/lib/seo/catalog";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export function seoStaticParams(verb: SeoVerb) {
  return listByVerb(verb).map((p) => ({ slug: p.slug }));
}

export async function seoGenerateMetadata(
  verb: SeoVerb,
  slug: string,
): Promise<Metadata> {
  const page = getSeoPage(verb, slug);
  if (!page) return { title: `Not found · ${SITE_NAME}` };
  const canonical = `${SITE_URL}${seoPath(verb, slug)}`;
  return {
    title: { absolute: page.title },
    description: page.metaDescription,
    alternates: { canonical },
    openGraph: {
      title: page.title,
      description: page.metaDescription,
      url: canonical,
      type: "website",
      siteName: SITE_NAME,
    },
    twitter: {
      card: "summary_large_image",
      title: page.title,
      description: page.metaDescription,
    },
  };
}

export function SeoVerbPage({
  verb,
  slug,
}: {
  verb: SeoVerb;
  slug: string;
}) {
  const page = getSeoPage(verb, slug);
  if (!page) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        name: page.h1,
        description: page.metaDescription,
        url: `${SITE_URL}${seoPath(verb, slug)}`,
      },
      breadcrumbJsonLd([
        { name: "Explore", path: "/explore" },
        { name: VERB_LABELS[verb], path: `/explore?filter=${verb}` },
        { name: page.name, path: seoPath(verb, slug) },
      ]),
      ...(page.faqs.length
        ? [
            {
              "@type": "FAQPage",
              mainEntity: page.faqs.map((f) => ({
                "@type": "Question",
                name: f.q,
                acceptedAnswer: { "@type": "Answer", text: f.a },
              })),
            },
          ]
        : []),
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SeoPageLayout page={page} />
    </>
  );
}
