import {
  findOwnedCharacter,
  requireAccountApiKey,
} from "@/lib/api-keys/require-account-key";
import {
  getObsidianSyncStatus,
  obsidianSyncBodySchema,
  syncObsidianVault,
} from "@/lib/persona/obsidian-sync";

export const maxDuration = 120;

type Params = { params: Promise<{ id: string }> };

/**
 * Sync an Obsidian vault snapshot into a persona mind.
 * Auth: account key (vsk_…) — used by the Vesperer for Obsidian plugin.
 */
export async function POST(req: Request, { params }: Params) {
  const auth = await requireAccountApiKey(req, { bucket: "knowledge" });
  if (auth.error) return auth.error;
  const { id } = await params;

  const owned = await findOwnedCharacter(auth.workspaceId, id);
  if (!owned) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const parsed = obsidianSyncBodySchema.safeParse(
    await req.json().catch(() => null),
  );
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid vault payload", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const result = await syncObsidianVault({
    userId: auth.user.id,
    characterId: id,
    workspaceId: auth.workspaceId,
    body: parsed.data,
  });
  if (!result.ok) {
    return Response.json({ error: result.error }, { status: result.status });
  }
  return Response.json(result);
}

export async function GET(req: Request, { params }: Params) {
  const auth = await requireAccountApiKey(req, { bucket: "knowledge" });
  if (auth.error) return auth.error;
  const { id } = await params;

  const owned = await findOwnedCharacter(auth.workspaceId, id);
  if (!owned) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const status = await getObsidianSyncStatus({
    userId: auth.user.id,
    characterId: id,
    workspaceId: auth.workspaceId,
  });
  if (!status) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  return Response.json(status);
}
