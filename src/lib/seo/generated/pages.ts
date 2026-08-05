import "server-only";
import { cache } from "react";
import { prisma } from "@/lib/db";
import {
  seoGeneratedContentSchema,
  type SeoGeneratedContent,
} from "@/lib/seo/generated/schema";
import { SITE_URL } from "@/lib/site";

export type PublishedSeoGeneratedPage = {
  id: string;
  slug: string;
  title: string;
  h1: string;
  metaDescription: string;
  summary: string;
  category: string;
  audience: string | null;
  useCase: string;
  intent: string | null;
  score: number;
  publishedAt: Date | null;
  updatedAt: Date;
  content: SeoGeneratedContent;
};

function parseContent(raw: unknown): SeoGeneratedContent | null {
  const parsed = seoGeneratedContentSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

export const getPublishedGeneratedSeoPage = cache(async (slug: string) => {
  try {
    const row = await prisma.seoGeneratedPage.findFirst({
      where: { slug, status: "published" },
    });
    if (!row) return null;

    const content = parseContent(row.contentJson);
    if (!content) return null;

    return {
      id: row.id,
      slug: row.slug,
      title: row.title,
      h1: row.h1,
      metaDescription: row.metaDescription,
      summary: row.summary,
      category: row.category,
      audience: row.audience,
      useCase: row.useCase,
      intent: row.intent,
      score: row.score,
      publishedAt: row.publishedAt,
      updatedAt: row.updatedAt,
      content,
    } satisfies PublishedSeoGeneratedPage;
  } catch (error) {
    console.error("[seo_generated] failed to load page", { slug, error });
    return null;
  }
});

export async function listPublishedGeneratedSeoPages() {
  try {
    const rows = await prisma.seoGeneratedPage.findMany({
      where: { status: "published" },
      orderBy: { publishedAt: "desc" },
      take: 5000,
      select: {
        slug: true,
        updatedAt: true,
        publishedAt: true,
      },
    });
    return rows;
  } catch (error) {
    console.error("[seo_generated] failed to list pages", { error });
    return [];
  }
}

export function generatedSeoPath(slug: string) {
  return `/use-cases/${slug}`;
}

export function generatedSeoUrl(slug: string) {
  return `${SITE_URL}${generatedSeoPath(slug)}`;
}
