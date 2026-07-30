import { auth } from "@/lib/auth";
import { getActiveCharacter } from "@/lib/users";
import {
  deleteMemory,
  listMemories,
  updateMemory,
} from "@/lib/memory/vector";
import { z } from "zod";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "No autenticado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const characterId =
    searchParams.get("characterId") ??
    (await getActiveCharacter(session.user.id))?.id;

  if (!characterId) {
    return Response.json({ memories: [] });
  }

  const memories = await listMemories(session.user.id, characterId);
  return Response.json({ memories, characterId });
}

const patchSchema = z.object({
  id: z.string(),
  content: z.string().min(1),
});

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "No autenticado" }, { status: 401 });
  }
  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) {
    return Response.json({ error: "Datos inválidos" }, { status: 400 });
  }
  const updated = await updateMemory(
    parsed.data.id,
    session.user.id,
    parsed.data.content,
  );
  if (!updated) {
    return Response.json({ error: "No encontrado" }, { status: 404 });
  }
  const { track } = await import("@/lib/metrics");
  track("memory_corrected");
  return Response.json({ memory: updated });
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "No autenticado" }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return Response.json({ error: "Falta id" }, { status: 400 });
  }
  const ok = await deleteMemory(id, session.user.id);
  if (!ok) {
    return Response.json({ error: "No encontrado" }, { status: 404 });
  }
  const { track } = await import("@/lib/metrics");
  track("memory_deleted");
  return Response.json({ ok: true });
}
