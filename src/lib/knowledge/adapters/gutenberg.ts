import { createHash } from "node:crypto";
import type { SourceAdapter } from "@/lib/knowledge/adapters/types";
import { AdapterError } from "@/lib/knowledge/adapters/types";
import { reproducibleChecksum } from "@/lib/knowledge/checksum";
import { normalizeDocumentText } from "@/lib/knowledge/normalize";
import {
  gutenbergConfigSchema,
  ingestLimits,
  type GutenbergConfig,
} from "@/lib/knowledge/types";

/**
 * Project Gutenberg — official download URLs only (no search-page scraping).
 * Prefer files.gutenberg.org / standard ebook paths.
 * @see https://www.gutenberg.org/policy/robot_access.html
 */

function ebookId(config: GutenbergConfig) {
  return String(config.ebookId).replace(/[^\d]/g, "");
}

/** Official plain-text / HTML candidates (tried in order). */
function candidateUrls(id: string, format: "txt" | "html") {
  if (format === "html") {
    return [
      `https://www.gutenberg.org/files/${id}/${id}-h/${id}-h.htm`,
      `https://www.gutenberg.org/files/${id}/${id}-h.htm`,
      `https://www.gutenberg.org/cache/epub/${id}/pg${id}.html`,
    ];
  }
  return [
    `https://www.gutenberg.org/ebooks/${id}.txt.utf-8`,
    `https://www.gutenberg.org/files/${id}/${id}-0.txt`,
    `https://www.gutenberg.org/files/${id}/${id}.txt`,
    `https://www.gutenberg.org/cache/epub/${id}/pg${id}.txt`,
  ];
}

async function downloadEbook(config: GutenbergConfig, signal?: AbortSignal) {
  const id = ebookId(config);
  if (!id) {
    throw new AdapterError("Invalid Gutenberg ebook ID", false, "invalid_ebook_id");
  }
  const urls = candidateUrls(id, config.format);
  let lastStatus = 0;
  for (const url of urls) {
    const res = await fetch(url, {
      signal,
      headers: {
        "User-Agent": "VespererKnowledgeBot/1.0 (+https://vesperer.com; research ingest)",
      },
      redirect: "follow",
    });
    lastStatus = res.status;
    if (!res.ok) continue;
    const ab = await res.arrayBuffer();
    if (ab.byteLength > ingestLimits.maxDocumentBytes) {
      throw new AdapterError("Gutenberg file exceeds size limit", false, "too_large");
    }
    return {
      id,
      url: res.url || url,
      buffer: Buffer.from(ab),
      contentType: res.headers.get("content-type") ?? undefined,
    };
  }
  throw new AdapterError(
    `Could not download Gutenberg ebook ${id} (last HTTP ${lastStatus}). Use a valid ebook ID.`,
    lastStatus >= 500,
    "gutenberg_download_failed",
  );
}

async function fetchCatalogMeta(id: string, signal?: AbortSignal) {
  // Official RDF catalog entry (machine-readable, not HTML search scrape)
  const url = `https://www.gutenberg.org/ebooks/${id}.rdf`;
  const res = await fetch(url, {
    signal,
    headers: {
      "User-Agent": "VespererKnowledgeBot/1.0 (+https://vesperer.com)",
      Accept: "application/rdf+xml, application/xml, text/xml",
    },
  });
  if (!res.ok) return null;
  const rdf = await res.text();
  const title =
    rdf.match(/<dcterms:title[^>]*>([^<]+)<\/dcterms:title>/i)?.[1] ??
    rdf.match(/<dc:title[^>]*>([^<]+)<\/dc:title>/i)?.[1];
  const creator =
    rdf.match(/<pgterms:name>([^<]+)<\/pgterms:name>/i)?.[1] ??
    rdf.match(/<dcterms:creator[\s\S]*?<pgterms:agent[\s\S]*?<pgterms:name>([^<]+)/i)?.[1];
  const language =
    rdf.match(/<dcterms:language[\s\S]*?<rdf:value[^>]*>([^<]+)/i)?.[1];
  const rights =
    rdf.match(/<dcterms:rights[^>]*>([^<]+)<\/dcterms:rights>/i)?.[1] ??
    "Public domain in the USA (Project Gutenberg)";
  return {
    title: title?.trim(),
    creator: creator?.trim(),
    language: language?.trim(),
    rights: rights?.trim(),
  };
}

export const gutenbergAdapter: SourceAdapter<GutenbergConfig> = {
  provider: "gutenberg",

  validateConfig(config) {
    const parsed = gutenbergConfigSchema.safeParse(config);
    if (!parsed.success) {
      throw new AdapterError(parsed.error.message, false, "invalid_config");
    }
    return parsed.data;
  },

  async inspect(config, ctx) {
    const id = ebookId(config);
    const meta = await fetchCatalogMeta(id, ctx.signal);
    const file = await downloadEbook(config, ctx.signal);
    const checksum = createHash("sha256").update(file.buffer).digest("hex");
    return {
      externalId: id,
      canonicalUrl: `https://www.gutenberg.org/ebooks/${id}`,
      datasetRevision: checksum.slice(0, 16),
      checksum: reproducibleChecksum([id, config.format, checksum]),
      license: meta?.rights || "Project Gutenberg license / public domain (verify jurisdiction)",
      language: config.language || meta?.language || "en",
      documentCount: 1,
      sampleTitles: [meta?.title || `Gutenberg #${id}`],
      provenance: {
        license: meta?.rights,
        attribution: meta?.creator
          ? `${meta.creator}; Project Gutenberg`
          : "Project Gutenberg",
        publisher: "Project Gutenberg",
        homepage: `https://www.gutenberg.org/ebooks/${id}`,
        termsUrl: "https://www.gutenberg.org/policy/license.html",
        notes: "Downloaded via official ebook file URLs / RDF catalog — not HTML search pages.",
      },
    };
  },

  async fetchDocuments(config, ctx) {
    const id = ebookId(config);
    const meta = await fetchCatalogMeta(id, ctx.signal);
    const file = await downloadEbook(config, ctx.signal);
    const checksum = createHash("sha256").update(file.buffer).digest("hex");
    const isHtml = config.format === "html";
    const text = normalizeDocumentText(file.buffer.toString("utf8"), {
      html: isHtml,
      gutenberg: true,
    });
    return {
      documents: [
        {
          externalId: id,
          title: meta?.title || `Gutenberg ebook ${id}`,
          text,
          author: meta?.creator,
          work: meta?.title || `Gutenberg ebook ${id}`,
          language: config.language || meta?.language || "en",
          sourceType: "book",
          canonicalUrl: `https://www.gutenberg.org/ebooks/${id}`,
          license:
            meta?.rights ||
            "Project Gutenberg license / public domain (verify jurisdiction)",
        },
      ],
      done: true,
      datasetRevision: checksum.slice(0, 16),
      checksum: reproducibleChecksum([id, config.format, checksum]),
    };
  },
};
