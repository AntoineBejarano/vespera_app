import { Index } from "@upstash/vector";
import { prisma } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";
import { nanoid } from "nanoid";

export type MemoryType =
  | "episodic"
  | "semantic"
  | "relational"
  | "narrative"
  | "character";

/** Cached: null=unknown, true=supports text embeddings, false=use Postgres only */
let vectorEmbeddingsOk: boolean | null = null;

function hasVector() {
  return Boolean(
    process.env.UPSTASH_VECTOR_REST_URL &&
      process.env.UPSTASH_VECTOR_REST_TOKEN,
  );
}

function getIndex() {
  if (!hasVector() || vectorEmbeddingsOk === false) return null;
  return new Index({
    url: process.env.UPSTASH_VECTOR_REST_URL!,
    token: process.env.UPSTASH_VECTOR_REST_TOKEN!,
  });
}

function isEmbeddingUnsupportedError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes("Embedding data for this index is not allowed") ||
    message.includes("must be created with an embedding model")
  );
}

function escapeFilter(value: string) {
  return value.replace(/'/g, "");
}

async function searchFromPostgres(params: {
  subjectId: string;
  characterId: string;
  query: string;
  topK: number;
}): Promise<string[]> {
  const rows = await prisma.memory.findMany({
    where: {
      subjectId: params.subjectId,
      characterId: params.characterId,
      content: {
        contains: params.query.slice(0, 40),
        mode: "insensitive",
      },
    },
    orderBy: { updatedAt: "desc" },
    take: params.topK,
  });

  if (rows.length) return rows.map((r) => `[${r.type}] ${r.content}`);

  const recent = await prisma.memory.findMany({
    where: { subjectId: params.subjectId, characterId: params.characterId },
    orderBy: { updatedAt: "desc" },
    take: params.topK,
  });
  return recent.map((r) => `[${r.type}] ${r.content}`);
}

export async function upsertMemory(params: {
  subjectId: string;
  characterId: string;
  type: MemoryType;
  content: string;
  /** Legacy bridge for Upstash filters / admin UI */
  userId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const vectorId = nanoid();
  const index = getIndex();
  let savedVectorId: string | null = null;

  if (index) {
    try {
      await index.upsert({
        id: vectorId,
        data: params.content,
        metadata: {
          subjectId: params.subjectId,
          userId: params.userId ?? "",
          characterId: params.characterId,
          type: params.type,
          createdAt: new Date().toISOString(),
        },
      });
      savedVectorId = vectorId;
      vectorEmbeddingsOk = true;
    } catch (error) {
      if (isEmbeddingUnsupportedError(error)) {
        vectorEmbeddingsOk = false;
        console.warn(
          "[memory/vector] Index sin embedding model. Usando Postgres. Recrea el índice en Upstash con un modelo (p.ej. BGE-M3).",
        );
      } else {
        console.error("[memory/vector] upsert failed, falling back to Postgres", error);
      }
    }
  }

  return prisma.memory.create({
    data: {
      subjectId: params.subjectId,
      userId: params.userId ?? undefined,
      characterId: params.characterId,
      type: params.type,
      content: params.content,
      vectorId: savedVectorId,
      metadata: (params.metadata ?? {}) as Prisma.InputJsonValue,
    },
  });
}

export async function searchMemories(params: {
  subjectId: string;
  characterId: string;
  query: string;
  topK?: number;
  /** Optional bridge — also match legacy vectors keyed by userId */
  userId?: string | null;
}): Promise<string[]> {
  const topK = params.topK ?? 6;
  const index = getIndex();

  if (index) {
    try {
      const sid = escapeFilter(params.subjectId);
      const cid = escapeFilter(params.characterId);
      const uid = params.userId ? escapeFilter(params.userId) : null;
      const filter = uid
        ? `(subjectId = '${sid}' OR userId = '${uid}') AND characterId = '${cid}'`
        : `subjectId = '${sid}' AND characterId = '${cid}'`;

      const result = await index.query({
        data: params.query,
        topK,
        includeMetadata: true,
        includeData: true,
        filter,
      });
      vectorEmbeddingsOk = true;
      const hits = result
        .map((r) => (typeof r.data === "string" ? r.data : null))
        .filter(Boolean) as string[];
      if (hits.length) return hits;
    } catch (error) {
      if (isEmbeddingUnsupportedError(error)) {
        vectorEmbeddingsOk = false;
        console.warn(
          "[memory/vector] Index sin embedding model. Query vía Postgres.",
        );
      } else {
        console.error("[memory/vector] query failed, falling back to Postgres", error);
      }
    }
  }

  return searchFromPostgres({
    subjectId: params.subjectId,
    characterId: params.characterId,
    query: params.query,
    topK,
  });
}

export async function listMemories(subjectId: string, characterId: string) {
  return prisma.memory.findMany({
    where: { subjectId, characterId },
    orderBy: { updatedAt: "desc" },
  });
}

/** Admin UI: list by bridge userId within a character (resolves via subject when possible). */
export async function listMemoriesForUser(userId: string, characterId: string) {
  return prisma.memory.findMany({
    where: {
      characterId,
      OR: [{ userId }, { subject: { webUserId: userId } }],
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function updateMemory(
  id: string,
  subjectId: string,
  content: string,
) {
  const memory = await prisma.memory.findFirst({ where: { id, subjectId } });
  if (!memory) return null;

  const index = getIndex();
  if (index && memory.vectorId) {
    try {
      await index.upsert({
        id: memory.vectorId,
        data: content,
        metadata: {
          subjectId: memory.subjectId,
          userId: memory.userId ?? "",
          characterId: memory.characterId,
          type: memory.type,
          createdAt: memory.createdAt.toISOString(),
        },
      });
    } catch (error) {
      if (isEmbeddingUnsupportedError(error)) {
        vectorEmbeddingsOk = false;
      } else {
        console.error("[memory/vector] update upsert failed", error);
      }
    }
  }

  return prisma.memory.update({
    where: { id },
    data: { content },
  });
}

export async function deleteMemory(id: string, subjectId: string) {
  const memory = await prisma.memory.findFirst({ where: { id, subjectId } });
  if (!memory) return false;

  const index = getIndex();
  if (index && memory.vectorId) {
    try {
      await index.delete(memory.vectorId);
    } catch (error) {
      console.error("[memory/vector] delete failed", error);
    }
  }

  await prisma.memory.delete({ where: { id } });
  return true;
}
