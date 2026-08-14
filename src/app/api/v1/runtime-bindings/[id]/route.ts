import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAccountApiKey } from "@/lib/api-keys/require-account-key";
import { isValidAuthSecretRef } from "@/lib/reasoning/secrets";

export const maxDuration = 30;

type Params = { params: Promise<{ id: string }> };

const patchSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  baseUrl: z.string().url().max(500).optional(),
  authSecretRef: z.string().min(3).max(128).optional(),
  timeoutMs: z.number().int().min(1000).max(60_000).optional(),
});

export async function PATCH(req: Request, { params }: Params) {
  const auth = await requireAccountApiKey(req, { bucket: "management" });
  if (auth.error) return auth.error;
  const { id } = await params;

  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid data", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const existing = await prisma.runtimeBinding.findFirst({
    where: { id, workspaceId: auth.workspaceId },
  });
  if (!existing) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  if (parsed.data.authSecretRef && !isValidAuthSecretRef(parsed.data.authSecretRef)) {
    return Response.json({ error: "Invalid authSecretRef." }, { status: 400 });
  }
  if (parsed.data.baseUrl) {
    const url = new URL(parsed.data.baseUrl);
    if (url.protocol !== "https:" && url.hostname !== "localhost") {
      return Response.json(
        { error: "baseUrl must be https (localhost allowed for development)." },
        { status: 400 },
      );
    }
  }

  const row = await prisma.runtimeBinding.update({
    where: { id },
    data: parsed.data,
  });

  return Response.json({
    binding: {
      id: row.id,
      name: row.name,
      kind: row.kind,
      baseUrl: row.baseUrl,
      authSecretRef: row.authSecretRef,
      timeoutMs: row.timeoutMs,
    },
  });
}

export async function DELETE(req: Request, { params }: Params) {
  const auth = await requireAccountApiKey(req, { bucket: "management" });
  if (auth.error) return auth.error;
  const { id } = await params;

  const existing = await prisma.runtimeBinding.findFirst({
    where: { id, workspaceId: auth.workspaceId },
  });
  if (!existing) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.character.updateMany({
    where: { reasoningBindingId: id, workspaceId: auth.workspaceId },
    data: { reasoningBindingId: null, reasoningMode: "native" },
  });
  await prisma.runtimeBinding.delete({ where: { id } });
  return Response.json({ ok: true });
}
