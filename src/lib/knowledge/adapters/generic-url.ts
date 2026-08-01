import { createHash } from "node:crypto";
import type { SourceAdapter } from "@/lib/knowledge/adapters/types";
import { AdapterError } from "@/lib/knowledge/adapters/types";
import { reproducibleChecksum } from "@/lib/knowledge/checksum";
import { parseContentToDocuments } from "@/lib/knowledge/parse";
import { getObject } from "@/lib/knowledge/storage/r2";
import {
  genericUrlConfigSchema,
  ingestLimits,
  type GenericUrlConfig,
} from "@/lib/knowledge/types";

async function loadBytes(config: GenericUrlConfig, signal?: AbortSignal) {
  if (config.objectKey) {
    const obj = await getObject(config.objectKey);
    return {
      buffer: obj.body,
      contentType: obj.contentType,
      url: `object://${config.objectKey}`,
    };
  }
  if (!config.url) {
    throw new AdapterError("url or objectKey required", false, "invalid_config");
  }
  const res = await fetch(config.url, {
    signal,
    headers: { "User-Agent": "VespererKnowledgeBot/1.0 (+https://vesperer.com)" },
    redirect: "follow",
  });
  if (!res.ok) {
    throw new AdapterError(
      `Failed to fetch URL (${res.status})`,
      res.status >= 500,
      "fetch_failed",
    );
  }
  const ab = await res.arrayBuffer();
  if (ab.byteLength > ingestLimits.maxDocumentBytes) {
    throw new AdapterError(
      `Document exceeds size limit (${ingestLimits.maxDocumentBytes} bytes)`,
      false,
      "too_large",
    );
  }
  return {
    buffer: Buffer.from(ab),
    contentType: res.headers.get("content-type") ?? undefined,
    url: config.url,
  };
}

export const genericUrlAdapter: SourceAdapter<GenericUrlConfig> = {
  provider: "generic_url",

  validateConfig(config) {
    const parsed = genericUrlConfigSchema.safeParse(config);
    if (!parsed.success) {
      throw new AdapterError(parsed.error.message, false, "invalid_config");
    }
    if (!parsed.data.url && !parsed.data.objectKey) {
      throw new AdapterError("url or objectKey required", false, "invalid_config");
    }
    return parsed.data;
  },

  async inspect(config, ctx) {
    const { buffer, contentType, url } = await loadBytes(config, ctx.signal);
    const checksum = createHash("sha256").update(buffer).digest("hex");
    const docs = await parseContentToDocuments({
      buffer,
      filenameOrUrl: url,
      contentType,
      format: config.format,
      textColumn: config.textColumn,
      titleColumn: config.titleColumn,
      canonicalUrl: config.url,
    });
    return {
      externalId: config.url || config.objectKey || checksum.slice(0, 16),
      canonicalUrl: config.url,
      datasetRevision: checksum.slice(0, 16),
      checksum: reproducibleChecksum([checksum, config.format, docs.length]),
      license: "unknown — verify rights before commercial use",
      language: "und",
      documentCount: docs.length,
      sampleTitles: docs.slice(0, 5).map((d) => d.title),
      provenance: {
        license: "unknown",
        attribution: config.url || config.objectKey,
        notes: "Generic URL/file source. Caller must ensure redistribution rights.",
        homepage: config.url,
      },
    };
  },

  async fetchDocuments(config, ctx) {
    const { buffer, contentType, url } = await loadBytes(config, ctx.signal);
    const checksum = createHash("sha256").update(buffer).digest("hex");
    const documents = await parseContentToDocuments({
      buffer,
      filenameOrUrl: url,
      contentType,
      format: config.format,
      textColumn: config.textColumn,
      titleColumn: config.titleColumn,
      canonicalUrl: config.url,
    });
    return {
      documents,
      done: true,
      datasetRevision: checksum.slice(0, 16),
      checksum: reproducibleChecksum([checksum, config.format, documents.length]),
    };
  },
};
