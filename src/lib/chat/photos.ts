/**
 * Character photos — free-text labels + request matching.
 * Owners name photos however they want ("face", "hand", "red car");
 * we match user asks against those labels (not a closed taxonomy).
 */

/** Soft bilingual/alias boosts only — labels themselves stay free-text. */
const ALIASES: Record<string, string[]> = {
  face: ["cara", "rostro", "selfie", "headshot", "closeup"],
  cara: ["face", "rostro", "selfie"],
  selfie: ["face", "cara", "selfi"],
  selfi: ["selfie", "face"],
  hand: ["mano", "hands", "manos"],
  mano: ["hand", "hands", "manos"],
  hands: ["hand", "mano", "manos"],
  foot: ["pie", "feet", "pies"],
  pie: ["foot", "feet", "pies"],
  feet: ["foot", "pie", "pies"],
  body: ["cuerpo", "fullbody"],
  cuerpo: ["body", "fullbody"],
  legs: ["piernas", "thighs", "muslos"],
  piernas: ["legs", "thighs"],
  ass: ["culo", "butt", "booty", "trasero"],
  culo: ["ass", "butt", "booty"],
  tits: ["boobs", "pecho", "tetas", "breasts"],
  tetas: ["tits", "boobs", "pecho"],
  nude: ["nudes", "naked", "desnuda", "desnudo"],
  car: ["coche", "auto", "carro"],
  coche: ["car", "auto", "carro"],
};

const STOP = new Set([
  "a",
  "an",
  "the",
  "me",
  "my",
  "your",
  "you",
  "of",
  "to",
  "and",
  "or",
  "one",
  "some",
  "any",
  "de",
  "del",
  "la",
  "el",
  "los",
  "las",
  "una",
  "un",
  "unos",
  "unas",
  "tu",
  "tus",
  "su",
  "sus",
  "con",
  "por",
  "para",
  "photo",
  "photos",
  "pic",
  "pics",
  "picture",
  "pictures",
  "image",
  "images",
  "foto",
  "fotos",
  "imagen",
  "imagenes",
  "imágenes",
  "snap",
  "send",
  "sent",
  "sending",
  "show",
  "showing",
  "manda",
  "mandame",
  "mándame",
  "envia",
  "envía",
  "enviame",
  "envíame",
  "muestra",
  "muestrame",
  "muéstrame",
  "dame",
  "give",
  "gimme",
  "please",
  "por",
  "favor",
  "hey",
  "hi",
  "hola",
]);

const PHOTO_TRIGGER =
  /\b(photo|photos|pic|pics|picture|pictures|selfie|selfi|nude|nudes|foto|fotos|imagen|im[aá]genes?|send\s+(me\s+)?(one|a|your)|manda(?:me)?|env[ií]a(?:me)?|muestra(?:me)?|show\s+(me\s+)?(your|a)|snap|dame)\b/i;

const MAX_LABEL_LEN = 48;
const MAX_TAGS = 12;

export type PhotoIntent = {
  wantsPhoto: boolean;
  /** Free-text subject tokens extracted from the ask ("face", "hand", "car"). */
  query: string[];
  /** Human-readable subject for "I don't have that" copy. */
  requestedLabel: string | null;
};

export function tokenizeLabel(text: string): string[] {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9\s-]/gi, " ")
    .split(/[\s,_/;|]+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 1 && !STOP.has(t));
}

function expandTokens(tokens: string[]): Set<string> {
  const out = new Set(tokens);
  for (const t of tokens) {
    const aliases = ALIASES[t];
    if (aliases) for (const a of aliases) out.add(a);
  }
  return out;
}

function extractSubject(text: string): string | null {
  const lower = text.toLowerCase();
  const patterns = [
    /\b(?:pic|photo|picture|foto|imagen|selfie)\s+(?:of\s+)?(?:your\s+|tu\s+|tus\s+)?([a-zàáéíóúñü0-9][\wàáéíóúñü\s-]{0,36})/i,
    /\b(?:of\s+(?:your\s+)?|de\s+(?:tu\s+|tus\s+|la\s+|el\s+|una?\s+)?)([a-zàáéíóúñü0-9][\wàáéíóúñü\s-]{0,36})/i,
    /\b(?:send|show|manda|env[ií]a|muestra|dame).{0,24}?\b(?:a\s+|una?\s+)?([a-zàáéíóúñü0-9][\wàáéíóúñü-]{1,24})\b/i,
  ];
  for (const re of patterns) {
    const m = lower.match(re);
    const raw = m?.[1]?.trim();
    if (!raw) continue;
    const tokens = tokenizeLabel(raw);
    if (tokens.length) return tokens.join(" ");
  }
  return null;
}

export function parsePhotoIntent(text: string): PhotoIntent {
  const subject = extractSubject(text);
  const fromSubject = subject ? tokenizeLabel(subject) : [];
  const allTokens = tokenizeLabel(text);
  // Prefer phrase after "of/de"; fall back to non-trigger content words
  const query =
    fromSubject.length > 0
      ? fromSubject
      : allTokens.filter((t) => !PHOTO_TRIGGER.test(t));

  const wantsPhoto =
    PHOTO_TRIGGER.test(text) ||
    /\b(send|manda|env[ií]a|show|muestra|dame).{0,40}\b(pic|photo|foto|imagen|selfie)\b/i.test(
      text,
    );

  const requestedLabel =
    fromSubject.length > 0
      ? fromSubject.join(" ")
      : query.length > 0
        ? query.slice(0, 4).join(" ")
        : null;

  return {
    wantsPhoto,
    query: wantsPhoto ? query : [],
    requestedLabel: wantsPhoto ? requestedLabel : null,
  };
}

export function looksLikePhotoRequest(text: string): boolean {
  return parsePhotoIntent(text).wantsPhoto;
}

export type RankablePhoto = {
  id: string;
  url: string;
  caption?: string | null;
  kind: string;
  tags: string[];
};

export type RankPhotosResult = {
  photos: RankablePhoto[];
  /** Specific ask with no label match — do not send a random photo. */
  miss: boolean;
};

/**
 * Score photos against free-text query tokens from the user ask.
 * Generic "send a pic" → any photo. Specific ask with zero overlap → miss.
 */
export function rankPhotosForIntent(
  photos: RankablePhoto[],
  intent: PhotoIntent,
): RankPhotosResult {
  if (!photos.length) return { photos: [], miss: false };

  const wanted = expandTokens(intent.query);
  if (wanted.size === 0) {
    return {
      photos: [...photos].sort(() => Math.random() - 0.5),
      miss: false,
    };
  }

  const scored = photos.map((p) => {
    const labelBits = [p.kind, ...(p.tags ?? []), p.caption ?? ""]
      .filter(Boolean)
      .join(" ");
    const photoTokens = expandTokens(tokenizeLabel(labelBits));
    let score = 0;
    for (const w of wanted) {
      if (photoTokens.has(w)) score += 3;
    }
    return { photo: p, score };
  });

  scored.sort((a, b) => b.score - a.score || Math.random() - 0.5);
  const best = scored[0]?.score ?? 0;
  if (best <= 0) {
    return { photos: [], miss: true };
  }
  const top = scored.filter((s) => s.score === best).map((s) => s.photo);
  return { photos: top, miss: false };
}

/** Free-text labels: comma/semicolon separated, length-capped. */
export function normalizeTags(input: unknown): string[] {
  let raw: string[] = [];
  if (Array.isArray(input)) {
    raw = input.flatMap((x) => String(x).split(/[,;|]+/));
  } else if (typeof input === "string") {
    raw = input.split(/[,;|]+/);
  }
  const cleaned = raw
    .map((t) => t.toLowerCase().trim().replace(/\s+/g, " "))
    .filter((t) => t.length > 0 && t.length <= MAX_LABEL_LEN)
    .slice(0, MAX_TAGS);
  return [...new Set(cleaned)];
}

/** Primary kind slug from free-text tags (DB still has `kind`). */
export function kindFromTags(tags: string[], fallback = "photo"): string {
  const first = tags[0]?.trim();
  if (!first) return fallback;
  return first.slice(0, MAX_LABEL_LEN);
}

export function photoHintLabel(photo: RankablePhoto): string {
  const tags = [...(photo.tags?.length ? photo.tags : [photo.kind])].filter(
    Boolean,
  );
  const uniq = [...new Set(tags.map((t) => t.toLowerCase()))];
  return uniq.join(", ");
}

/** @deprecated Prefer free-text labels; kept for soft UI suggestions only. */
export const PHOTO_TAG_OPTIONS = [
  { id: "face", label: "Face" },
  { id: "selfie", label: "Selfie" },
  { id: "body", label: "Body" },
  { id: "hand", label: "Hand" },
  { id: "foot", label: "Foot" },
  { id: "outfit", label: "Outfit" },
  { id: "casual", label: "Casual" },
] as const;
