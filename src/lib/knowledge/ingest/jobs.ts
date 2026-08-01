import "server-only";
import { prisma } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";
import { processKnowledgeJob } from "@/lib/knowledge/ingest/pipeline";
import { ingestLimits, type JobKind } from "@/lib/knowledge/types";

/** Max batch steps per wake to stay within serverless/request budgets. */
const MAX_STEPS_PER_WAKE = 8;

export async function enqueueKnowledgeJob(params: {
  knowledgePackId: string;
  sourceId?: string;
  kind?: JobKind;
  force?: boolean;
}) {
  const job = await prisma.knowledgeIngestJob.create({
    data: {
      knowledgePackId: params.knowledgePackId,
      sourceId: params.sourceId,
      kind: params.kind ?? "ingest",
      status: "queued",
      maxAttempts: ingestLimits.maxJobAttempts,
      cursorJson: params.force
        ? ({ force: true } as Prisma.InputJsonValue)
        : undefined,
    },
  });
  return job;
}

/**
 * Drive a job through one or more batch steps.
 * Returns whether the caller should schedule another wake.
 */
export async function runKnowledgeJobWake(jobId: string) {
  let shouldContinue = false;
  for (let step = 0; step < MAX_STEPS_PER_WAKE; step++) {
    const result = await processKnowledgeJob(jobId);
    if (!result.continue) {
      shouldContinue = false;
      return { ...result, shouldContinue };
    }
    shouldContinue = true;
  }
  return { status: "running", continue: true, shouldContinue };
}

/**
 * Schedule background processing without blocking the HTTP response.
 * Uses a self-fetch worker when APP_URL is set; otherwise runs in-process.
 */
export function scheduleKnowledgeJob(jobId: string) {
  const base =
    process.env.APP_URL?.replace(/\/$/, "") ||
    process.env.AUTH_URL?.replace(/\/$/, "") ||
    process.env.NEXTAUTH_URL?.replace(/\/$/, "");
  const secret =
    process.env.KNOWLEDGE_JOB_SECRET ||
    process.env.AUTH_SECRET ||
    "";

  if (base && secret) {
    const url = `${base}/api/knowledge/jobs/worker`;
    void fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-knowledge-job-secret": secret,
      },
      body: JSON.stringify({ jobId }),
    }).catch((err) => {
      console.error("[knowledge/jobs] worker fetch failed, falling back in-process", err);
      void runKnowledgeJobWake(jobId).then(async (r) => {
        if (r.shouldContinue) scheduleKnowledgeJob(jobId);
      });
    });
    return;
  }

  void runKnowledgeJobWake(jobId).then(async (r) => {
    if (r.shouldContinue) {
      // Yield event loop then continue
      setTimeout(() => scheduleKnowledgeJob(jobId), 50);
    }
  });
}

export async function cancelKnowledgeJob(jobId: string, userId: string) {
  const job = await prisma.knowledgeIngestJob.findFirst({
    where: { id: jobId, knowledgePack: { userId } },
  });
  if (!job) return null;
  if (job.status === "succeeded" || job.status === "cancelled") return job;
  return prisma.knowledgeIngestJob.update({
    where: { id: jobId },
    data: { status: "cancelled", finishedAt: new Date() },
  });
}

export async function retryKnowledgeJob(jobId: string, userId: string) {
  const existing = await prisma.knowledgeIngestJob.findFirst({
    where: { id: jobId, knowledgePack: { userId } },
  });
  if (!existing) return null;
  const job = await enqueueKnowledgeJob({
    knowledgePackId: existing.knowledgePackId,
    sourceId: existing.sourceId ?? undefined,
    kind: existing.kind as JobKind,
    force: true,
  });
  scheduleKnowledgeJob(job.id);
  return job;
}
