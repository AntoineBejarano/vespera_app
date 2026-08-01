import { z } from "zod";
import { prisma } from "@/lib/db";
import {
  findOwnedKnowledgePack,
  requireAccountApiKey,
} from "@/lib/api-keys/require-account-key";
import {
  linkPackToCharacters,
  unlinkPackFromCharacter,
} from "@/lib/knowledge/packs";

type Params = { params: Promise<{ id: string }> };

const linkSchema = z.object({
  characterIds: z.array(z.string().min(1)).min(1).max(50),
});

/** List links for a pack you own + your characters available to link. */
export async function GET(req: Request, { params }: Params) {
  const auth = await requireAccountApiKey(req, { bucket: "knowledge" });
  if (auth.error) return auth.error;
  const { id } = await params;

  const pack = await findOwnedKnowledgePack(auth.user.id, id);
  if (!pack) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const [links, characters] = await Promise.all([
    prisma.characterKnowledgePack.findMany({
      where: { knowledgePackId: id },
      include: { character: { select: { id: true, name: true } } },
    }),
    prisma.character.findMany({
      where: { userId: auth.user.id },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return Response.json({ links, characters });
}

/** Link a pack you own to characters you own. Foreign IDs are ignored. */
export async function POST(req: Request, { params }: Params) {
  const auth = await requireAccountApiKey(req, { bucket: "knowledge" });
  if (auth.error) return auth.error;
  const { id } = await params;

  const parsed = linkSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Invalid data" }, { status: 400 });
  }

  try {
    const characterIds = await linkPackToCharacters({
      userId: auth.user.id,
      knowledgePackId: id,
      characterIds: parsed.data.characterIds,
    });
    return Response.json({ characterIds });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed";
    return Response.json({ error: message }, { status: 400 });
  }
}

/** Unlink a character from a pack you own. */
export async function DELETE(req: Request, { params }: Params) {
  const auth = await requireAccountApiKey(req, { bucket: "knowledge" });
  if (auth.error) return auth.error;
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const characterId = searchParams.get("characterId");
  if (!characterId) {
    return Response.json({ error: "characterId required" }, { status: 400 });
  }

  const ok = await unlinkPackFromCharacter({
    userId: auth.user.id,
    knowledgePackId: id,
    characterId,
  });
  if (!ok) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  return Response.json({ ok: true });
}
