import { getActiveCharacter } from "@/lib/users";
import {
  deleteMemory,
  listMemories,
  updateMemory,
} from "@/lib/memory/vector";
import { z } from "zod";
import { requireAppUser, getAppUser } from "@/lib/session";

export async function GET(req: Request) {
  const user = await getAppUser();
  if (!user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const characterId =
    searchParams.get("characterId") ??
    (await getActiveCharacter(user.id))?.id;

  if (!characterId) {
    return Response.json({ memories: [] });
  }

  const memories = await listMemories(user.id, characterId);
  return Response.json({ memories, characterId });
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
    return Response.json({ error: "Datos inválidos" }, { status: 400 });
  }
  const updated = await updateMemory(
    parsed.data.id,
    user.id,
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
  const user = await getAppUser();
  if (!user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return Response.json({ error: "Falta id" }, { status: 400 });
  }
  const ok = await deleteMemory(id, user.id);
  if (!ok) {
    return Response.json({ error: "No encontrado" }, { status: 404 });
  }
  const { track } = await import("@/lib/metrics");
  track("memory_deleted");
  return Response.json({ ok: true });
}
