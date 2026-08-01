import { z } from "zod";
import { getAppUser } from "@/lib/session";
import {
  deleteSource,
  deleteSourceVectors,
  inspectSource,
  setSourceEnabled,
  startSourceIngest,
} from "@/lib/knowledge/packs";

type Params = { params: Promise<{ sourceId: string }> };

const patchSchema = z.object({
  enabled: z.boolean().optional(),
  action: z
    .enum(["inspect", "ingest", "reingest", "delete_vectors"])
    .optional(),
  force: z.boolean().optional(),
});

export async function PATCH(req: Request, { params }: Params) {
  const user = await getAppUser();
  if (!user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }
  const { sourceId } = await params;
  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) {
    return Response.json({ error: "Invalid data" }, { status: 400 });
  }

  try {
    if (parsed.data.enabled !== undefined) {
      const source = await setSourceEnabled({
        userId: user.id,
        sourceId,
        enabled: parsed.data.enabled,
      });
      if (!source) {
        return Response.json({ error: "Not found" }, { status: 404 });
      }
      return Response.json({ source });
    }

    switch (parsed.data.action) {
      case "inspect": {
        const result = await inspectSource({ userId: user.id, sourceId });
        return Response.json(result);
      }
      case "ingest":
      case "reingest": {
        const job = await startSourceIngest({
          userId: user.id,
          sourceId,
          force: parsed.data.force || parsed.data.action === "reingest",
        });
        return Response.json({ job });
      }
      case "delete_vectors": {
        const job = await deleteSourceVectors({ userId: user.id, sourceId });
        return Response.json({ job });
      }
      default:
        return Response.json({ error: "No action" }, { status: 400 });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed";
    return Response.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  const user = await getAppUser();
  if (!user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }
  const { sourceId } = await params;
  const ok = await deleteSource({ userId: user.id, sourceId });
  if (!ok) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  return Response.json({ ok: true });
}
