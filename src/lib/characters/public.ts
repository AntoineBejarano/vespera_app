import { prisma } from "@/lib/db";
import {
  getShowcaseBySlug,
  SHOWCASE_CHARACTERS,
  type ShowcaseCharacter,
} from "@/lib/characters/showcase";

export type PublicLayerPreview = {
  key: "soul" | "style" | "rules" | "context";
  label: string;
  preview: string;
};

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
  intensity: number;
  conversationCount: number;
  creatorLabel: string;
  creatorId: string | null;
  photoUrl: string | null;
  photos: string[];
  soulPreview: string;
  layers: PublicLayerPreview[];
};

function preview(md: string | null | undefined, max = 220) {
  return (md || "")
    .replace(/^#+\s.*/gm, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function buildLayers(docs: {
  soulMd?: string | null;
  styleMd?: string | null;
  rulesMd?: string | null;
  contextMd?: string | null;
}): PublicLayerPreview[] {
  const entries: {
    key: PublicLayerPreview["key"];
    label: string;
    md?: string | null;
  }[] = [
    { key: "soul", label: "Soul", md: docs.soulMd },
    { key: "style", label: "Style", md: docs.styleMd },
    { key: "rules", label: "Rules", md: docs.rulesMd },
    { key: "context", label: "Context", md: docs.contextMd },
  ];
  return entries
    .map((e) => ({
      key: e.key,
      label: e.label,
      preview: preview(e.md, 160),
    }))
    .filter((e) => e.preview.length > 0);
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
    intensity: c.intensity,
    conversationCount: c.conversationCount,
    creatorLabel: c.creatorLabel,
    creatorId: null,
    photoUrl: c.imageUrl,
    photos: c.imageUrl ? [c.imageUrl] : [],
    soulPreview: preview(c.soulMd),
    layers: buildLayers(c),
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
        intensity: true,
        soulMd: true,
        styleMd: true,
        rulesMd: true,
        contextMd: true,
        user: { select: { id: true, name: true } },
        photos: {
          take: 8,
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
      const photos = fromDb.photos.map((p) => p.url);
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
        intensity: fromDb.intensity,
        conversationCount:
          fromDb._count.conversations + fromDb._count.relationships,
        creatorLabel: fromDb.user.name || "Creator",
        creatorId: fromDb.user.id,
        photoUrl: photos[0] ?? null,
        photos,
        soulPreview: preview(fromDb.soulMd),
        layers: buildLayers(fromDb),
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
      intensity: true,
      soulMd: true,
      styleMd: true,
      rulesMd: true,
      contextMd: true,
      user: { select: { id: true, name: true } },
      photos: {
        take: 8,
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
    .map((fromDbRow) => {
      const photos = fromDbRow.photos.map((p) => p.url);
      return {
        source: "db" as const,
        id: fromDbRow.id,
        slug: fromDbRow.slug,
        name: fromDbRow.name,
        tagline: fromDbRow.tagline || `Talk with ${fromDbRow.name}.`,
        openingLine:
          fromDbRow.openingLine ||
          `Hi — I'm ${fromDbRow.name}. Shall we begin?`,
        categories: fromDbRow.categories,
        isAdult: fromDbRow.isAdult,
        allowFork: fromDbRow.allowFork,
        intensity: fromDbRow.intensity,
        conversationCount:
          fromDbRow._count.conversations + fromDbRow._count.relationships,
        creatorLabel: fromDbRow.user.name || "Creator",
        creatorId: fromDbRow.user.id,
        photoUrl: photos[0] ?? null,
        photos,
        soulPreview: preview(fromDbRow.soulMd),
        layers: buildLayers(fromDbRow),
      };
    });

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
