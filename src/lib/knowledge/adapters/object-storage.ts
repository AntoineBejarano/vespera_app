import { createHash } from "node:crypto";
import type { SourceAdapter } from "@/lib/knowledge/adapters/types";
import { AdapterError } from "@/lib/knowledge/adapters/types";
import { reproducibleChecksum } from "@/lib/knowledge/checksum";
import { parseContentToDocuments } from "@/lib/knowledge/parse";
import { getObject, isObjectStorageConfigured } from "@/lib/knowledge/storage/r2";
import {
  objectStorageConfigSchema,
  type ObjectStorageConfig,
} from "@/lib/knowledge/types";

export const objectStorageAdapter: SourceAdapter<ObjectStorageConfig> = {
  provider: "object_storage",

  validateConfig(config) {
    const parsed = objectStorageConfigSchema.safeParse(config);
    if (!parsed.success) {
      throw new AdapterError(parsed.error.message, false, "invalid_config");
    }
    if (!isObjectStorageConfigured()) {
      throw new AdapterError(
        "Object storage is not configured (R2_/S3_ env vars).",
        false,
        "storage_unconfigured",
      );
    }
    return parsed.data;
  },

  async inspect(config) {
    const obj = await getObject(config.objectKey);
    const checksum = createHash("sha256").update(obj.body).digest("hex");
    const docs = await parseContentToDocuments({
      buffer: obj.body,
      filenameOrUrl: config.originalFilename || config.objectKey,
      contentType: config.contentType || obj.contentType,
      format: config.format,
    });
    return {
      externalId: config.objectKey,
      canonicalUrl: `object://${config.objectKey}`,
      datasetRevision: checksum.slice(0, 16),
      checksum: reproducibleChecksum([config.objectKey, checksum]),
      license: "user-uploaded — rights held by uploader",
      language: "und",
      documentCount: docs.length,
      sampleTitles: docs.slice(0, 5).map((d) => d.title),
      provenance: {
        license: "user-uploaded",
        attribution: config.originalFilename || config.objectKey,
        notes:
          "Original file snapshotted in object storage. Postgres stores objectKey only.",
      },
    };
  },

  async fetchDocuments(config) {
    const obj = await getObject(config.objectKey);
    const checksum = createHash("sha256").update(obj.body).digest("hex");
    const documents = await parseContentToDocuments({
      buffer: obj.body,
      filenameOrUrl: config.originalFilename || config.objectKey,
      contentType: config.contentType || obj.contentType,
      format: config.format,
    });
    return {
      documents,
      done: true,
      datasetRevision: checksum.slice(0, 16),
      checksum: reproducibleChecksum([config.objectKey, checksum]),
    };
  },
};
