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

function hasVector() {
  return Boolean(
    process.env.UPSTASH_VECTOR_REST_URL &&
      process.env.UPSTASH_VECTOR_REST_TOKEN,
  );
}

function getIndex() {
  if (!hasVector()) return null;
  return new Index({
    url: process.env.UPSTASH_VECTOR_REST_URL!,
    token: process.env.UPSTASH_VECTOR_REST_TOKEN!,
  });
}

export async function upsertMemory(params: {
  userId: string;
  characterId: string;
  type: MemoryType;
  content: string;
  metadata?: Record<string, unknown>;
}) {
  const vectorId = nanoid();
  const index = getIndex();

  if (index) {
    await index.upsert({
      id: vectorId,
      data: params.content,
      metadata: {
        userId: params.userId,
        characterId: params.characterId,
        type: params.type,
        createdAt: new Date().toISOString(),
      },
    });
  }

  return prisma.memory.create({
    data: {
      userId: params.userId,
      characterId: params.characterId,
      type: params.type,
      content: params.content,
      vectorId: index ? vectorId : null,
      metadata: (params.metadata ?? {}) as Prisma.InputJsonValue,
    },
  });
}

export async function searchMemories(params: {
  userId: string;
  characterId: string;
  query: string;
  topK?: number;
}): Promise<string[]> {
  const topK = params.topK ?? 6;
  const index = getIndex();

  if (index) {
    const result = await index.query({
      data: params.query,
      topK,
      includeMetadata: true,
      includeData: true,
      filter: `userId = '${params.userId}' AND characterId = '${params.characterId}'`,
    });
    return result
      .map((r) => (typeof r.data === "string" ? r.data : null))
      .filter(Boolean) as string[];
  }

  const rows = await prisma.memory.findMany({
    where: {
      userId: params.userId,
      characterId: params.characterId,
      content: { contains: params.query.slice(0, 40), mode: "insensitive" },
    },
    orderBy: { updatedAt: "desc" },
    take: topK,
  });

  if (rows.length) return rows.map((r) => `[${r.type}] ${r.content}`);

  const recent = await prisma.memory.findMany({
    where: { userId: params.userId, characterId: params.characterId },
    orderBy: { updatedAt: "desc" },
    take: topK,
  });
  return recent.map((r) => `[${r.type}] ${r.content}`);
}

export async function listMemories(userId: string, characterId: string) {
  return prisma.memory.findMany({
    where: { userId, characterId },
    orderBy: { updatedAt: "desc" },
  });
}

export async function updateMemory(
  id: string,
  userId: string,
  content: string,
) {
  const memory = await prisma.memory.findFirst({ where: { id, userId } });
  if (!memory) return null;

  const index = getIndex();
  if (index && memory.vectorId) {
    await index.upsert({
      id: memory.vectorId,
      data: content,
      metadata: {
        userId: memory.userId,
        characterId: memory.characterId,
        type: memory.type,
        createdAt: memory.createdAt.toISOString(),
      },
    });
  }

  return prisma.memory.update({
    where: { id },
    data: { content },
  });
}

export async function deleteMemory(id: string, userId: string) {
  const memory = await prisma.memory.findFirst({ where: { id, userId } });
  if (!memory) return false;

  const index = getIndex();
  if (index && memory.vectorId) {
    await index.delete(memory.vectorId);
  }

  await prisma.memory.delete({ where: { id } });
  return true;
}
