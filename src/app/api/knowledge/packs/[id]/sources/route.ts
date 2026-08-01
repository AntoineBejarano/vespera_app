import { z } from "zod";
import { getAppUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { addSource } from "@/lib/knowledge/packs";
import { KNOWLEDGE_PROVIDERS } from "@/lib/knowledge/types";

type Params = { params: Promise<{ id: string }> };

const createSchema = z.object({
  provider: z.enum(KNOWLEDGE_PROVIDERS),
  config: z.record(z.string(), z.unknown()),
  externalId: z.string().optional(),
  objectKey: z.string().optional(),
});

export async function GET(_req: Request, { params }: Params) {
  const user = await getAppUser();
  if (!user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }
  const { id } = await params;
  const pack = await prisma.knowledgePack.findFirst({
    where: { id, userId: user.id },
    select: { id: true },
  });
  if (!pack) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  const sources = await prisma.knowledgeSource.findMany({
    where: { knowledgePackId: id },
    orderBy: { createdAt: "asc" },
  });
  return Response.json({ sources });
}

export async function POST(req: Request, { params }: Params) {
  const user = await getAppUser();
  if (!user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }
  const { id } = await params;
  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.message },
      { status: 400 },
    );
  }

  try {
    const result = await addSource({
      userId: user.id,
      knowledgePackId: id,
      provider: parsed.data.provider,
      config: parsed.data.config,
      externalId: parsed.data.externalId,
      objectKey: parsed.data.objectKey,
    });
    return Response.json(result, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed";
    return Response.json({ error: message }, { status: 400 });
  }
}
