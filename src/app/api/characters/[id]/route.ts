import { prisma } from "@/lib/db";
import { getAppUser } from "@/lib/session";
import {
  deleteOwnedPersona,
  personaPatchSchema,
  updateOwnedPersona,
} from "@/lib/personas/update";
import { getOrCreateActiveWorkspaceId } from "@/lib/workspace/ensure";
import {
  requireWorkspacePermission,
  workspaceAuthResponse,
} from "@/lib/workspace/permissions";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const user = await getAppUser();
  if (!user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }
  const { id } = await params;
  try {
    const workspaceId = await getOrCreateActiveWorkspaceId(user);
    await requireWorkspacePermission(user.id, workspaceId, "personas.read");
    const character = await prisma.character.findFirst({
      where: { id, workspaceId, archivedAt: null },
    });
    if (!character) {
      return Response.json({ error: "No encontrado" }, { status: 404 });
    }
    return Response.json({ character });
  } catch (err) {
    const res = workspaceAuthResponse(err);
    if (res) return res;
    throw err;
  }
}

export async function PATCH(req: Request, { params }: Params) {
  const user = await getAppUser();
  if (!user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }
  const { id } = await params;

  const parsed = personaPatchSchema.safeParse(await req.json());
  if (!parsed.success) {
    return Response.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const workspaceId = await getOrCreateActiveWorkspaceId(user);
  const result = await updateOwnedPersona({
    user,
    characterId: id,
    workspaceId,
    input: parsed.data,
  });

  if (!result.ok) {
    return Response.json(
      { error: result.error, code: result.code },
      { status: result.status },
    );
  }

  return Response.json({ character: result.character });
}

export async function DELETE(_req: Request, { params }: Params) {
  const user = await getAppUser();
  if (!user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }
  const { id } = await params;

  const workspaceId = await getOrCreateActiveWorkspaceId(user);
  const result = await deleteOwnedPersona({
    userId: user.id,
    characterId: id,
    workspaceId,
  });

  if (!result.ok) {
    return Response.json({ error: result.error }, { status: result.status });
  }

  return Response.json({ ok: true });
}
