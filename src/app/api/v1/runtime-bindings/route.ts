import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAccountApiKey } from "@/lib/api-keys/require-account-key";
import { isValidAuthSecretRef } from "@/lib/reasoning/secrets";

export const maxDuration = 30;

const createSchema = z.object({
  name: z.string().min(1).max(80),
  kind: z.literal("http").optional(),
  baseUrl: z.string().url().max(500),
  authSecretRef: z.string().min(3).max(128),
  timeoutMs: z.number().int().min(1000).max(60_000).optional(),
});

function assertSafeUrl(raw: string) {
  const url = new URL(raw);
  if (url.protocol !== "https:" && url.hostname !== "localhost") {
    return "baseUrl must be https (localhost allowed for development).";
  }
  return null;
}

export async function GET(req: Request) {
  const auth = await requireAccountApiKey(req, { bucket: "management" });
  if (auth.error) return auth.error;

  const rows = await prisma.runtimeBinding.findMany({
    where: { workspaceId: auth.workspaceId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      kind: true,
      baseUrl: true,
      authSecretRef: true,
      timeoutMs: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return Response.json({ bindings: rows });
}

export async function POST(req: Request) {
  const auth = await requireAccountApiKey(req, { bucket: "management" });
  if (auth.error) return auth.error;

  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid data", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const urlError = assertSafeUrl(parsed.data.baseUrl);
  if (urlError) {
    return Response.json({ error: urlError }, { status: 400 });
  }
  if (!isValidAuthSecretRef(parsed.data.authSecretRef)) {
    return Response.json(
      { error: "authSecretRef must be an env var name (e.g. HERMES_RUNTIME_SECRET)." },
      { status: 400 },
    );
  }

  const row = await prisma.runtimeBinding.create({
    data: {
      workspaceId: auth.workspaceId,
      name: parsed.data.name,
      kind: parsed.data.kind ?? "http",
      baseUrl: parsed.data.baseUrl,
      authSecretRef: parsed.data.authSecretRef,
      timeoutMs: parsed.data.timeoutMs ?? 30_000,
    },
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
