import { z } from "zod";
import { getAppUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { reindexPack } from "@/lib/knowledge/packs";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const user = await getAppUser();
  if (!user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }
  const { id } = await params;

  const pack = await prisma.knowledgePack.findFirst({
    where: { id, userId: user.id },
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

const patchSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  description: z.string().max(2000).nullable().optional(),
  active: z.boolean().optional(),
  language: z.string().max(16).optional(),
  reindex: z.boolean().optional(),
});

export async function PATCH(req: Request, { params }: Params) {
  const user = await getAppUser();
  if (!user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }
  const { id } = await params;
  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) {
    return Response.json({ error: "Invalid data" }, { status: 400 });
  }

  const owned = await prisma.knowledgePack.findFirst({
    where: { id, userId: user.id },
  });
  if (!owned) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  if (parsed.data.reindex) {
    const jobs = await reindexPack({ userId: user.id, knowledgePackId: id });
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

export async function DELETE(_req: Request, { params }: Params) {
  const user = await getAppUser();
  if (!user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }
  const { id } = await params;
  const owned = await prisma.knowledgePack.findFirst({
    where: { id, userId: user.id },
    include: { sources: true },
  });
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
