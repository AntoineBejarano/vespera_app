import { prisma } from "@/lib/db";
import { getAppUser } from "@/lib/session";
import {
  deleteOwnedPersona,
  personaPatchSchema,
  updateOwnedPersona,
} from "@/lib/personas/update";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const user = await getAppUser();
  if (!user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }
  const { id } = await params;
  const character = await prisma.character.findFirst({
    where: { id, userId: user.id },
  });
  if (!character) {
    return Response.json({ error: "No encontrado" }, { status: 404 });
  }
  return Response.json({ character });
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

  const result = await updateOwnedPersona({
    user,
    characterId: id,
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

  const result = await deleteOwnedPersona({
    userId: user.id,
    characterId: id,
  });

  if (!result.ok) {
    return Response.json({ error: result.error }, { status: result.status });
  }

  return Response.json({ ok: true });
}
