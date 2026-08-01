import { z } from "zod";
import { getAppUser } from "@/lib/session";
import {
  linkPackToCharacters,
  unlinkPackFromCharacter,
} from "@/lib/knowledge/packs";
import { prisma } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

const linkSchema = z.object({
  characterIds: z.array(z.string()).min(1),
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

  const [links, characters] = await Promise.all([
    prisma.characterKnowledgePack.findMany({
      where: { knowledgePackId: id },
      include: { character: { select: { id: true, name: true } } },
    }),
    prisma.character.findMany({
      where: { userId: user.id },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return Response.json({ links, characters });
}

export async function POST(req: Request, { params }: Params) {
  const user = await getAppUser();
  if (!user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }
  const { id } = await params;
  const parsed = linkSchema.safeParse(await req.json());
  if (!parsed.success) {
    return Response.json({ error: "Invalid data" }, { status: 400 });
  }

  try {
    const characterIds = await linkPackToCharacters({
      userId: user.id,
      knowledgePackId: id,
      characterIds: parsed.data.characterIds,
    });
    return Response.json({ characterIds });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed";
    return Response.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(req: Request, { params }: Params) {
  const user = await getAppUser();
  if (!user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const characterId = searchParams.get("characterId");
  if (!characterId) {
    return Response.json({ error: "characterId required" }, { status: 400 });
  }
  const ok = await unlinkPackFromCharacter({
    userId: user.id,
    knowledgePackId: id,
    characterId,
  });
  if (!ok) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  return Response.json({ ok: true });
}
