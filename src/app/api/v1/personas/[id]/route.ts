import {
  findOwnedCharacter,
  requireAccountApiKey,
} from "@/lib/api-keys/require-account-key";
import { serializePersona } from "@/lib/personas/serialize";
import {
  deleteOwnedPersona,
  personaPatchSchema,
  updateOwnedPersona,
} from "@/lib/personas/update";

export const maxDuration = 60;

type Params = { params: Promise<{ id: string }> };

/** Get a persona you own (layers included; chat key never returned). */
export async function GET(req: Request, { params }: Params) {
  const auth = await requireAccountApiKey(req, { bucket: "management" });
  if (auth.error) return auth.error;
  const { id } = await params;

  const character = await findOwnedCharacter(auth.user.id, id);
  if (!character) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  return Response.json({
    persona: serializePersona(character, { includeLayers: true }),
  });
}

/** Patch a persona you own. */
export async function PATCH(req: Request, { params }: Params) {
  const auth = await requireAccountApiKey(req, { bucket: "management" });
  if (auth.error) return auth.error;
  const { id } = await params;

  const body = await req.json().catch(() => null);
  const parsed = personaPatchSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid data", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const result = await updateOwnedPersona({
    user: auth.user,
    characterId: id,
    input: parsed.data,
  });

  if (!result.ok) {
    return Response.json(
      { error: result.error, code: result.code },
      { status: result.status },
    );
  }

  return Response.json({ persona: result.character });
}

/** Delete a persona you own. */
export async function DELETE(req: Request, { params }: Params) {
  const auth = await requireAccountApiKey(req, { bucket: "management" });
  if (auth.error) return auth.error;
  const { id } = await params;

  const result = await deleteOwnedPersona({
    userId: auth.user.id,
    characterId: id,
  });

  if (!result.ok) {
    return Response.json({ error: result.error }, { status: result.status });
  }

  return Response.json({ ok: true });
}
