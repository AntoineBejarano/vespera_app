import { z } from "zod";
import { prisma } from "@/lib/db";
import {
  findOwnedKnowledgePack,
  requireAccountApiKey,
} from "@/lib/api-keys/require-account-key";
import { reindexPack } from "@/lib/knowledge/packs";

type Params = { params: Promise<{ id: string }> };

const patchSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  description: z.string().max(2000).nullable().optional(),
  active: z.boolean().optional(),
  language: z.string().max(16).optional(),
  reindex: z.boolean().optional(),
});

export async function GET(req: Request, { params }: Params) {
  const auth = await requireAccountApiKey(req, { bucket: "knowledge" });
  if (auth.error) return auth.error;
  const { id } = await params;

  const pack = await prisma.knowledgePack.findFirst({
    where: { id, userId: auth.user.id },
    include: {
      sources: { orderBy: { createdAt: "asc" } },
      characters: {
        include: { character: { select: { id: true, name: true } } },
      },
      jobs: {
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  });
  if (!pack) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  return Response.json({ pack });
}

export async function PATCH(req: Request, { params }: Params) {
  const auth = await requireAccountApiKey(req, { bucket: "knowledge" });
  if (auth.error) return auth.error;
  const { id } = await params;

  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Invalid data" }, { status: 400 });
  }

  const owned = await findOwnedKnowledgePack(auth.workspaceId, id);
  if (!owned) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  if (parsed.data.reindex) {
    const jobs = await reindexPack({
      userId: auth.user.id,
      knowledgePackId: id,
    });
    return Response.json({ ok: true, jobs });
  }

  const pack = await prisma.knowledgePack.update({
    where: { id },
    data: {
      name: parsed.data.name,
      description: parsed.data.description,
      active: parsed.data.active,
      language: parsed.data.language,
    },
  });
  return Response.json({ pack });
}

export async function DELETE(req: Request, { params }: Params) {
  const auth = await requireAccountApiKey(req, { bucket: "knowledge" });
  if (auth.error) return auth.error;
  const { id } = await params;

  const owned = await findOwnedKnowledgePack(auth.workspaceId, id);
  if (!owned) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const { deleteVectorsByPack } = await import("@/lib/knowledge/vector");
  try {
    await deleteVectorsByPack(id);
  } catch (err) {
    console.error("[knowledge] pack vector delete failed", err);
  }
  await prisma.knowledgePack.delete({ where: { id } });
  return Response.json({ ok: true });
}
