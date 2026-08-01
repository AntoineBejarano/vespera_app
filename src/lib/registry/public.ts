import { prisma } from "@/lib/db";
import {
  getShowcaseBySlug,
  SHOWCASE_CHARACTERS,
  type ShowcaseCharacter,
} from "@/lib/characters/showcase";
import {
  formatPersonaVersion,
  PERSONA_LICENSE_BLURBS,
  PERSONA_LICENSE_LABELS,
  REGISTRY_CHANNEL_LABELS,
  type PersonaLicense,
  type RegistryChannel,
  isPersonaLicense,
} from "@/lib/personas/license";
import {
  getPublicCharacterBySlug,
  type PublicCharacterView,
} from "@/lib/characters/public";

export type RegistryVersionEntry = {
  version: string;
  changelog: string | null;
  createdAt: string;
};

export type RegistryKnowledgePack = {
  name: string;
  description: string | null;
};

export type RegistryForkParent = {
  slug: string | null;
  name: string;
};

export type RegistryPersonaView = PublicCharacterView & {
  version: string;
  versionMajor: number;
  versionMinor: number;
  license: PersonaLicense;
  licenseLabel: string;
  licenseBlurb: string;
  channels: string[];
  channelLabels: string[];
  forkCount: number;
  forkedFrom: RegistryForkParent | null;
  versions: RegistryVersionEntry[];
  knowledgePacks: RegistryKnowledgePack[];
  hasTelegram: boolean;
  updatedAt: string | null;
};

function defaultChannels(isAdult: boolean): RegistryChannel[] {
  return isAdult
    ? ["vesperer", "web", "chai"]
    : ["vesperer", "web", "telegram", "chai", "sillytavern"];
}

function normalizeLicense(raw: string | undefined | null): PersonaLicense {
  if (raw && isPersonaLicense(raw)) return raw;
  return "fork_allowed";
}

function channelLabels(channels: string[]) {
  return channels.map(
    (c) =>
      REGISTRY_CHANNEL_LABELS[c as RegistryChannel] ??
      c.replace(/_/g, " ").replace(/\b\w/g, (ch) => ch.toUpperCase()),
  );
}

function fromShowcaseRegistry(c: ShowcaseCharacter): RegistryPersonaView {
  const base = {
    source: "showcase" as const,
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
    soulPreview: (c.soulMd || "")
      .replace(/^#+\s.*/gm, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 220),
    layers: (
      [
        { key: "soul" as const, label: "Soul", md: c.soulMd },
        { key: "style" as const, label: "Style", md: c.styleMd },
        { key: "rules" as const, label: "Rules", md: c.rulesMd },
        { key: "context" as const, label: "Context", md: c.contextMd },
      ] as const
    )
      .map((e) => ({
        key: e.key,
        label: e.label,
        preview: (e.md || "")
          .replace(/^#+\s.*/gm, "")
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 160),
      }))
      .filter((e) => e.preview.length > 0),
  };

  const license: PersonaLicense = "commercial";
  const channels = defaultChannels(c.isAdult);

  return {
    ...base,
    version: "1.0",
    versionMajor: 1,
    versionMinor: 0,
    license,
    licenseLabel: PERSONA_LICENSE_LABELS[license],
    licenseBlurb: PERSONA_LICENSE_BLURBS[license],
    channels,
    channelLabels: channelLabels(channels),
    forkCount: Math.max(12, Math.floor(c.conversationCount / 800)),
    forkedFrom: null,
    versions: [
      {
        version: "1.0",
        changelog: "Initial curated registry release",
        createdAt: new Date().toISOString(),
      },
    ],
    knowledgePacks: [],
    hasTelegram: false,
    updatedAt: null,
  };
}

export async function getRegistryPersonaBySlug(
  slug: string,
): Promise<RegistryPersonaView | null> {
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
        versionMajor: true,
        versionMinor: true,
        license: true,
        channels: true,
        updatedAt: true,
        user: { select: { id: true, name: true } },
        forkedFrom: {
          select: { slug: true, name: true, isPublic: true },
        },
        photos: {
          take: 8,
          orderBy: { createdAt: "desc" },
          select: { url: true },
        },
        telegramBots: { take: 1, select: { id: true } },
        knowledgeLinks: {
          where: { active: true },
          take: 12,
          select: {
            knowledgePack: {
              select: { name: true, description: true, archivedAt: true },
            },
          },
        },
        versions: {
          orderBy: [{ versionMajor: "desc" }, { versionMinor: "desc" }],
          take: 12,
          select: {
            versionMajor: true,
            versionMinor: true,
            changelog: true,
            createdAt: true,
          },
        },
        _count: {
          select: {
            conversations: true,
            relationships: true,
            forks: true,
          },
        },
      },
    });

    if (fromDb?.slug) {
      const photos = fromDb.photos.map((p) => p.url);
      const license = normalizeLicense(fromDb.license);
      const declared =
        fromDb.channels.length > 0
          ? fromDb.channels
          : ([
              "vesperer",
              "web",
              ...(fromDb.telegramBots.length ? (["telegram"] as const) : []),
              "chai",
              "sillytavern",
            ] as string[]);

      const publicBase = await getPublicCharacterBySlug(slug);
      if (!publicBase) return null;

      const tipVersion = formatPersonaVersion(
        fromDb.versionMajor,
        fromDb.versionMinor,
      );

      const history: RegistryVersionEntry[] = [
        {
          version: tipVersion,
          changelog: "Current version",
          createdAt: fromDb.updatedAt.toISOString(),
        },
        ...fromDb.versions.map((v) => ({
          version: formatPersonaVersion(v.versionMajor, v.versionMinor),
          changelog: v.changelog,
          createdAt: v.createdAt.toISOString(),
        })),
      ];

      // Dedupe if tip already snapshotted
      const seen = new Set<string>();
      const versions = history.filter((v) => {
        if (seen.has(v.version)) return false;
        seen.add(v.version);
        return true;
      });

      return {
        ...publicBase,
        version: tipVersion,
        versionMajor: fromDb.versionMajor,
        versionMinor: fromDb.versionMinor,
        license,
        licenseLabel: PERSONA_LICENSE_LABELS[license],
        licenseBlurb: PERSONA_LICENSE_BLURBS[license],
        channels: declared,
        channelLabels: channelLabels(declared),
        forkCount: fromDb._count.forks,
        forkedFrom:
          fromDb.forkedFrom && fromDb.forkedFrom.isPublic
            ? {
                slug: fromDb.forkedFrom.slug,
                name: fromDb.forkedFrom.name,
              }
            : null,
        versions,
        knowledgePacks: fromDb.knowledgeLinks
          .filter((l) => !l.knowledgePack.archivedAt)
          .map((l) => ({
            name: l.knowledgePack.name,
            description: l.knowledgePack.description,
          })),
        hasTelegram: fromDb.telegramBots.length > 0,
        updatedAt: fromDb.updatedAt.toISOString(),
      };
    }
  } catch {
    // Fall through to showcase during build / DB outages.
  }

  const showcase = getShowcaseBySlug(slug);
  return showcase ? fromShowcaseRegistry(showcase) : null;
}

export type RegistryListItem = {
  slug: string;
  name: string;
  tagline: string;
  creatorLabel: string;
  version: string;
  licenseLabel: string;
  categories: string[];
  photoUrl: string | null;
  forkCount: number;
  isAdult: boolean;
  channelLabels: string[];
};

export async function listRegistryPersonas(opts?: {
  adult?: boolean;
  limit?: number;
}): Promise<RegistryListItem[]> {
  const limit = opts?.limit ?? 48;
  const adult = opts?.adult ?? false;
  const items: RegistryListItem[] = [];

  try {
    const rows = await prisma.character.findMany({
      where: { isPublic: true, isAdult: adult, slug: { not: null } },
      orderBy: { updatedAt: "desc" },
      take: limit,
      select: {
        slug: true,
        name: true,
        tagline: true,
        categories: true,
        isAdult: true,
        versionMajor: true,
        versionMinor: true,
        license: true,
        channels: true,
        user: { select: { name: true } },
        photos: {
          take: 1,
          orderBy: { createdAt: "desc" },
          select: { url: true },
        },
        _count: { select: { forks: true } },
      },
    });

    for (const r of rows) {
      if (!r.slug) continue;
      const license = normalizeLicense(r.license);
      const channels =
        r.channels.length > 0 ? r.channels : defaultChannels(r.isAdult);
      items.push({
        slug: r.slug,
        name: r.name,
        tagline: r.tagline || `Canonical persona · ${r.name}`,
        creatorLabel: r.user.name || "Creator",
        version: formatPersonaVersion(r.versionMajor, r.versionMinor),
        licenseLabel: PERSONA_LICENSE_LABELS[license],
        categories: r.categories,
        photoUrl: r.photos[0]?.url ?? null,
        forkCount: r._count.forks,
        isAdult: r.isAdult,
        channelLabels: channelLabels(channels),
      });
    }
  } catch {
    // Fall through to showcase.
  }

  const seen = new Set(items.map((i) => i.slug));
  for (const c of SHOWCASE_CHARACTERS) {
    if (items.length >= limit) break;
    if (c.isAdult !== adult || seen.has(c.slug)) continue;
    const license: PersonaLicense = "commercial";
    const channels = defaultChannels(c.isAdult);
    items.push({
      slug: c.slug,
      name: c.name,
      tagline: c.tagline,
      creatorLabel: c.creatorLabel,
      version: "1.0",
      licenseLabel: PERSONA_LICENSE_LABELS[license],
      categories: c.categories,
      photoUrl: c.imageUrl,
      forkCount: Math.max(12, Math.floor(c.conversationCount / 800)),
      isAdult: c.isAdult,
      channelLabels: channelLabels(channels),
    });
  }

  return items.slice(0, limit);
}
