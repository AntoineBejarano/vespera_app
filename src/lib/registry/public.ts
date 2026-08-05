import { prisma } from "@/lib/db";
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

export async function getRegistryPersonaBySlug(
  slug: string,
): Promise<RegistryPersonaView | null> {
  try {
    const fromDb = await prisma.character.findFirst({
      where: { slug, isPublic: true, archivedAt: null },
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
  } catch (err) {
    console.error("[registry] failed to load persona", { slug, err });
  }

  return null;
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
      where: {
        isPublic: true,
        isAdult: adult,
        slug: { not: null },
        archivedAt: null,
      },
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
  } catch (err) {
    console.error("[registry] failed to list personas", { err });
  }

  return items.slice(0, limit);
}
