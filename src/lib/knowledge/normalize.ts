/**
 * Lightweight text normalization for ingest — strip boilerplate, collapse whitespace.
 * Does not call remote sources; operates on already-fetched content.
 */

const GUTENBERG_START =
  /\*\*\*\s*START OF (THIS|THE) PROJECT GUTENBERG EBOOK[\s\S]*?\*\*\*/i;
const GUTENBERG_END =
  /\*\*\*\s*END OF (THIS|THE) PROJECT GUTENBERG EBOOK[\s\S]*$/i;

export function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/(div|h[1-6]|li|tr)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&[a-z]+;/gi, " ");
}

export function stripGutenbergBoilerplate(text: string): string {
  let out = text;
  const start = out.search(GUTENBERG_START);
  if (start >= 0) {
    const match = out.match(GUTENBERG_START);
    if (match) out = out.slice(start + match[0].length);
  }
  const end = out.search(GUTENBERG_END);
  if (end >= 0) out = out.slice(0, end);
  return out;
}

export function normalizeWhitespace(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\t/g, " ")
    .replace(/[ \u00a0]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function normalizeDocumentText(
  text: string,
  opts?: { html?: boolean; gutenberg?: boolean },
): string {
  let out = text;
  if (opts?.html) out = stripHtml(out);
  if (opts?.gutenberg) out = stripGutenbergBoilerplate(out);
  return normalizeWhitespace(out);
}

/** Split MediaWiki / markdown-ish text into titled sections when possible. */
export function splitSections(
  text: string,
): Array<{ section: string; text: string }> {
  const lines = text.split("\n");
  const sections: Array<{ section: string; text: string }> = [];
  let current = "body";
  let buf: string[] = [];

  const flush = () => {
    const body = normalizeWhitespace(buf.join("\n"));
    if (body) sections.push({ section: current, text: body });
    buf = [];
  };

  for (const line of lines) {
    const md = line.match(/^#{1,3}\s+(.+)$/);
    const wiki = line.match(/^=+\s*(.+?)\s*=+$/);
    const heading = md?.[1] ?? wiki?.[1];
    if (heading) {
      flush();
      current = heading.trim();
      continue;
    }
    buf.push(line);
  }
  flush();

  if (!sections.length && text.trim()) {
    return [{ section: "body", text: normalizeWhitespace(text) }];
  }
  return sections;
}
