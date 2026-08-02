/**
 * Mind graph model — Mind universes vs Agency outer ring.
 * Time is transversal metadata (updatedAt), not a universe.
 */

/** Filter universes in the neural graph UI */
export type MindUniverse =
  | "self"
  | "relationships"
  | "memory"
  | "knowledge"
  | "affect"
  | "intentions"
  | "agency";

export type MindNodeType =
  | "persona"
  | "self"
  | "layer"
  | "knowledge"
  | "belief"
  | "memory"
  | "preference"
  | "person"
  | "event"
  | "source"
  | "concept"
  | "note"
  | "tag"
  | "channel"
  | "relationship"
  | "affect"
  | "intention"
  | "capability"
  | "tool"
  | "permission"
  | "ignore";

export type MindDoc = {
  id: string;
  title: string;
  /** Raw group hint before classification */
  group?: string;
  type?: MindNodeType;
  content: string;
  sourcePath?: string;
  private?: boolean;
  confidence?: number;
  /** ISO date for recency halo (Time dimension) */
  updatedAt?: string;
  universe?: MindUniverse;
};

export type MindGraphNode = {
  id: string;
  label: string;
  type: MindNodeType;
  universe: MindUniverse;
  detail?: string;
  /** Size / importance (centrality seed) */
  val: number;
  /** 0–1 confidence → visual intensity */
  confidence: number;
  sourcePath?: string;
  private?: boolean;
  updatedAt?: string;
  provenance?: string;
};

export type MindGraphLink = {
  source: string;
  target: string;
  label?: string;
  /** Relation strength 0–1 → edge width */
  strength: number;
  /** Uncertain / inferred links render dashed */
  uncertain?: boolean;
};

export type MindGraphData = {
  nodes: MindGraphNode[];
  links: MindGraphLink[];
};

export const MIND_UNIVERSES: MindUniverse[] = [
  "self",
  "relationships",
  "memory",
  "knowledge",
  "affect",
  "intentions",
  "agency",
];

export function universeForType(type: MindNodeType): MindUniverse {
  switch (type) {
    case "persona":
    case "self":
    case "layer":
    case "preference":
      return "self";
    case "relationship":
    case "person":
      return "relationships";
    case "memory":
    case "event":
      return "memory";
    case "knowledge":
    case "belief":
    case "source":
    case "concept":
    case "note":
    case "tag":
      return "knowledge";
    case "affect":
      return "affect";
    case "intention":
      return "intentions";
    case "channel":
    case "capability":
    case "tool":
    case "permission":
      return "agency";
    default:
      return "knowledge";
  }
}

/** Brand tokens — warm / cool accents (not template cyan). */
export const NODE_TYPE_COLOR: Record<MindNodeType, string> = {
  persona: "#e8e6e3",
  self: "#5badee",
  layer: "#5badee",
  knowledge: "#e8c547",
  belief: "#c4a7e7",
  memory: "#f472b6",
  preference: "#7dd3c0",
  person: "#fb7185",
  event: "#f0a06a",
  source: "#94a3b8",
  concept: "#8b9bb4",
  note: "#9ecbff",
  tag: "#6ee7b7",
  channel: "#34d399",
  relationship: "#f43f5e",
  affect: "#f59e0b",
  intention: "#a78bfa",
  capability: "#2dd4bf",
  tool: "#38bdf8",
  permission: "#94a3b8",
  ignore: "#475569",
};

export const UNIVERSE_COLOR: Record<MindUniverse, string> = {
  self: "#5badee",
  relationships: "#f43f5e",
  memory: "#f472b6",
  knowledge: "#e8c547",
  affect: "#f59e0b",
  intentions: "#a78bfa",
  agency: "#2dd4bf",
};

const STOP = new Set([
  "the",
  "and",
  "for",
  "with",
  "that",
  "this",
  "from",
  "your",
  "you",
  "are",
  "was",
  "were",
  "have",
  "has",
  "not",
  "but",
  "they",
  "she",
  "him",
  "her",
  "his",
  "its",
  "our",
  "who",
  "what",
  "when",
  "where",
  "how",
  "why",
  "into",
  "about",
  "than",
  "then",
  "also",
  "just",
  "like",
  "will",
  "can",
  "may",
  "should",
  "would",
  "could",
  "been",
  "being",
  "their",
  "them",
  "there",
  "here",
  "over",
  "under",
  "again",
  "more",
  "most",
  "some",
  "such",
  "only",
  "other",
  "out",
  "all",
  "any",
  "each",
  "few",
  "own",
  "same",
  "too",
  "very",
  "via",
]);

export function slug(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\u00c0-\u024f]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

function cleanLine(s: string) {
  return s
    .replace(/^[-*+]\s+/, "")
    .replace(/^\d+\.\s+/, "")
    .replace(/\*\*|__/g, "")
    .replace(/`+/g, "")
    .trim();
}

export function extractWikilinks(md: string): string[] {
  const out: string[] = [];
  const re = /\[\[([^\]|#]+)(?:\|[^\]]+)?\]\]/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(md))) {
    const t = m[1].trim();
    if (t) out.push(t);
  }
  return out;
}

export function extractTags(md: string): string[] {
  const out: string[] = [];
  const re = /(^|\s)#([a-zA-Z][\w-]{1,40})/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(md))) out.push(m[2]);
  return out;
}

export function parseFrontmatter(md: string): {
  data: Record<string, string>;
  body: string;
} {
  const m = md.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!m) return { data: {}, body: md };
  const data: Record<string, string> = {};
  for (const line of m[1].split("\n")) {
    const kv = line.match(/^([A-Za-z0-9_-]+):\s*(.+)$/);
    if (kv) data[kv[1].toLowerCase()] = kv[2].replace(/^["']|["']$/g, "").trim();
  }
  return { data: data, body: m[2] };
}

function extractHeadings(md: string): string[] {
  return md
    .split("\n")
    .map((l) => l.match(/^#{1,3}\s+(.+)/)?.[1]?.trim())
    .filter((x): x is string => Boolean(x))
    .map((h) => h.replace(/^#+\s*/, ""))
    .filter(
      (h) => !["soul", "style", "rules", "context"].includes(h.toLowerCase()),
    )
    .slice(0, 12);
}

function extractKeyLines(md: string): string[] {
  const lines = md
    .split("\n")
    .map(cleanLine)
    .filter(
      (l) =>
        l.length >= 12 &&
        l.length <= 90 &&
        !l.startsWith("#") &&
        !l.startsWith("http") &&
        !/^[-|]+$/.test(l),
    );
  const scored = lines
    .map((l) => {
      const words = l
        .split(/\s+/)
        .filter((w) => w.length > 3 && !STOP.has(w.toLowerCase()));
      return { l, score: words.length };
    })
    .filter((x) => x.score >= 2)
    .sort((a, b) => b.score - a.score);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const { l } of scored) {
    const key = slug(l.slice(0, 40));
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(l);
    if (out.length >= 8) break;
  }
  return out;
}

/** Classify an Obsidian note — never assume everything is personal memory. */
export function classifyObsidianNote(input: {
  path: string;
  title: string;
  content: string;
}): {
  type: MindNodeType;
  confidence: number;
  private: boolean;
  reason: string;
} {
  const { data, body } = parseFrontmatter(input.content);
  const path = input.path.toLowerCase();
  const title = input.title.toLowerCase();
  const text = `${title}\n${body}`.toLowerCase();
  const tags = [
    ...extractTags(input.content).map((t) => t.toLowerCase()),
    ...(data.tags ?? "")
      .split(/[,\s]+/)
      .map((t) => t.replace(/^#/, "").toLowerCase())
      .filter(Boolean),
  ];
  const fmType = (data.type || data.kind || "").toLowerCase();

  if (fmType && ["knowledge", "belief", "memory", "preference", "person", "event", "source", "ignore"].includes(fmType)) {
    return {
      type: fmType as MindNodeType,
      confidence: 0.95,
      private: fmType === "memory" || data.private === "true",
      reason: `Frontmatter type: ${fmType}`,
    };
  }

  if (
    /\/(daily|journal|diary|private|personal)\//.test(path) ||
    /^(daily|journal|diary)\b/.test(title) ||
    tags.some((t) => ["journal", "daily", "diary", "private"].includes(t))
  ) {
    return {
      type: "memory",
      confidence: 0.85,
      private: true,
      reason: "Looks like a personal journal / daily note",
    };
  }

  if (
    /\/(people|persons|contacts)\//.test(path) ||
    tags.includes("person") ||
    /^@/.test(input.title)
  ) {
    return {
      type: "person",
      confidence: 0.8,
      private: false,
      reason: "Person / contact note",
    };
  }

  if (
    /\/(sources?|refs?|bibliography|clips?|web)\//.test(path) ||
    tags.some((t) => ["source", "clipping", "reference", "quote"].includes(t)) ||
    /\b(according to|quoted?|source:|via )\b/.test(text)
  ) {
    return {
      type: "source",
      confidence: 0.8,
      private: false,
      reason: "External source / clipping — not treated as personal belief",
    };
  }

  if (
    tags.some((t) => ["belief", "opinion", "values"].includes(t)) ||
    /\bi (believe|think|feel that)\b/.test(text)
  ) {
    return {
      type: "belief",
      confidence: 0.7,
      private: false,
      reason: "Expressed as belief / opinion",
    };
  }

  if (
    tags.some((t) => ["preference", "taste", "favorite"].includes(t)) ||
    /\bi (prefer|like|love|hate)\b/.test(text)
  ) {
    return {
      type: "preference",
      confidence: 0.7,
      private: false,
      reason: "Preference / taste",
    };
  }

  if (
    /\/(tasks?|todo|projects?)\//.test(path) ||
    tags.some((t) => ["task", "todo"].includes(t)) ||
    /^- \[[ x]\]/m.test(body)
  ) {
    return {
      type: "ignore",
      confidence: 0.75,
      private: false,
      reason: "Task list — ignored for identity mind",
    };
  }

  if (
    /\/(events?|meetings?|log)\//.test(path) ||
    tags.includes("event") ||
    /\b\d{4}-\d{2}-\d{2}\b/.test(title)
  ) {
    return {
      type: "event",
      confidence: 0.65,
      private: false,
      reason: "Dated event / log",
    };
  }

  return {
    type: "knowledge",
    confidence: 0.6,
    private: false,
    reason: "Default: structured knowledge / source material",
  };
}

export type ClassifiedNotePreview = {
  path: string;
  title: string;
  type: MindNodeType;
  confidence: number;
  private: boolean;
  reason: string;
  wikilinkCount: number;
  tagCount: number;
};

export function previewObsidianNotes(
  notes: { path: string; title: string; content: string }[],
): ClassifiedNotePreview[] {
  return notes.map((n) => {
    const c = classifyObsidianNote(n);
    return {
      path: n.path,
      title: n.title,
      type: c.type,
      confidence: c.confidence,
      private: c.private,
      reason: c.reason,
      wikilinkCount: extractWikilinks(n.content).length,
      tagCount: extractTags(n.content).length,
    };
  });
}

function layerType(group: string): MindNodeType {
  if (["soul", "style", "rules", "context", "self"].includes(group)) return "self";
  if (group === "knowledge") return "knowledge";
  if (group === "belief") return "belief";
  if (group === "memory") return "memory";
  if (group === "channel" || group === "agency") return "channel";
  if (group === "capability") return "capability";
  if (group === "tool") return "tool";
  if (group === "permission") return "permission";
  if (group === "relationship") return "relationship";
  if (group === "affect") return "affect";
  if (group === "intention") return "intention";
  if (group === "note") return "note";
  return (group as MindNodeType) || "note";
}

export function buildMindGraph(
  docs: MindDoc[],
  opts?: {
    rootId?: string;
    rootLabel?: string;
    maxConcepts?: number;
    /** Drop ignore-typed docs */
    skipIgnore?: boolean;
  },
): MindGraphData {
  const maxConcepts = opts?.maxConcepts ?? 80;
  const nodeMap = new Map<string, MindGraphNode>();
  const links: MindGraphLink[] = [];
  const linkKeys = new Set<string>();

  function addNode(n: Omit<MindGraphNode, "universe"> & { universe?: MindUniverse }) {
    const full: MindGraphNode = {
      ...n,
      universe: n.universe ?? universeForType(n.type),
    };
    const prev = nodeMap.get(full.id);
    if (prev) {
      prev.val = Math.min(28, prev.val + full.val * 0.45);
      prev.confidence = Math.max(prev.confidence, full.confidence);
      if (!prev.detail && full.detail) prev.detail = full.detail;
      return;
    }
    nodeMap.set(full.id, full);
  }

  function addLink(
    source: string,
    target: string,
    optsLink?: { label?: string; strength?: number; uncertain?: boolean },
  ) {
    if (source === target) return;
    if (!nodeMap.has(source) || !nodeMap.has(target)) return;
    const key = `${source}->${target}:${optsLink?.label ?? ""}`;
    if (linkKeys.has(key)) return;
    linkKeys.add(key);
    links.push({
      source,
      target,
      label: optsLink?.label,
      strength: optsLink?.strength ?? 0.55,
      uncertain: optsLink?.uncertain,
    });
  }

  const rootId = opts?.rootId ?? "persona:root";
  addNode({
    id: rootId,
    label: opts?.rootLabel ?? "Mind",
    type: "persona",
    detail: "Core identity",
    val: 20,
    confidence: 1,
    provenance: "persona",
  });

  let conceptCount = 0;
  const skipIgnore = opts?.skipIgnore !== false;

  for (const doc of docs) {
    let type = doc.type ?? layerType(doc.group ?? "note");
    let confidence = doc.confidence ?? 0.75;
    let isPrivate = doc.private ?? false;
    let provenance = doc.sourcePath
      ? `obsidian:${doc.sourcePath}`
      : `doc:${doc.id}`;

    if (doc.sourcePath && !doc.type) {
      const c = classifyObsidianNote({
        path: doc.sourcePath,
        title: doc.title,
        content: doc.content,
      });
      type = c.type;
      confidence = c.confidence;
      isPrivate = c.private;
      provenance = `obsidian:${doc.sourcePath} · ${c.reason}`;
    }

    if (skipIgnore && type === "ignore") continue;

    const { body } = parseFrontmatter(doc.content);
    const docId = `doc:${doc.id}`;
    addNode({
      id: docId,
      label: doc.title,
      type,
      detail: body.slice(0, 420),
      val: type === "self" || type === "layer" ? 14 : 10,
      confidence,
      sourcePath: doc.sourcePath,
      private: isPrivate,
      updatedAt: doc.updatedAt,
      provenance,
    });
    addLink(rootId, docId, {
      label: "contains",
      strength: type === "self" || type === "layer" ? 0.9 : 0.65,
    });

    for (const h of extractHeadings(body)) {
      if (conceptCount >= maxConcepts) break;
      const id = `concept:${slug(h)}`;
      addNode({
        id,
        label: h,
        type: "concept",
        detail: `From ${doc.title}`,
        val: 5,
        confidence: confidence * 0.85,
        provenance: `${provenance}#heading`,
      });
      addLink(docId, id, { label: "heading", strength: 0.5 });
      conceptCount++;
    }

    for (const link of extractWikilinks(body)) {
      if (conceptCount >= maxConcepts) break;
      const id = `note:${slug(link)}`;
      addNode({
        id,
        label: link,
        type: "note",
        detail: `[[${link}]]`,
        val: 6,
        confidence: 0.7,
        provenance: "wikilink",
      });
      addLink(docId, id, { label: "wikilink", strength: 0.75 });
      conceptCount++;
    }

    for (const tag of extractTags(body)) {
      const id = `tag:${slug(tag)}`;
      addNode({
        id,
        label: `#${tag}`,
        type: "tag",
        val: 4,
        confidence: 0.8,
        provenance: "tag",
      });
      addLink(docId, id, { label: "tag", strength: 0.4, uncertain: true });
    }

    for (const line of extractKeyLines(body)) {
      if (conceptCount >= maxConcepts) break;
      const id = `concept:${slug(line.slice(0, 48))}`;
      addNode({
        id,
        label: line.length > 42 ? `${line.slice(0, 41)}…` : line,
        type: "concept",
        detail: line,
        val: 3,
        confidence: confidence * 0.55,
        provenance: `${provenance}#idea`,
      });
      addLink(docId, id, {
        label: "idea",
        strength: 0.35,
        uncertain: true,
      });
      conceptCount++;
    }
  }

  // Boost val by degree (centrality seed)
  const degree = new Map<string, number>();
  for (const l of links) {
    degree.set(l.source, (degree.get(l.source) ?? 0) + 1);
    degree.set(l.target, (degree.get(l.target) ?? 0) + 1);
  }
  for (const n of nodeMap.values()) {
    n.val = Math.min(30, n.val + (degree.get(n.id) ?? 0) * 0.6);
  }

  return { nodes: [...nodeMap.values()], links };
}

/** Authenticated studio — full Self layers (including rules). */
export function layersToMindDocs(layers: {
  soulMd?: string | null;
  styleMd?: string | null;
  rulesMd?: string | null;
  contextMd?: string | null;
}): MindDoc[] {
  const entries: {
    id: string;
    title: string;
    group: string;
    md?: string | null;
  }[] = [
    { id: "soul", title: "Soul · Identity", group: "self", md: layers.soulMd },
    { id: "style", title: "Style", group: "self", md: layers.styleMd },
    { id: "rules", title: "Rules · Boundaries", group: "self", md: layers.rulesMd },
    { id: "context", title: "Context · History", group: "self", md: layers.contextMd },
  ];
  return entries
    .filter((e) => (e.md ?? "").trim().length > 0)
    .map((e) => ({
      id: e.id,
      title: e.title,
      group: e.group,
      type: "self" as const,
      universe: "self" as const,
      content: e.md!.trim(),
      confidence: 1,
      sourcePath: undefined as string | undefined,
    }));
}

/**
 * Public allowlist only — never rulesMd, limits, prompts, or private knowledge chunks.
 */
export function publicLayersToMindDocs(input: {
  name: string;
  tagline?: string | null;
  openingLine?: string | null;
  categories?: string[];
  styleMd?: string | null;
  /** Visible traits from meta (optional) */
  traits?: string[];
}): MindDoc[] {
  const docs: MindDoc[] = [];
  const bio = [input.tagline, input.openingLine].filter(Boolean).join("\n\n");
  if (bio.trim()) {
    docs.push({
      id: "public-bio",
      title: "Public biography",
      group: "self",
      type: "self",
      universe: "self",
      content: bio.trim(),
      confidence: 1,
    });
  }
  if (input.traits?.length) {
    docs.push({
      id: "public-traits",
      title: "Visible traits",
      group: "self",
      type: "self",
      universe: "self",
      content: input.traits.join(", "),
      confidence: 0.9,
    });
  }
  // Safe public style fragment only (first ~400 chars, no rules)
  const style = (input.styleMd ?? "").trim().slice(0, 400);
  if (style.length > 40) {
    docs.push({
      id: "public-style",
      title: "Public style",
      group: "self",
      type: "self",
      universe: "self",
      content: style,
      confidence: 0.85,
    });
  }
  if (input.categories?.length) {
    docs.push({
      id: "public-interests",
      title: "Declared interests",
      group: "self",
      type: "self",
      universe: "self",
      content: input.categories.join(", "),
      confidence: 0.9,
    });
  }
  if (docs.length === 0) {
    docs.push({
      id: "public-name",
      title: input.name,
      group: "self",
      type: "self",
      universe: "self",
      content: `${input.name} — public persona on Vesperer.`,
      confidence: 1,
    });
  }
  return docs;
}
