import type { SourceAdapter } from "@/lib/knowledge/adapters/types";
import { AdapterError } from "@/lib/knowledge/adapters/types";
import { reproducibleChecksum } from "@/lib/knowledge/checksum";
import {
  normalizeDocumentText,
  splitSections,
  stripHtml,
} from "@/lib/knowledge/normalize";
import {
  mediawikiConfigSchema,
  type MediawikiConfig,
  type NormalizedDocument,
} from "@/lib/knowledge/types";

function apiBase(host: string) {
  const cleaned = host.replace(/^https?:\/\//, "").replace(/\/$/, "");
  return `https://${cleaned}/w/api.php`;
}

async function mwGet(
  host: string,
  params: Record<string, string>,
  signal?: AbortSignal,
) {
  const url = new URL(apiBase(host));
  url.searchParams.set("format", "json");
  url.searchParams.set("origin", "*");
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url, {
    signal,
    headers: {
      "User-Agent": "VespererKnowledgeBot/1.0 (+https://vesperer.com)",
      Accept: "application/json",
    },
  });
  if (!res.ok) {
    throw new AdapterError(
      `MediaWiki API error (${res.status})`,
      res.status >= 500,
      "mediawiki_api_failed",
    );
  }
  return res.json();
}

function pageUrl(host: string, title: string) {
  const cleaned = host.replace(/^https?:\/\//, "").replace(/\/$/, "");
  return `https://${cleaned}/wiki/${encodeURIComponent(title.replace(/ /g, "_"))}`;
}

async function fetchPage(
  config: MediawikiConfig,
  title: string,
  signal?: AbortSignal,
): Promise<{
  title: string;
  text: string;
  revid?: number;
  canonicalUrl: string;
}> {
  const data = await mwGet(
    config.host,
    {
      action: "parse",
      page: title,
      prop: "text|revid|displaytitle",
      disabletoc: "1",
    },
    signal,
  );
  if (data?.error) {
    throw new AdapterError(
      `MediaWiki: ${data.error.info || data.error.code}`,
      false,
      "mediawiki_page_error",
    );
  }
  const html = String(data?.parse?.text?.["*"] ?? "");
  const text = normalizeDocumentText(stripHtml(html));
  return {
    title: String(data?.parse?.title ?? title),
    text,
    revid: data?.parse?.revid,
    canonicalUrl: pageUrl(config.host, title),
  };
}

async function listSubpages(config: MediawikiConfig, signal?: AbortSignal) {
  const data = await mwGet(
    config.host,
    {
      action: "query",
      list: "allpages",
      apprefix: `${config.pageTitle}/`,
      aplimit: "50",
    },
    signal,
  );
  const pages = (data?.query?.allpages ?? []) as Array<{ title: string }>;
  return pages.map((p) => p.title);
}

export const mediawikiAdapter: SourceAdapter<MediawikiConfig> = {
  provider: "mediawiki",

  validateConfig(config) {
    const parsed = mediawikiConfigSchema.safeParse(config);
    if (!parsed.success) {
      throw new AdapterError(parsed.error.message, false, "invalid_config");
    }
    return parsed.data;
  },

  async inspect(config, ctx) {
    const main = await fetchPage(config, config.pageTitle, ctx.signal);
    let titles = [main.title];
    if (config.includeSubpages) {
      const subs = await listSubpages(config, ctx.signal);
      titles = [main.title, ...subs];
    }
    const revision = String(main.revid ?? "unknown");
    const checksum = reproducibleChecksum([
      config.host,
      config.pageTitle,
      revision,
      config.includeSubpages ? "sub" : "nosub",
      titles.length,
    ]);
    const isWikisource = /wikisource/i.test(config.host);
    return {
      externalId: `${config.host}:${config.pageTitle}`,
      canonicalUrl: main.canonicalUrl,
      datasetRevision: revision,
      checksum,
      license: isWikisource
        ? "Typically CC BY-SA / public domain — verify per page"
        : "MediaWiki site license — verify per page",
      language: config.language || "und",
      documentCount: titles.length,
      sampleTitles: titles.slice(0, 8),
      provenance: {
        license: isWikisource ? "CC BY-SA / PD (verify)" : "see wiki license",
        attribution: `${main.title} — ${config.host}`,
        publisher: config.host,
        homepage: main.canonicalUrl,
        termsUrl: `https://${config.host.replace(/^https?:\/\//, "")}/wiki/Special:Version`,
        notes: "Fetched via MediaWiki Action API (parse/query). Titles, sections and original URLs preserved.",
      },
    };
  },

  async fetchDocuments(config, ctx) {
    const cursor = (ctx.cursor as { titles?: string[]; index?: number } | undefined) ?? {};
    let titles = cursor.titles;
    if (!titles) {
      titles = [config.pageTitle];
      if (config.includeSubpages) {
        titles = [config.pageTitle, ...(await listSubpages(config, ctx.signal))];
      }
    }
    const index = cursor.index ?? 0;
    if (index >= titles.length) {
      return { documents: [], done: true };
    }

    const title = titles[index]!;
    const page = await fetchPage(config, title, ctx.signal);
    const sections = splitSections(page.text);
    const documents: NormalizedDocument[] = sections.map((sec, i) => ({
      externalId: `${title}#${sec.section || i}`,
      title: page.title,
      text: sec.text,
      work: page.title,
      section: sec.section,
      language: config.language,
      sourceType: /wikisource/i.test(config.host) ? "book" : "article",
      canonicalUrl: page.canonicalUrl,
      license: /wikisource/i.test(config.host)
        ? "CC BY-SA / public domain (verify)"
        : "MediaWiki site license",
    }));

    const nextIndex = index + 1;
    const done = nextIndex >= titles.length;
    return {
      documents,
      nextCursor: done ? undefined : { titles, index: nextIndex },
      done,
      datasetRevision: String(page.revid ?? "unknown"),
      checksum: reproducibleChecksum([
        config.host,
        title,
        page.revid,
        documents.length,
      ]),
    };
  },
};
