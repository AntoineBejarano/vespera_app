import "server-only";
import { prisma } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";
import { getAdapter } from "@/lib/knowledge/adapters/registry";
import { AdapterError } from "@/lib/knowledge/adapters/types";
import { buildChunks } from "@/lib/knowledge/chunk";
import { sha256Hex } from "@/lib/knowledge/checksum";
import {
  deleteVectorsBySource,
  upsertKnowledgeChunks,
} from "@/lib/knowledge/vector";
import { ingestLimits, type KnowledgeChunk } from "@/lib/knowledge/types";

export type StructuredLog = {
  at: string;
  level: "info" | "warn" | "error";
  message: string;
  data?: Record<string, unknown>;
};

function logEntry(
  level: StructuredLog["level"],
  message: string,
  data?: Record<string, unknown>,
): StructuredLog {
  return { at: new Date().toISOString(), level, message, data };
}

async function appendJobLog(jobId: string, entry: StructuredLog) {
  const job = await prisma.knowledgeIngestJob.findUnique({
    where: { id: jobId },
    select: { logJson: true },
  });
  const prev = Array.isArray(job?.logJson) ? (job!.logJson as StructuredLog[]) : [];
  const next = [...prev.slice(-200), entry];
  await prisma.knowledgeIngestJob.update({
    where: { id: jobId },
    data: { logJson: next as unknown as Prisma.InputJsonValue },
  });
  const line = JSON.stringify({ jobId, ...entry });
  if (entry.level === "error") console.error("[knowledge/ingest]", line);
  else console.info("[knowledge/ingest]", line);
}

async function refreshPackCounts(knowledgePackId: string) {
  const agg = await prisma.knowledgeSource.aggregate({
    where: { knowledgePackId, status: "indexed" },
    _sum: { documentCount: true, chunkCount: true },
  });
  await prisma.knowledgePack.update({
    where: { id: knowledgePackId },
    data: {
      documentCount: agg._sum.documentCount ?? 0,
      chunkCount: agg._sum.chunkCount ?? 0,
    },
  });
}

/**
 * Process one ingest/reindex/delete job in batches with retries + idempotency.
 * Safe to call repeatedly (cursor resume). Cancelled jobs exit cleanly.
 */
export async function processKnowledgeJob(jobId: string): Promise<{
  status: string;
  continue: boolean;
}> {
  const job = await prisma.knowledgeIngestJob.findUnique({
    where: { id: jobId },
    include: {
      source: true,
      knowledgePack: true,
    },
  });
  if (!job) return { status: "missing", continue: false };
  if (job.status === "cancelled" || job.status === "succeeded") {
    return { status: job.status, continue: false };
  }
  if (job.status === "failed" && job.attempt >= job.maxAttempts) {
    return { status: "failed", continue: false };
  }

  if (job.status === "queued") {
    await prisma.knowledgeIngestJob.update({
      where: { id: jobId },
      data: {
        status: "running",
        startedAt: job.startedAt ?? new Date(),
        attempt: job.attempt + 1,
      },
    });
  }

  try {
    if (job.kind === "delete_source_vectors") {
      if (!job.sourceId || !job.source) {
        throw new AdapterError("sourceId required for delete", false);
      }
      await appendJobLog(jobId, logEntry("info", "Deleting vectors for source", {
        sourceId: job.sourceId,
      }));
      await deleteVectorsBySource({
        knowledgePackId: job.knowledgePackId,
        sourceId: job.sourceId,
      });
      await prisma.knowledgeSource.update({
        where: { id: job.sourceId },
        data: {
          chunkCount: 0,
          documentCount: 0,
          status: "ready",
          lastError: null,
        },
      });
      await refreshPackCounts(job.knowledgePackId);
      await prisma.knowledgeIngestJob.update({
        where: { id: jobId },
        data: {
          status: "succeeded",
          progress: 100,
          finishedAt: new Date(),
        },
      });
      return { status: "succeeded", continue: false };
    }

    if (!job.sourceId || !job.source) {
      throw new AdapterError("sourceId required for ingest", false);
    }

    const source = job.source;
    if (!source.enabled && job.kind === "ingest") {
      throw new AdapterError("Source is disabled", false);
    }

    const adapter = getAdapter(source.provider);
    const config = adapter.validateConfig(source.configJson);

    // Idempotency: skip if already indexed with same checksum (ingest only)
    if (
      job.kind === "ingest" &&
      source.status === "indexed" &&
      source.checksum &&
      !(job.cursorJson as { force?: boolean } | null)?.force
    ) {
      const inspection = await adapter.inspect(config, {
        knowledgePackId: job.knowledgePackId,
        sourceId: source.id,
      });
      if (inspection.checksum === source.checksum) {
        await appendJobLog(
          jobId,
          logEntry("info", "Source unchanged — skipping ingest", {
            checksum: source.checksum,
          }),
        );
        await prisma.knowledgeIngestJob.update({
          where: { id: jobId },
          data: {
            status: "succeeded",
            progress: 100,
            finishedAt: new Date(),
            documentsTotal: source.documentCount,
            documentsDone: source.documentCount,
            chunksDone: source.chunkCount,
          },
        });
        return { status: "succeeded", continue: false };
      }
    }

    // Reindex: clear previous vectors first (once)
    const cursor = (job.cursorJson as {
      offsetPhase?: "fetch";
      adapterCursor?: unknown;
      documentsDone?: number;
      chunksDone?: number;
      cleared?: boolean;
      revision?: string;
      checksum?: string;
    } | null) ?? {};

    if (job.kind === "reindex" && !cursor.cleared) {
      await appendJobLog(jobId, logEntry("info", "Clearing previous vectors for reindex"));
      await deleteVectorsBySource({
        knowledgePackId: job.knowledgePackId,
        sourceId: source.id,
      });
      await prisma.knowledgeSource.update({
        where: { id: source.id },
        data: { status: "ingesting", chunkCount: 0, documentCount: 0 },
      });
      await prisma.knowledgeIngestJob.update({
        where: { id: jobId },
        data: {
          cursorJson: { ...cursor, cleared: true } as Prisma.InputJsonValue,
        },
      });
      cursor.cleared = true;
    } else {
      await prisma.knowledgeSource.update({
        where: { id: source.id },
        data: { status: "ingesting", lastError: null },
      });
    }

    // Cancel check
    const fresh = await prisma.knowledgeIngestJob.findUnique({
      where: { id: jobId },
      select: { status: true },
    });
    if (fresh?.status === "cancelled") {
      await cleanupPartial(source.id, job.knowledgePackId);
      return { status: "cancelled", continue: false };
    }

    const batch = await adapter.fetchDocuments(config, {
      knowledgePackId: job.knowledgePackId,
      sourceId: source.id,
      cursor: cursor.adapterCursor,
    });

    let chunksDone = cursor.chunksDone ?? 0;
    let documentsDone = cursor.documentsDone ?? 0;
    const allChunks: KnowledgeChunk[] = [];

    for (const doc of batch.documents) {
      if (chunksDone >= ingestLimits.maxChunksPerSource) break;
      if (documentsDone >= ingestLimits.maxDocumentsPerSource) break;

      const contentHash = sha256Hex(doc.text);
      const chunks = buildChunks({
        text: doc.text,
        contentHash,
        base: {
          knowledgePackId: job.knowledgePackId,
          sourceId: source.id,
          provider: source.provider,
          canonicalUrl: doc.canonicalUrl || source.canonicalUrl || "",
          author: doc.author || "",
          work: doc.work || doc.title || "",
          section: doc.section || "",
          speaker: doc.speaker || "",
          language: doc.language || source.language || "",
          sourceType: doc.sourceType || "other",
          license: doc.license || source.license || "",
        },
      });
      const room = ingestLimits.maxChunksPerSource - chunksDone;
      allChunks.push(...chunks.slice(0, room));
      documentsDone += 1;
      chunksDone += Math.min(chunks.length, room);
    }

    if (allChunks.length) {
      await upsertKnowledgeChunks(allChunks);
    }

    const nextCursor = {
      cleared: true,
      adapterCursor: batch.nextCursor,
      documentsDone,
      chunksDone,
      revision: batch.datasetRevision ?? cursor.revision,
      checksum: batch.checksum ?? cursor.checksum,
    };

    const documentsTotal = Math.max(
      job.documentsTotal,
      documentsDone + (batch.done ? 0 : 1),
    );
    const progress = batch.done
      ? 100
      : Math.min(95, Math.round((documentsDone / Math.max(documentsTotal, documentsDone + 5)) * 100));

    await prisma.knowledgeIngestJob.update({
      where: { id: jobId },
      data: {
        documentsDone,
        documentsTotal,
        chunksDone,
        progress,
        cursorJson: nextCursor as Prisma.InputJsonValue,
      },
    });

    await appendJobLog(
      jobId,
      logEntry("info", "Batch indexed", {
        documentsInBatch: batch.documents.length,
        chunksInBatch: allChunks.length,
        documentsDone,
        chunksDone,
        done: batch.done,
      }),
    );

    if (!batch.done) {
      return { status: "running", continue: true };
    }

    // Finalize source + pack
    const finalChecksum =
      nextCursor.checksum ||
      source.checksum ||
      sha256Hex(`${source.id}:${documentsDone}:${chunksDone}`);

    await prisma.knowledgeSource.update({
      where: { id: source.id },
      data: {
        status: "indexed",
        documentCount: documentsDone,
        chunkCount: chunksDone,
        datasetRevision: nextCursor.revision ?? source.datasetRevision,
        checksum: finalChecksum,
        lastIngestedAt: new Date(),
        lastError: null,
      },
    });
    await refreshPackCounts(job.knowledgePackId);
    await prisma.knowledgeIngestJob.update({
      where: { id: jobId },
      data: {
        status: "succeeded",
        progress: 100,
        finishedAt: new Date(),
      },
    });
    await appendJobLog(jobId, logEntry("info", "Ingest succeeded", {
      documentsDone,
      chunksDone,
    }));
    return { status: "succeeded", continue: false };
  } catch (error) {
    const recoverable =
      error instanceof AdapterError ? error.recoverable : true;
    const message = error instanceof Error ? error.message : String(error);
    await appendJobLog(jobId, logEntry("error", message, { recoverable }));

    const current = await prisma.knowledgeIngestJob.findUnique({
      where: { id: jobId },
    });
    if (!current) return { status: "failed", continue: false };

    if (current.status === "cancelled") {
      return { status: "cancelled", continue: false };
    }

    const attempts = current.attempt;
    if (recoverable && attempts < current.maxAttempts) {
      await prisma.knowledgeIngestJob.update({
        where: { id: jobId },
        data: {
          status: "queued",
          error: message,
        },
      });
      if (current.sourceId) {
        await prisma.knowledgeSource.update({
          where: { id: current.sourceId },
          data: { status: "failed", lastError: message },
        });
      }
      return { status: "queued", continue: true };
    }

    // Permanent failure — clean partial vectors for this source
    if (current.sourceId) {
      try {
        await cleanupPartial(current.sourceId, current.knowledgePackId);
      } catch (cleanupErr) {
        console.error("[knowledge/ingest] cleanup failed", cleanupErr);
      }
      await prisma.knowledgeSource.update({
        where: { id: current.sourceId },
        data: { status: "failed", lastError: message },
      });
    }
    await prisma.knowledgeIngestJob.update({
      where: { id: jobId },
      data: {
        status: "failed",
        error: message,
        finishedAt: new Date(),
      },
    });
    return { status: "failed", continue: false };
  }
}

async function cleanupPartial(sourceId: string, knowledgePackId: string) {
  await deleteVectorsBySource({ knowledgePackId, sourceId });
  await prisma.knowledgeSource.update({
    where: { id: sourceId },
    data: { chunkCount: 0 },
  });
  await refreshPackCounts(knowledgePackId);
}
