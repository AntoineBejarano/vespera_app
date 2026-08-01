import type { SourceAdapter } from "@/lib/knowledge/adapters/types";
import { AdapterError } from "@/lib/knowledge/adapters/types";
import { reproducibleChecksum, sha256Hex } from "@/lib/knowledge/checksum";
import { normalizeDocumentText } from "@/lib/knowledge/normalize";
import {
  huggingfaceConfigSchema,
  ingestLimits,
  type HuggingFaceConfig,
  type NormalizedDocument,
} from "@/lib/knowledge/types";

type HfRow = Record<string, unknown>;

function hfHeaders() {
  const token = process.env.HUGGINGFACE_TOKEN || process.env.HF_TOKEN;
  const headers: Record<string, string> = {
    Accept: "application/json",
    "User-Agent": "VespererKnowledgeBot/1.0 (+https://vesperer.com)",
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

function matchesFilters(row: HfRow, filters?: HuggingFaceConfig["filters"]) {
  if (!filters) return true;
  return Object.entries(filters).every(([key, value]) => row[key] === value);
}

function rowToDocument(
  row: HfRow,
  index: number,
  config: HuggingFaceConfig,
): NormalizedDocument | null {
  if (!matchesFilters(row, config.filters)) return null;
  const textVal = row[config.textColumn];
  if (typeof textVal !== "string" || !textVal.trim()) return null;
  const titleVal = config.titleColumn ? row[config.titleColumn] : undefined;
  const title =
    typeof titleVal === "string" && titleVal.trim()
      ? titleVal
      : `${config.datasetId}#${index + 1}`;
  const meta: Record<string, unknown> = {};
  for (const col of config.metadataColumns) {
    if (col in row) meta[col] = row[col];
  }
  return {
    externalId: `${config.datasetId}:${config.split}:${index}`,
    title,
    text: normalizeDocumentText(textVal),
    work: typeof titleVal === "string" ? titleVal : undefined,
    author: typeof row.author === "string" ? row.author : undefined,
    language: typeof row.language === "string" ? row.language : undefined,
    sourceType: "dataset_row",
    canonicalUrl: `https://huggingface.co/datasets/${config.datasetId}`,
    license: typeof row.license === "string" ? row.license : undefined,
    metadata: meta,
  };
}

/**
 * Uses the public datasets-server rows API (official, no HTML scraping).
 * Supports offset cursor for batched / resumable ingest.
 */
type HfRowHit = { row: HfRow; row_idx: number };

async function fetchRowsPage(
  config: HuggingFaceConfig,
  offset: number,
  length: number,
  signal?: AbortSignal,
): Promise<{ rows: HfRowHit[]; numRowsTotal: number; revision?: string }> {
  const params = new URLSearchParams({
    dataset: config.datasetId,
    split: config.split,
    offset: String(offset),
    length: String(length),
  });
  if (config.config) params.set("config", config.config);
  if (config.revision) params.set("revision", config.revision);

  const url = `https://datasets-server.huggingface.co/rows?${params}`;
  const res = await fetch(url, { headers: hfHeaders(), signal });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new AdapterError(
      `Hugging Face rows API error (${res.status}): ${body.slice(0, 240)}`,
      res.status >= 500 || res.status === 429,
      "hf_rows_failed",
    );
  }
  const data = (await res.json()) as {
    rows?: HfRowHit[];
    num_rows_total?: number;
    pending?: boolean;
  };
  if (data.pending) {
    throw new AdapterError(
      "Hugging Face dataset is still processing on datasets-server. Retry later.",
      true,
      "hf_pending",
    );
  }
  return {
    rows: data.rows ?? [],
    numRowsTotal: data.num_rows_total ?? 0,
  };
}

async function fetchDatasetInfo(config: HuggingFaceConfig, signal?: AbortSignal) {
  const params = new URLSearchParams({ dataset: config.datasetId });
  const url = `https://datasets-server.huggingface.co/info?${params}`;
  const res = await fetch(url, { headers: hfHeaders(), signal });
  if (!res.ok) return null;
  return (await res.json()) as {
    dataset_info?: Record<
      string,
      { description?: string; license?: string; splits?: Record<string, { num_examples?: number }> }
    >;
    partial?: boolean;
  };
}

export const huggingfaceAdapter: SourceAdapter<HuggingFaceConfig> = {
  provider: "huggingface",

  validateConfig(config) {
    const parsed = huggingfaceConfigSchema.safeParse(config);
    if (!parsed.success) {
      throw new AdapterError(parsed.error.message, false, "invalid_config");
    }
    return parsed.data;
  },

  async inspect(config, ctx) {
    const info = await fetchDatasetInfo(config, ctx.signal);
    const cfgName = config.config ?? Object.keys(info?.dataset_info ?? {})[0];
    const cfgInfo = cfgName ? info?.dataset_info?.[cfgName] : undefined;
    const page = await fetchRowsPage(config, 0, 5, ctx.signal);
    const sampleTitles = page.rows
      .map((r) => rowToDocument(r.row, r.row_idx, config))
      .filter(Boolean)
      .map((d) => d!.title)
      .slice(0, 5);
    const revision = config.revision || "main";
    const checksum = reproducibleChecksum([
      config.datasetId,
      config.config ?? "",
      config.split,
      revision,
      config.textColumn,
      JSON.stringify(config.filters ?? {}),
      page.numRowsTotal,
    ]);
    return {
      externalId: config.datasetId,
      canonicalUrl: `https://huggingface.co/datasets/${config.datasetId}`,
      datasetRevision: revision,
      checksum,
      license: cfgInfo?.license || "see dataset card",
      language: "und",
      documentCount: Math.min(
        config.limit ?? page.numRowsTotal,
        page.numRowsTotal || config.limit || 0,
      ),
      sampleTitles,
      provenance: {
        license: cfgInfo?.license,
        attribution: config.datasetId,
        publisher: "Hugging Face",
        homepage: `https://huggingface.co/datasets/${config.datasetId}`,
        notes: "Fetched via datasets-server API. Respect the dataset license.",
      },
    };
  },

  async fetchDocuments(config, ctx) {
    const cursor = (ctx.cursor as { offset?: number } | undefined) ?? {};
    const offset = cursor.offset ?? 0;
    const limit = config.limit ?? ingestLimits.maxDocumentsPerSource;
    const pageSize = Math.min(ingestLimits.fetchBatchSize, limit - offset);
    if (pageSize <= 0) {
      return { documents: [], done: true };
    }

    const page = await fetchRowsPage(config, offset, pageSize, ctx.signal);
    const documents: NormalizedDocument[] = [];
    for (const item of page.rows) {
      const doc = rowToDocument(item.row, item.row_idx, config);
      if (doc) documents.push(doc);
    }

    const nextOffset = offset + page.rows.length;
    const hitLimit = nextOffset >= limit;
    const exhausted =
      page.rows.length === 0 ||
      (page.numRowsTotal > 0 && nextOffset >= page.numRowsTotal);
    const done = hitLimit || exhausted;
    const revision = config.revision || "main";

    return {
      documents,
      nextCursor: done ? undefined : { offset: nextOffset },
      done,
      datasetRevision: revision,
      checksum: sha256Hex(
        `${config.datasetId}|${revision}|${offset}|${documents.length}`,
      ),
    };
  },
};
