import { prisma } from "@/lib/db";
import {
  deleteMemory,
  updateMemory,
} from "@/lib/memory/vector";
import { z } from "zod";
import { getAppUser } from "@/lib/session";

export async function GET(req: Request) {
  const user = await getAppUser();
  if (!user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const characterId = searchParams.get("characterId");
  if (!characterId) {
    return Response.json(
      { error: "characterId required — memory is per persona" },
      { status: 400 },
    );
  }

  const character = await prisma.character.findFirst({
    where: { id: characterId, userId: user.id },
    select: { id: true },
  });
  if (!character) {
    return Response.json({ error: "Persona not found" }, { status: 404 });
  }

  const memories = await prisma.memory.findMany({
    where: { characterId },
    orderBy: { updatedAt: "desc" },
  });

  const peerUserIds = [
    ...new Set(memories.map((m) => m.userId).filter((id) => id !== user.id)),
  ];
  const peers = peerUserIds.length
    ? await prisma.telegramPeer.findMany({
        where: { userId: { in: peerUserIds } },
        select: {
          userId: true,
          telegramFirstName: true,
          telegramUsername: true,
          telegramUserId: true,
        },
      })
    : [];
  const peerByUser = new Map(peers.map((p) => [p.userId, p]));

  return Response.json({
    characterId,
    memories: memories.map((m) => {
      const peer = peerByUser.get(m.userId);
      const peerLabel =
        m.userId === user.id
          ? "admin test"
          : peer?.telegramFirstName ||
            (peer?.telegramUsername ? `@${peer.telegramUsername}` : null) ||
            (peer ? `tg:${peer.telegramUserId}` : "peer");
      return {
        id: m.id,
        type: m.type,
        content: m.content,
        createdAt: m.createdAt,
        peerLabel,
      };
    }),
  });
}

const patchSchema = z.object({
  id: z.string(),
  content: z.string().min(1),
});

export async function PATCH(req: Request) {
  const user = await getAppUser();
  if (!user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }
  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) {
    return Response.json({ error: "Invalid data" }, { status: 400 });
  }

  const owned = await prisma.memory.findFirst({
    where: {
      id: parsed.data.id,
      character: { userId: user.id },
    },
  });
  if (!owned) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const updated = await updateMemory(
    parsed.data.id,
    owned.userId,
    parsed.data.content,
  );
  if (!updated) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  const { track } = await import("@/lib/metrics");
  track("memory_corrected");
  return Response.json({ memory: updated });
}

export async function DELETE(req: Request) {
  const user = await getAppUser();
  if (!user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return Response.json({ error: "id required" }, { status: 400 });
  }

  const owned = await prisma.memory.findFirst({
    where: {
      id,
      character: { userId: user.id },
    },
  });
  if (!owned) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const ok = await deleteMemory(id, owned.userId);
  if (!ok) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  const { track } = await import("@/lib/metrics");
  track("memory_deleted");
  return Response.json({ ok: true });
}
