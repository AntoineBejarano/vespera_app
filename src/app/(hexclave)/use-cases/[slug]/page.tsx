import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { GeneratedSeoPageLayout } from "@/components/seo/GeneratedSeoPageLayout";
import { resolveUseCaseAlias } from "@/lib/seo/catalog";
import {
  generatedSeoUrl,
  getPublishedGeneratedSeoPage,
} from "@/lib/seo/generated/pages";
import { breadcrumbJsonLd } from "@/lib/seo/breadcrumbs";
import { SITE_NAME } from "@/lib/site";

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPublishedGeneratedSeoPage(slug);
  if (!page) return { title: `Use case · ${SITE_NAME}` };

  const canonical = generatedSeoUrl(page.slug);
  return {
    title: { absolute: page.title },
    description: page.metaDescription,
    alternates: { canonical },
    openGraph: {
      title: page.title,
      description: page.metaDescription,
      url: canonical,
      type: "article",
      siteName: SITE_NAME,
    },
    twitter: {
      card: "summary_large_image",
      title: page.title,
      description: page.metaDescription,
    },
  };
}

export default async function UseCasesAliasPage({ params }: Params) {
  const { slug } = await params;
  const page = await getPublishedGeneratedSeoPage(slug);
  if (page) {
    const jsonLd = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "Article",
          headline: page.h1,
          description: page.metaDescription,
          url: generatedSeoUrl(page.slug),
          datePublished: page.publishedAt?.toISOString(),
          dateModified: page.updatedAt.toISOString(),
          author: { "@type": "Organization", name: SITE_NAME },
          publisher: { "@type": "Organization", name: SITE_NAME },
        },
        breadcrumbJsonLd([
          { name: "Explore", path: "/explore" },
          { name: "Use cases", path: "/explore?filter=use-cases" },
          { name: page.h1, path: `/use-cases/${page.slug}` },
        ]),
        {
          "@type": "FAQPage",
          mainEntity: page.content.faqs.map((faq) => ({
            "@type": "Question",
            name: faq.q,
            acceptedAnswer: { "@type": "Answer", text: faq.a },
          })),
        },
      ],
    };

    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <GeneratedSeoPageLayout page={page} />
      </>
    );
  }

  const target = resolveUseCaseAlias(slug);
  if (!target) notFound();
  permanentRedirect(target);
}
