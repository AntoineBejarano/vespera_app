import type { MetadataRoute } from "next";
import { LEGAL_PAGES } from "@/lib/legal/constants";
import { SHOWCASE_CHARACTERS } from "@/lib/characters/showcase";
import { SITE_URL } from "@/lib/site";
import { prisma } from "@/lib/db";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  let publicChars: { slug: string | null; updatedAt: Date }[] = [];
  try {
    publicChars = await prisma.character.findMany({
      where: { isPublic: true, isAdult: false, slug: { not: null } },
      select: { slug: true, updatedAt: true },
      take: 500,
    });
  } catch {
    publicChars = [];
  }

  const showcaseEntries = SHOWCASE_CHARACTERS.filter((c) => !c.isAdult).map(
    (c) => ({
      url: `${SITE_URL}/c/${c.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }),
  );

  const dbEntries = publicChars
    .filter((c): c is { slug: string; updatedAt: Date } => Boolean(c.slug))
    .filter((c) => !SHOWCASE_CHARACTERS.some((s) => s.slug === c.slug))
    .map((c) => ({
      url: `${SITE_URL}/c/${c.slug}`,
      lastModified: c.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.75,
    }));

  return [
    {
      url: SITE_URL,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/bring`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/technology`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/after-dark`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    ...showcaseEntries,
    ...dbEntries,
    ...LEGAL_PAGES.map((page) => ({
      url: `${SITE_URL}/legal/${page.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.3,
    })),
  ];
}
