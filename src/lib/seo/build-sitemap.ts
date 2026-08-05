import type { MetadataRoute } from "next";
import { SHOWCASE_CHARACTERS } from "@/lib/characters/showcase";
import { prisma } from "@/lib/db";
import { LEGAL_PAGES } from "@/lib/legal/constants";
import { listAllForSitemap } from "@/lib/seo/catalog";
import { APEX_STATIC_PAGES, apexUrl, afterDarkUrl } from "@/lib/seo/public-pages";
import { SITE_URL } from "@/lib/site";

const PUBLIC_CHAR_LIMIT = 5000;

type PublicCharRow = {
  slug: string;
  updatedAt: Date;
  photoUrl: string | null;
};

function absoluteAsset(pathOrUrl: string | null | undefined): string | undefined {
  if (!pathOrUrl) return undefined;
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  const path = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`;
  return `${SITE_URL}${path}`;
}

async function loadPublicSfwCharacters(): Promise<PublicCharRow[]> {
  try {
    const rows = await prisma.character.findMany({
      where: {
        isPublic: true,
        isAdult: false,
        slug: { not: null },
        archivedAt: null,
      },
      select: {
        slug: true,
        updatedAt: true,
        photos: {
          take: 1,
          orderBy: { createdAt: "asc" },
          select: { url: true },
        },
      },
      orderBy: { updatedAt: "desc" },
      take: PUBLIC_CHAR_LIMIT,
    });

    return rows
      .filter((r): r is typeof r & { slug: string } => Boolean(r.slug))
      .map((r) => ({
        slug: r.slug,
        updatedAt: r.updatedAt,
        photoUrl: r.photos[0]?.url ?? null,
      }));
  } catch {
    return [];
  }
}

function entry(
  url: string,
  opts: {
    lastModified?: Date | string;
    changeFrequency?: MetadataRoute.Sitemap[number]["changeFrequency"];
    priority?: number;
    images?: string[];
  } = {},
): MetadataRoute.Sitemap[number] {
  const images = opts.images?.filter(Boolean);
  return {
    url,
    lastModified: opts.lastModified ?? new Date(),
    changeFrequency: opts.changeFrequency ?? "weekly",
    priority: opts.priority ?? 0.5,
    ...(images && images.length > 0 ? { images } : {}),
  };
}

/** Apex (vesperer.com) — SFW only. Never includes xxx.vesperer.com URLs. */
export async function buildApexSitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const publicChars = await loadPublicSfwCharacters();
  const showcaseSlugs = new Set(
    SHOWCASE_CHARACTERS.filter((c) => !c.isAdult).map((c) => c.slug),
  );

  const staticEntries = APEX_STATIC_PAGES.map((p) =>
    entry(apexUrl(p.path), {
      lastModified: now,
      changeFrequency: p.changeFrequency,
      priority: p.priority,
    }),
  );

  const seoEntries = listAllForSitemap().map(({ path }) =>
    entry(apexUrl(path), {
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.85,
    }),
  );

  const showcaseChat = SHOWCASE_CHARACTERS.filter((c) => !c.isAdult).map((c) =>
    entry(apexUrl(`/c/${c.slug}`), {
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.75,
      images: [absoluteAsset(c.imageUrl)].filter(Boolean) as string[],
    }),
  );

  const dbOnly = publicChars.filter((c) => !showcaseSlugs.has(c.slug));

  const dbRegistry = dbOnly.map((c) =>
    entry(apexUrl(`/p/${c.slug}`), {
      lastModified: c.updatedAt,
      changeFrequency: "weekly",
      priority: 0.8,
      images: [absoluteAsset(c.photoUrl)].filter(Boolean) as string[],
    }),
  );

  const dbChat = dbOnly.map((c) =>
    entry(apexUrl(`/c/${c.slug}`), {
      lastModified: c.updatedAt,
      changeFrequency: "weekly",
      priority: 0.7,
      images: [absoluteAsset(c.photoUrl)].filter(Boolean) as string[],
    }),
  );

  const legalEntries = LEGAL_PAGES.map((page) =>
    entry(apexUrl(`/legal/${page.slug}`), {
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.3,
    }),
  );

  return [
    ...staticEntries,
    ...seoEntries,
    ...dbRegistry,
    ...showcaseChat,
    ...dbChat,
    ...legalEntries,
  ];
}

/**
 * After Dark (xxx.vesperer.com) — adult surface only.
 * Same-host URLs exclusively (search engines ignore cross-host locs).
 * Adult persona /p and /c stay noindex in page metadata — do not list them.
 */
export function buildAfterDarkSitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    entry(afterDarkUrl("/"), {
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    }),
  ];
}
