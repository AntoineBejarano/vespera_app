import "server-only";
import { prisma } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";
import { getAdapter } from "@/lib/knowledge/adapters/registry";
import { AdapterError } from "@/lib/knowledge/adapters/types";
import {
  enqueueKnowledgeJob,
  scheduleKnowledgeJob,
} from "@/lib/knowledge/ingest/jobs";
import { deleteVectorsBySource } from "@/lib/knowledge/vector";
import type { KnowledgeProvider } from "@/lib/knowledge/types";
import {
  PLATO_ESSENTIALS_SEED,
  type KnowledgePackSeed,
} from "@/lib/knowledge/seeds/plato-essentials";

const SEEDS: Record<string, KnowledgePackSeed> = {
  [PLATO_ESSENTIALS_SEED.key]: PLATO_ESSENTIALS_SEED,
};

export function listSeedTemplates() {
  return Object.values(SEEDS).map((s) => ({
    key: s.key,
    name: s.name,
    description: s.description,
    language: s.language,
    sourceCount: s.sources.length,
  }));
}

export function getSeedTemplate(key: string) {
  return SEEDS[key] ?? null;
}

export async function createKnowledgePack(params: {
  userId: string;
  workspaceId: string;
  name: string;
  description?: string;
  language?: string;
  slug?: string;
  seedKey?: string;
}) {
  return prisma.knowledgePack.create({
    data: {
      workspaceId: params.workspaceId,
      userId: params.userId,
      name: params.name,
      description: params.description,
      language: params.language ?? "en",
      slug: params.slug,
      seedKey: params.seedKey,
    },
  });
}

/** Create pack + sources from a seed template (config only — engine stays generic). */
export async function createPackFromSeed(params: {
  userId: string;
  workspaceId: string;
  seedKey: string;
}) {
  const seed = getSeedTemplate(params.seedKey);
  if (!seed) {
    throw new AdapterError(`Unknown seed template: ${params.seedKey}`, false);
  }

  const existing = await prisma.knowledgePack.findFirst({
    where: { workspaceId: params.workspaceId, slug: seed.slug },
  });
  if (existing) return { pack: existing, created: false };

  const pack = await prisma.knowledgePack.create({
    data: {
      workspaceId: params.workspaceId,
      userId: params.userId,
      name: seed.name,
      description: seed.description,
      language: seed.language,
      slug: seed.slug,
      seedKey: seed.key,
      sources: {
        create: seed.sources.map((s) => ({
          provider: s.provider,
          externalId: s.externalId,
          canonicalUrl: s.canonicalUrl,
          language: s.language ?? seed.language,
          configJson: s.config as Prisma.InputJsonValue,
          status: "pending",
        })),
      },
    },
    include: { sources: true },
  });
  return { pack, created: true };
}

export async function addSource(params: {
  userId: string;
  knowledgePackId: string;
  provider: KnowledgeProvider | string;
  config: unknown;
  externalId?: string;
  objectKey?: string;
}) {
  const pack = await prisma.knowledgePack.findFirst({
    where: { id: params.knowledgePackId, userId: params.userId },
  });
  if (!pack) throw new AdapterError("Knowledge pack not found", false);

  const adapter = getAdapter(params.provider);
  const config = adapter.validateConfig(params.config);
  const inspection = await adapter.inspect(config, {
    knowledgePackId: pack.id,
  });

  const externalId =
    params.externalId || inspection.externalId || `${params.provider}:${Date.now()}`;

  // Idempotent upsert by (pack, provider, externalId)
  const source = await prisma.knowledgeSource.upsert({
    where: {
      knowledgePackId_provider_externalId: {
        knowledgePackId: pack.id,
        provider: params.provider,
        externalId,
      },
    },
    create: {
      knowledgePackId: pack.id,
      provider: params.provider,
      externalId,
      canonicalUrl: inspection.canonicalUrl,
      datasetRevision: inspection.datasetRevision,
      license: inspection.license,
      language: inspection.language || pack.language,
      checksum: inspection.checksum,
      status: "ready",
      configJson: config as Prisma.InputJsonValue,
      provenanceJson: inspection.provenance as Prisma.InputJsonValue,
      objectKey: params.objectKey,
      documentCount: inspection.documentCount ?? 0,
    },
    update: {
      canonicalUrl: inspection.canonicalUrl,
      datasetRevision: inspection.datasetRevision,
      license: inspection.license,
      language: inspection.language || pack.language,
      checksum: inspection.checksum,
      status: "ready",
      configJson: config as Prisma.InputJsonValue,
      provenanceJson: inspection.provenance as Prisma.InputJsonValue,
      objectKey: params.objectKey ?? undefined,
      documentCount: inspection.documentCount ?? 0,
      lastError: null,
    },
  });

  return { source, inspection };
}

export async function inspectSource(params: {
  userId: string;
  sourceId: string;
}) {
  const source = await prisma.knowledgeSource.findFirst({
    where: {
      id: params.sourceId,
      knowledgePack: { userId: params.userId },
    },
  });
  if (!source) throw new AdapterError("Source not found", false);

  await prisma.knowledgeSource.update({
    where: { id: source.id },
    data: { status: "inspecting" },
  });

  try {
    const adapter = getAdapter(source.provider);
    const config = adapter.validateConfig(source.configJson);
    const inspection = await adapter.inspect(config, {
      knowledgePackId: source.knowledgePackId,
      sourceId: source.id,
    });
    const unchanged =
      Boolean(source.checksum) &&
      source.status === "indexed" &&
      source.checksum === inspection.checksum;

    const updated = await prisma.knowledgeSource.update({
      where: { id: source.id },
      data: {
        status: unchanged ? "indexed" : "ready",
        canonicalUrl: inspection.canonicalUrl,
        datasetRevision: inspection.datasetRevision,
        license: inspection.license,
        language: inspection.language || source.language,
        checksum: inspection.checksum,
        provenanceJson: inspection.provenance as Prisma.InputJsonValue,
        documentCount: inspection.documentCount ?? source.documentCount,
      },
    });
    return { source: updated, inspection: { ...inspection, unchanged } };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await prisma.knowledgeSource.update({
      where: { id: source.id },
      data: { status: "failed", lastError: message },
    });
    throw error;
  }
}

export async function startSourceIngest(params: {
  userId: string;
  sourceId: string;
  force?: boolean;
}) {
  const source = await prisma.knowledgeSource.findFirst({
    where: {
      id: params.sourceId,
      knowledgePack: { userId: params.userId },
    },
  });
  if (!source) throw new AdapterError("Source not found", false);
  if (!source.enabled) throw new AdapterError("Source is disabled", false);

  const job = await enqueueKnowledgeJob({
    knowledgePackId: source.knowledgePackId,
    sourceId: source.id,
    kind: "ingest",
    force: params.force,
  });
  scheduleKnowledgeJob(job.id);
  return job;
}

export async function reindexPack(params: {
  userId: string;
  knowledgePackId: string;
}) {
  const pack = await prisma.knowledgePack.findFirst({
    where: { id: params.knowledgePackId, userId: params.userId },
    include: { sources: { where: { enabled: true } } },
  });
  if (!pack) throw new AdapterError("Knowledge pack not found", false);

  const jobs = [];
  for (const source of pack.sources) {
    const job = await enqueueKnowledgeJob({
      knowledgePackId: pack.id,
      sourceId: source.id,
      kind: "reindex",
      force: true,
    });
    scheduleKnowledgeJob(job.id);
    jobs.push(job);
  }
  return jobs;
}

export async function setSourceEnabled(params: {
  userId: string;
  sourceId: string;
  enabled: boolean;
}) {
  const source = await prisma.knowledgeSource.findFirst({
    where: {
      id: params.sourceId,
      knowledgePack: { userId: params.userId },
    },
  });
  if (!source) return null;
  return prisma.knowledgeSource.update({
    where: { id: source.id },
    data: {
      enabled: params.enabled,
      status: params.enabled
        ? source.status === "disabled"
          ? "ready"
          : source.status
        : "disabled",
    },
  });
}

export async function linkPackToCharacters(params: {
  userId: string;
  workspaceId?: string;
  knowledgePackId: string;
  characterIds: string[];
}) {
  const pack = await prisma.knowledgePack.findFirst({
    where: {
      id: params.knowledgePackId,
      archivedAt: null,
      ...(params.workspaceId
        ? { workspaceId: params.workspaceId }
        : { userId: params.userId }),
    },
  });
  if (!pack) throw new AdapterError("Knowledge pack not found", false);

  const characters = await prisma.character.findMany({
    where: {
      id: { in: params.characterIds },
      archivedAt: null,
      workspaceId: pack.workspaceId,
    },
    select: { id: true },
  });

  await prisma.$transaction(
    characters.map((c) =>
      prisma.characterKnowledgePack.upsert({
        where: {
          characterId_knowledgePackId: {
            characterId: c.id,
            knowledgePackId: pack.id,
          },
        },
        create: {
          characterId: c.id,
          knowledgePackId: pack.id,
          active: true,
        },
        update: { active: true },
      }),
    ),
  );

  return characters.map((c) => c.id);
}

export async function unlinkPackFromCharacter(params: {
  userId: string;
  workspaceId?: string;
  knowledgePackId: string;
  characterId: string;
}) {
  const pack = await prisma.knowledgePack.findFirst({
    where: {
      id: params.knowledgePackId,
      archivedAt: null,
      ...(params.workspaceId
        ? { workspaceId: params.workspaceId }
        : { userId: params.userId }),
    },
  });
  if (!pack) return false;

  // Only unlink if the character is in the same workspace (no cross-tenant links).
  const character = await prisma.character.findFirst({
    where: {
      id: params.characterId,
      workspaceId: pack.workspaceId,
      archivedAt: null,
    },
    select: { id: true },
  });
  if (!character) return false;

  const deleted = await prisma.characterKnowledgePack.deleteMany({
    where: {
      knowledgePackId: pack.id,
      characterId: character.id,
    },
  });
  return deleted.count > 0;
}

export async function deleteSourceVectors(params: {
  userId: string;
  sourceId: string;
}) {
  const source = await prisma.knowledgeSource.findFirst({
    where: {
      id: params.sourceId,
      knowledgePack: { userId: params.userId },
    },
  });
  if (!source) throw new AdapterError("Source not found", false);

  const job = await enqueueKnowledgeJob({
    knowledgePackId: source.knowledgePackId,
    sourceId: source.id,
    kind: "delete_source_vectors",
  });
  scheduleKnowledgeJob(job.id);
  return job;
}

export async function deleteSource(params: {
  userId: string;
  sourceId: string;
}) {
  const source = await prisma.knowledgeSource.findFirst({
    where: {
      id: params.sourceId,
      knowledgePack: { userId: params.userId },
    },
  });
  if (!source) return false;
  try {
    await deleteVectorsBySource({
      knowledgePackId: source.knowledgePackId,
      sourceId: source.id,
    });
  } catch (err) {
    console.error("[knowledge] delete source vectors failed", err);
  }
  await prisma.knowledgeSource.delete({ where: { id: source.id } });
  return true;
}
