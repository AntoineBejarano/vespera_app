import { normalizeDocumentText, stripHtml } from "@/lib/knowledge/normalize";
import { AdapterError } from "@/lib/knowledge/adapters/types";
import type { NormalizedDocument } from "@/lib/knowledge/types";

export type ParseFormat =
  | "auto"
  | "html"
  | "pdf"
  | "txt"
  | "markdown"
  | "json"
  | "jsonl"
  | "csv"
  | "epub";

function detectFormat(urlOrName: string, contentType?: string): ParseFormat {
  const ct = (contentType ?? "").toLowerCase();
  const path = urlOrName.toLowerCase().split("?")[0] ?? "";
  if (ct.includes("pdf") || path.endsWith(".pdf")) return "pdf";
  if (ct.includes("epub") || path.endsWith(".epub")) return "epub";
  if (ct.includes("jsonl") || path.endsWith(".jsonl") || path.endsWith(".ndjson"))
    return "jsonl";
  if (ct.includes("json") || path.endsWith(".json")) return "json";
  if (ct.includes("csv") || path.endsWith(".csv")) return "csv";
  if (
    ct.includes("markdown") ||
    path.endsWith(".md") ||
    path.endsWith(".markdown")
  )
    return "markdown";
  if (ct.includes("html") || path.endsWith(".html") || path.endsWith(".htm"))
    return "html";
  return "txt";
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]!;
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i++;
        } else inQuotes = false;
      } else cell += ch;
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
      continue;
    }
    if (ch === ",") {
      row.push(cell);
      cell = "";
      continue;
    }
    if (ch === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
      continue;
    }
    if (ch === "\r") continue;
    cell += ch;
  }
  if (cell.length || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

function pickString(obj: Record<string, unknown>, key?: string): string | undefined {
  if (!key) return undefined;
  const v = obj[key];
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  return undefined;
}

/** Minimal EPUB: unzip via native DecompressionStream is not enough for ZIP.
 *  We extract plain text from .xhtml/.html/.txt entries when buffer is a ZIP. */
async function parseEpub(buffer: Buffer): Promise<string> {
  // Look for uncompressed stored entries is fragile; prefer UTF-8 text fallback
  // when the file is actually HTML/text mislabeled.
  const asText = buffer.toString("utf8");
  if (asText.includes("<html") || asText.includes("<?xml")) {
    return normalizeDocumentText(asText, { html: true });
  }
  // Best-effort: extract readable ASCII/UTF-8 runs from the binary ZIP
  const readable = asText
    .replace(/[^\x09\x0A\x0D\x20-\x7E\u00A0-\u024F]+/g, "\n")
    .replace(/\n{3,}/g, "\n\n");
  const cleaned = normalizeDocumentText(readable);
  if (cleaned.length < 80) {
    throw new AdapterError(
      "EPUB parsing requires a text/HTML export or pre-extracted content. Upload TXT/MD/HTML instead.",
      false,
      "epub_unsupported",
    );
  }
  return cleaned;
}

async function parsePdf(buffer: Buffer): Promise<string> {
  // Avoid heavy native deps: if the "PDF" is actually text, use it; else clear error.
  const head = buffer.slice(0, 8).toString("utf8");
  if (!head.startsWith("%PDF")) {
    return normalizeDocumentText(buffer.toString("utf8"));
  }
  // Extract text streams heuristically (works for simple text PDFs)
  const raw = buffer.toString("latin1");
  const chunks: string[] = [];
  const re = /stream\r?\n([\s\S]*?)endstream/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(raw))) {
    const body = m[1] ?? "";
    // Decode simple uncompressed streams with parentheses strings
    const strings = [...body.matchAll(/\((?:\\.|[^\\)])*\)/g)].map((x) =>
      x[0]
        .slice(1, -1)
        .replace(/\\n/g, "\n")
        .replace(/\\r/g, "")
        .replace(/\\t/g, "\t")
        .replace(/\\\(/g, "(")
        .replace(/\\\)/g, ")")
        .replace(/\\\\/g, "\\"),
    );
    if (strings.length) chunks.push(strings.join(" "));
  }
  const text = normalizeDocumentText(chunks.join("\n\n"));
  if (text.length < 40) {
    throw new AdapterError(
      "Could not extract text from this PDF. Prefer TXT, Markdown, HTML, or a text-based PDF.",
      false,
      "pdf_unreadable",
    );
  }
  return text;
}

export async function parseContentToDocuments(params: {
  buffer: Buffer;
  filenameOrUrl: string;
  contentType?: string;
  format?: ParseFormat;
  textColumn?: string;
  titleColumn?: string;
  defaultTitle?: string;
  canonicalUrl?: string;
}): Promise<NormalizedDocument[]> {
  const format =
    params.format && params.format !== "auto"
      ? params.format
      : detectFormat(params.filenameOrUrl, params.contentType);

  const titleBase =
    params.defaultTitle ??
    params.filenameOrUrl.split("/").pop()?.split("?")[0] ??
    "document";

  if (format === "pdf") {
    const text = await parsePdf(params.buffer);
    return [
      {
        externalId: titleBase,
        title: titleBase,
        text,
        canonicalUrl: params.canonicalUrl,
        sourceType: "file",
      },
    ];
  }

  if (format === "epub") {
    const text = await parseEpub(params.buffer);
    return [
      {
        externalId: titleBase,
        title: titleBase,
        text,
        canonicalUrl: params.canonicalUrl,
        sourceType: "book",
      },
    ];
  }

  const raw = params.buffer.toString("utf8");

  if (format === "html") {
    const text = normalizeDocumentText(raw, { html: true });
    const titleMatch = raw.match(/<title[^>]*>([^<]+)<\/title>/i);
    return [
      {
        externalId: titleBase,
        title: titleMatch?.[1]?.trim() || titleBase,
        text,
        canonicalUrl: params.canonicalUrl,
        sourceType: "webpage",
      },
    ];
  }

  if (format === "markdown" || format === "txt") {
    return [
      {
        externalId: titleBase,
        title: titleBase,
        text: normalizeDocumentText(raw),
        canonicalUrl: params.canonicalUrl,
        sourceType: format === "markdown" ? "article" : "file",
      },
    ];
  }

  if (format === "jsonl") {
    const docs: NormalizedDocument[] = [];
    const lines = raw.split("\n").filter((l) => l.trim());
    for (let i = 0; i < lines.length; i++) {
      let parsed: unknown;
      try {
        parsed = JSON.parse(lines[i]!);
      } catch {
        continue;
      }
      const rec = asRecord(parsed);
      if (!rec) continue;
      const text =
        pickString(rec, params.textColumn) ??
        pickString(rec, "text") ??
        pickString(rec, "content") ??
        JSON.stringify(rec);
      const title =
        pickString(rec, params.titleColumn) ??
        pickString(rec, "title") ??
        `${titleBase}#${i + 1}`;
      docs.push({
        externalId: `${titleBase}:${i}`,
        title,
        text: normalizeDocumentText(text),
        canonicalUrl: params.canonicalUrl,
        sourceType: "dataset_row",
        metadata: rec,
      });
    }
    return docs;
  }

  if (format === "json") {
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new AdapterError("Invalid JSON", false, "invalid_json");
    }
    const rows = Array.isArray(parsed) ? parsed : [parsed];
    return rows.flatMap((row, i) => {
      const rec = asRecord(row);
      if (!rec) {
        return [
          {
            externalId: `${titleBase}:${i}`,
            title: `${titleBase}#${i + 1}`,
            text: normalizeDocumentText(String(row)),
            canonicalUrl: params.canonicalUrl,
            sourceType: "dataset_row" as const,
          },
        ];
      }
      const text =
        pickString(rec, params.textColumn) ??
        pickString(rec, "text") ??
        pickString(rec, "content") ??
        JSON.stringify(rec, null, 2);
      const title =
        pickString(rec, params.titleColumn) ??
        pickString(rec, "title") ??
        `${titleBase}#${i + 1}`;
      return [
        {
          externalId: `${titleBase}:${i}`,
          title,
          text: normalizeDocumentText(text),
          canonicalUrl: params.canonicalUrl,
          sourceType: "dataset_row" as const,
          metadata: rec,
        },
      ];
    });
  }

  if (format === "csv") {
    const rows = parseCsv(raw);
    if (rows.length < 2) {
      return [
        {
          externalId: titleBase,
          title: titleBase,
          text: normalizeDocumentText(raw),
          canonicalUrl: params.canonicalUrl,
          sourceType: "file",
        },
      ];
    }
    const headers = rows[0]!.map((h) => h.trim());
    const textCol =
      params.textColumn && headers.includes(params.textColumn)
        ? params.textColumn
        : headers.find((h) => /text|content|body/i.test(h)) ?? headers[headers.length - 1]!;
    const titleCol =
      params.titleColumn && headers.includes(params.titleColumn)
        ? params.titleColumn
        : headers.find((h) => /title|name/i.test(h));
    const textIdx = headers.indexOf(textCol);
    const titleIdx = titleCol ? headers.indexOf(titleCol) : -1;
    return rows.slice(1).map((cells, i) => ({
      externalId: `${titleBase}:${i}`,
      title: (titleIdx >= 0 ? cells[titleIdx] : undefined) || `${titleBase}#${i + 1}`,
      text: normalizeDocumentText(cells[textIdx] ?? cells.join(" ")),
      canonicalUrl: params.canonicalUrl,
      sourceType: "dataset_row" as const,
    }));
  }

  return [
    {
      externalId: titleBase,
      title: titleBase,
      text: normalizeDocumentText(stripHtml(raw)),
      canonicalUrl: params.canonicalUrl,
      sourceType: "file",
    },
  ];
}
