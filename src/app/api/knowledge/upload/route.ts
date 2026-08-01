import { getAppUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import {
  buildUploadKey,
  isObjectStorageConfigured,
  putObject,
} from "@/lib/knowledge/storage/r2";
import { ingestLimits } from "@/lib/knowledge/types";

/**
 * Upload a file snapshot to R2/S3. Returns objectKey for object_storage / generic_url sources.
 * Postgres will store only the object key — never the full file body.
 */
export async function POST(req: Request) {
  const user = await getAppUser();
  if (!user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  if (!isObjectStorageConfigured()) {
    return Response.json(
      {
        error:
          "Object storage not configured. Set R2_* or S3_* env vars (see .env.example).",
      },
      { status: 503 },
    );
  }

  const form = await req.formData();
  const file = form.get("file");
  const knowledgePackId = String(form.get("knowledgePackId") || "");
  if (!(file instanceof File)) {
    return Response.json({ error: "file required" }, { status: 400 });
  }
  if (!knowledgePackId) {
    return Response.json({ error: "knowledgePackId required" }, { status: 400 });
  }

  const pack = await prisma.knowledgePack.findFirst({
    where: { id: knowledgePackId, userId: user.id },
    select: { id: true },
  });
  if (!pack) {
    return Response.json({ error: "Pack not found" }, { status: 404 });
  }

  if (file.size > ingestLimits.maxDocumentBytes) {
    return Response.json(
      { error: `File exceeds ${ingestLimits.maxDocumentBytes} bytes` },
      { status: 400 },
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const objectKey = buildUploadKey({
    userId: user.id,
    knowledgePackId,
    filename: file.name || "upload.bin",
  });

  try {
    await putObject({
      key: objectKey,
      body: buffer,
      contentType: file.type || "application/octet-stream",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    return Response.json({ error: message }, { status: 500 });
  }

  return Response.json({
    objectKey,
    contentType: file.type || "application/octet-stream",
    originalFilename: file.name,
    size: file.size,
  });
}
