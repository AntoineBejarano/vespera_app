import { shortHash } from "@/lib/knowledge/checksum";
import { ingestLimits, type KnowledgeChunk, type KnowledgeChunkMetadata } from "@/lib/knowledge/types";

export function chunkText(
  text: string,
  opts?: { size?: number; overlap?: number },
): string[] {
  const size = opts?.size ?? ingestLimits.chunkSizeChars;
  const overlap = opts?.overlap ?? ingestLimits.chunkOverlapChars;
  const cleaned = text.trim();
  if (!cleaned) return [];
  if (cleaned.length <= size) return [cleaned];

  const chunks: string[] = [];
  let start = 0;
  while (start < cleaned.length) {
    let end = Math.min(start + size, cleaned.length);
    if (end < cleaned.length) {
      const window = cleaned.slice(start, end);
      const breakAt = Math.max(
        window.lastIndexOf("\n\n"),
        window.lastIndexOf(". "),
        window.lastIndexOf(" "),
      );
      if (breakAt > size * 0.4) end = start + breakAt + 1;
    }
    const piece = cleaned.slice(start, end).trim();
    if (piece) chunks.push(piece);
    if (end >= cleaned.length) break;
    start = Math.max(0, end - overlap);
  }
  return chunks;
}

export function buildChunkId(params: {
  knowledgePackId: string;
  sourceId: string;
  contentHash: string;
  index: number;
}) {
  return [
    "kp",
    params.knowledgePackId.slice(0, 8),
    params.sourceId.slice(0, 8),
    shortHash(params.contentHash, 10),
    String(params.index),
  ].join("_");
}

export function buildChunks(params: {
  text: string;
  base: Omit<KnowledgeChunkMetadata, "contentHash" | "kind">;
  contentHash: string;
}): KnowledgeChunk[] {
  const parts = chunkText(params.text);
  return parts.map((text, index) => ({
    id: buildChunkId({
      knowledgePackId: params.base.knowledgePackId,
      sourceId: params.base.sourceId,
      contentHash: params.contentHash,
      index,
    }),
    text,
    metadata: {
      ...params.base,
      contentHash: params.contentHash,
      kind: "knowledge",
    },
  }));
}
