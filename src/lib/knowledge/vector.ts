import "server-only";
import { Index } from "@upstash/vector";
import type { KnowledgeChunk, KnowledgeChunkMetadata } from "@/lib/knowledge/types";
import { ingestLimits } from "@/lib/knowledge/types";

/** Cached: null=unknown, true=supports text embeddings, false=unavailable */
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

function escapeFilterValue(value: string) {
  return value.replace(/'/g, "\\'");
}

export function buildKnowledgeFilter(params: {
  knowledgePackId: string;
  sourceType?: string;
  author?: string;
  work?: string;
  language?: string;
  sourceId?: string;
}) {
  const parts = [
    `kind = 'knowledge'`,
    `knowledgePackId = '${escapeFilterValue(params.knowledgePackId)}'`,
  ];
  if (params.sourceId) {
    parts.push(`sourceId = '${escapeFilterValue(params.sourceId)}'`);
  }
  if (params.sourceType) {
    parts.push(`sourceType = '${escapeFilterValue(params.sourceType)}'`);
  }
  if (params.author) {
    parts.push(`author = '${escapeFilterValue(params.author)}'`);
  }
  if (params.work) {
    parts.push(`work = '${escapeFilterValue(params.work)}'`);
  }
  if (params.language) {
    parts.push(`language = '${escapeFilterValue(params.language)}'`);
  }
  return parts.join(" AND ");
}

function toVectorMetadata(meta: KnowledgeChunkMetadata): Record<string, string> {
  // Upstash metadata values should be primitives; keep all filter fields as strings.
  return {
    kind: meta.kind,
    knowledgePackId: meta.knowledgePackId,
    sourceId: meta.sourceId,
    provider: String(meta.provider),
    canonicalUrl: meta.canonicalUrl || "",
    author: meta.author || "",
    work: meta.work || "",
    section: meta.section || "",
    speaker: meta.speaker || "",
    language: meta.language || "",
    sourceType: String(meta.sourceType || ""),
    license: meta.license || "",
    contentHash: meta.contentHash,
  };
}

export async function upsertKnowledgeChunks(chunks: KnowledgeChunk[]) {
  const index = getIndex();
  if (!index) {
    throw new Error(
      "Upstash Vector is not configured or has no embedding model. Knowledge chunks require UPSTASH_VECTOR_* with an embedding-enabled index.",
    );
  }

  let upserted = 0;
  for (let i = 0; i < chunks.length; i += ingestLimits.upsertBatchSize) {
    const batch = chunks.slice(i, i + ingestLimits.upsertBatchSize);
    try {
      await index.upsert(
        batch.map((c) => ({
          id: c.id,
          data: c.text,
          metadata: toVectorMetadata(c.metadata),
        })),
      );
      vectorEmbeddingsOk = true;
      upserted += batch.length;
    } catch (error) {
      if (isEmbeddingUnsupportedError(error)) {
        vectorEmbeddingsOk = false;
        throw new Error(
          "Upstash Vector index has no embedding model. Recreate it with e.g. BGE-M3.",
        );
      }
      throw error;
    }
  }
  return upserted;
}

export async function searchKnowledge(params: {
  knowledgePackId: string;
  query: string;
  topK?: number;
  sourceType?: string;
  author?: string;
  work?: string;
  language?: string;
  sourceId?: string;
}): Promise<Array<{ text: string; metadata: Partial<KnowledgeChunkMetadata>; score: number }>> {
  const index = getIndex();
  if (!index) return [];

  try {
    const result = await index.query({
      data: params.query,
      topK: params.topK ?? 6,
      includeMetadata: true,
      includeData: true,
      filter: buildKnowledgeFilter(params),
    });
    vectorEmbeddingsOk = true;
    return result.map((r) => ({
      text: typeof r.data === "string" ? r.data : "",
      metadata: (r.metadata ?? {}) as Partial<KnowledgeChunkMetadata>,
      score: r.score ?? 0,
    })).filter((r) => r.text);
  } catch (error) {
    if (isEmbeddingUnsupportedError(error)) {
      vectorEmbeddingsOk = false;
      console.warn("[knowledge/vector] Index sin embedding model.");
      return [];
    }
    console.error("[knowledge/vector] query failed", error);
    return [];
  }
}

/**
 * Delete all vectors for a source. Tries filter delete; falls back to query+delete.
 */
export async function deleteVectorsBySource(params: {
  knowledgePackId: string;
  sourceId: string;
}) {
  const index = getIndex();
  if (!index) return { deleted: 0 };

  const filter = buildKnowledgeFilter({
    knowledgePackId: params.knowledgePackId,
    sourceId: params.sourceId,
  });

  try {
    // Newer Upstash clients support filter delete
    const maybeDelete = index.delete as unknown as (arg: unknown) => Promise<unknown>;
    await maybeDelete({ filter });
    return { deleted: -1 };
  } catch {
    // Fallback: page through ids via sparse query tricks is limited;
    // use range/list if available, else best-effort empty.
  }

  try {
    // Query with a broad token to collect ids (embedding search), then delete.
    // For large sources, reindex path deletes via this loop in batches.
    const ids: string[] = [];
    const page = await index.query({
      data: "knowledge content document text",
      topK: 1000,
      includeMetadata: true,
      filter,
    });
    for (const hit of page) {
      if (hit.id) ids.push(String(hit.id));
    }
    if (ids.length) {
      await index.delete(ids);
    }
    return { deleted: ids.length };
  } catch (error) {
    console.error("[knowledge/vector] delete by source failed", error);
    throw error;
  }
}

export async function deleteVectorsByPack(knowledgePackId: string) {
  const index = getIndex();
  if (!index) return { deleted: 0 };
  const filter = buildKnowledgeFilter({ knowledgePackId });
  try {
    const maybeDelete = index.delete as unknown as (arg: unknown) => Promise<unknown>;
    await maybeDelete({ filter });
    return { deleted: -1 };
  } catch {
    const page = await index.query({
      data: "knowledge content document text",
      topK: 1000,
      filter,
    });
    const ids = page.map((h) => String(h.id)).filter(Boolean);
    if (ids.length) await index.delete(ids);
    return { deleted: ids.length };
  }
}

export function isKnowledgeVectorReady() {
  return hasVector() && vectorEmbeddingsOk !== false;
}
