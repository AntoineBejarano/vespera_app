import { getAppUser } from "@/lib/session";
import {
  getObsidianSyncStatus,
  obsidianSyncBodySchema,
  syncObsidianVault,
} from "@/lib/persona/obsidian-sync";

type Params = { params: Promise<{ id: string }> };

/** Session-auth vault sync (web UI). */
export async function POST(req: Request, { params }: Params) {
  const user = await getAppUser();
  if (!user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }
  const { id } = await params;
  const parsed = obsidianSyncBodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Invalid vault payload" }, { status: 400 });
  }

  const result = await syncObsidianVault({
    userId: user.id,
    characterId: id,
    body: parsed.data,
  });
  if (!result.ok) {
    return Response.json({ error: result.error }, { status: result.status });
  }
  return Response.json(result);
}

export async function GET(_req: Request, { params }: Params) {
  const user = await getAppUser();
  if (!user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }
  const { id } = await params;
  const status = await getObsidianSyncStatus({
    userId: user.id,
    characterId: id,
  });
  if (!status) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  return Response.json(status);
}
