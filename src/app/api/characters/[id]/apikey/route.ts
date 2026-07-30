import { randomBytes } from "crypto";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/users";

type Params = { params: Promise<{ id: string }> };

/** Reveal or rotate API key for a persona */
export async function GET(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }
  await requireUser(session.user.id);
  const { id } = await params;

  const character = await prisma.character.findFirst({
    where: { id, userId: session.user.id },
    select: { id: true, name: true, apiKey: true },
  });
  if (!character) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  return Response.json({
    characterId: character.id,
    name: character.name,
    apiKey: character.apiKey,
    endpoint: "/api/v1/chat",
    usage: {
      header: "X-Api-Key: <apiKey>",
      body: { message: "hey", peerId: "optional-stable-id" },
    },
  });
}

export async function POST(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }
  await requireUser(session.user.id);
  const { id } = await params;

  const character = await prisma.character.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!character) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const apiKey = `vesp_${randomBytes(24).toString("hex")}`;
  await prisma.character.update({
    where: { id },
    data: { apiKey },
  });

  return Response.json({
    characterId: id,
    apiKey,
    endpoint: "/api/v1/chat",
  });
}
