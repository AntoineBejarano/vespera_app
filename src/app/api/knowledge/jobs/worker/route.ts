import {
  runKnowledgeJobWake,
  scheduleKnowledgeJob,
} from "@/lib/knowledge/ingest/jobs";

export const maxDuration = 120;

/**
 * Internal worker wake for async knowledge ingest.
 * Authenticated via shared secret (not session cookies).
 */
export async function POST(req: Request) {
  const secret =
    process.env.KNOWLEDGE_JOB_SECRET ||
    process.env.AUTH_SECRET ||
    "";
  const header = req.headers.get("x-knowledge-job-secret") || "";
  if (!secret || header !== secret) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as { jobId?: string };
  if (!body.jobId) {
    return Response.json({ error: "jobId required" }, { status: 400 });
  }

  const result = await runKnowledgeJobWake(body.jobId);
  if (result.shouldContinue) {
    // Chain another wake outside this request
    scheduleKnowledgeJob(body.jobId);
  }
  return Response.json(result);
}
