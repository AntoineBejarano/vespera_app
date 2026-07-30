import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { clearHistory } from "@/lib/memory/history";
import { Prisma } from "@/generated/prisma/client";
import { z } from "zod";

const patchSchema = z.object({
  active: z.boolean().optional(),
  intensity: z.number().int().min(1).max(5).optional(),
  limitsJson: z.record(z.string(), z.unknown()).optional(),
  resetChat: z.boolean().optional(),
});

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "No autenticado" }, { status: 401 });
  }
  const { id } = await params;
  const character = await prisma.character.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!character) {
    return Response.json({ error: "No encontrado" }, { status: 404 });
  }
  return Response.json({ character });
}

export async function PATCH(req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "No autenticado" }, { status: 401 });
  }
  const { id } = await params;
  const character = await prisma.character.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!character) {
    return Response.json({ error: "No encontrado" }, { status: 404 });
  }

  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) {
    return Response.json({ error: "Datos inválidos" }, { status: 400 });
  }

  if (parsed.data.active) {
    await prisma.character.updateMany({
      where: { userId: session.user.id, active: true },
      data: { active: false },
    });
  }

  if (parsed.data.resetChat) {
    await clearHistory(session.user.id, id);
    const conversation = await prisma.conversation.findFirst({
      where: { userId: session.user.id, characterId: id },
      orderBy: { updatedAt: "desc" },
    });
    if (conversation) {
      await prisma.message.deleteMany({ where: { conversationId: conversation.id } });
    }
  }

  const updated = await prisma.character.update({
    where: { id },
    data: {
      active: parsed.data.active ?? character.active,
      intensity: parsed.data.intensity ?? character.intensity,
      limitsJson: (parsed.data.limitsJson ??
        character.limitsJson ??
        undefined) as Prisma.InputJsonValue | undefined,
    },
  });

  return Response.json({ character: updated });
}

export async function DELETE(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "No autenticado" }, { status: 401 });
  }
  const { id } = await params;
  const character = await prisma.character.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!character) {
    return Response.json({ error: "No encontrado" }, { status: 404 });
  }

  await prisma.character.delete({ where: { id } });
  return Response.json({ ok: true });
}
