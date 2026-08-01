import { getAppUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import {
  cancelKnowledgeJob,
  retryKnowledgeJob,
} from "@/lib/knowledge/ingest/jobs";

type Params = { params: Promise<{ jobId: string }> };

export async function GET(_req: Request, { params }: Params) {
  const user = await getAppUser();
  if (!user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }
  const { jobId } = await params;
  const job = await prisma.knowledgeIngestJob.findFirst({
    where: { id: jobId, knowledgePack: { userId: user.id } },
  });
  if (!job) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  return Response.json({ job });
}

export async function POST(req: Request, { params }: Params) {
  const user = await getAppUser();
  if (!user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }
  const { jobId } = await params;
  const body = (await req.json().catch(() => ({}))) as { action?: string };

  if (body.action === "cancel") {
    const job = await cancelKnowledgeJob(jobId, user.id);
    if (!job) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }
    return Response.json({ job });
  }

  if (body.action === "retry") {
    const job = await retryKnowledgeJob(jobId, user.id);
    if (!job) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }
    return Response.json({ job });
  }

  return Response.json({ error: "action must be cancel|retry" }, { status: 400 });
}
