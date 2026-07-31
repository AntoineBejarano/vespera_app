import { prisma } from "@/lib/db";
import {
  getShowcaseBySlug,
  SHOWCASE_CHARACTERS,
  type ShowcaseCharacter,
} from "@/lib/characters/showcase";

export type PublicCharacterView = {
  source: "db" | "showcase";
  id: string | null;
  slug: string;
  name: string;
  tagline: string;
  openingLine: string;
  categories: string[];
  isAdult: boolean;
  allowFork: boolean;
  conversationCount: number;
  creatorLabel: string;
  creatorId: string | null;
  photoUrl: string | null;
  soulPreview: string;
};

function preview(md: string | null | undefined) {
  return (md || "")
    .replace(/^#+\s.*/gm, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 220);
}

function fromShowcase(c: ShowcaseCharacter): PublicCharacterView {
  return {
    source: "showcase",
    id: null,
    slug: c.slug,
    name: c.name,
    tagline: c.tagline,
    openingLine: c.openingLine,
    categories: c.categories,
    isAdult: c.isAdult,
    allowFork: c.allowFork,
    conversationCount: c.conversationCount,
    creatorLabel: c.creatorLabel,
    creatorId: null,
    photoUrl: null,
    soulPreview: preview(c.soulMd),
  };
}

export async function getPublicCharacterBySlug(
  slug: string,
): Promise<PublicCharacterView | null> {
  try {
    const fromDb = await prisma.character.findFirst({
      where: { slug, isPublic: true },
      select: {
        id: true,
        slug: true,
        name: true,
        tagline: true,
        openingLine: true,
        categories: true,
        isAdult: true,
        allowFork: true,
        soulMd: true,
        user: { select: { id: true, name: true } },
        photos: {
          take: 1,
          orderBy: { createdAt: "desc" },
          select: { url: true },
        },
        _count: {
          select: {
            conversations: true,
            relationships: true,
          },
        },
      },
    });

    if (fromDb?.slug) {
      return {
        source: "db",
        id: fromDb.id,
        slug: fromDb.slug,
        name: fromDb.name,
        tagline: fromDb.tagline || `Talk with ${fromDb.name}.`,
        openingLine:
          fromDb.openingLine || `Hi — I'm ${fromDb.name}. Shall we begin?`,
        categories: fromDb.categories,
        isAdult: fromDb.isAdult,
        allowFork: fromDb.allowFork,
        conversationCount:
          fromDb._count.conversations + fromDb._count.relationships,
        creatorLabel: fromDb.user.name || "Creator",
        creatorId: fromDb.user.id,
        photoUrl: fromDb.photos[0]?.url ?? null,
        soulPreview: preview(fromDb.soulMd),
      };
    }
  } catch {
    // Fall through to curated showcase during build / DB outages.
  }

  const showcase = getShowcaseBySlug(slug);
  return showcase ? fromShowcase(showcase) : null;
}

export async function listPublicCharacters(opts?: {
  adult?: boolean;
  limit?: number;
}): Promise<PublicCharacterView[]> {
  const limit = opts?.limit ?? 24;
  const adult = opts?.adult ?? false;

  const dbRows = await prisma.character.findMany({
    where: { isPublic: true, isAdult: adult },
    orderBy: { updatedAt: "desc" },
    take: limit,
    select: {
      id: true,
      slug: true,
      name: true,
      tagline: true,
      openingLine: true,
      categories: true,
      isAdult: true,
      allowFork: true,
      soulMd: true,
      user: { select: { id: true, name: true } },
      photos: {
        take: 1,
        orderBy: { createdAt: "desc" },
        select: { url: true },
      },
      _count: {
        select: { conversations: true, relationships: true },
      },
    },
  });

  const fromDb: PublicCharacterView[] = dbRows
    .filter((r): r is typeof r & { slug: string } => Boolean(r.slug))
    .map((fromDbRow) => ({
      source: "db" as const,
      id: fromDbRow.id,
      slug: fromDbRow.slug,
      name: fromDbRow.name,
      tagline: fromDbRow.tagline || `Talk with ${fromDbRow.name}.`,
      openingLine:
        fromDbRow.openingLine || `Hi — I'm ${fromDbRow.name}. Shall we begin?`,
      categories: fromDbRow.categories,
      isAdult: fromDbRow.isAdult,
      allowFork: fromDbRow.allowFork,
      conversationCount:
        fromDbRow._count.conversations + fromDbRow._count.relationships,
      creatorLabel: fromDbRow.user.name || "Creator",
      creatorId: fromDbRow.user.id,
      photoUrl: fromDbRow.photos[0]?.url ?? null,
      soulPreview: preview(fromDbRow.soulMd),
    }));

  const showcase = SHOWCASE_CHARACTERS.filter((c) => c.isAdult === adult).map(
    fromShowcase,
  );

  // Prefer DB rows; fill with showcase for empty discovery.
  const seen = new Set(fromDb.map((c) => c.slug));
  const merged = [
    ...fromDb,
    ...showcase.filter((c) => !seen.has(c.slug)),
  ].slice(0, limit);

  return merged;
}

export async function ensureUniqueSlug(
  base: string,
  excludeId?: string,
): Promise<string> {
  const { slugifyName } = await import("@/lib/characters/slug");
  const root = slugifyName(base);

  for (let i = 0; i < 30; i++) {
    const candidate = i === 0 ? root : `${root}-${i + 1}`;
    const reserved = Boolean(getShowcaseBySlug(candidate));
    const clash = await prisma.character.findFirst({
      where: {
        slug: candidate,
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
      select: { id: true },
    });
    if (!reserved && !clash) return candidate;
  }

  return `${root}-${Date.now().toString(36)}`;
}
