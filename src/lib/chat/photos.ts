/**
 * Character photos — free-text labels + request matching.
 * Owners name photos however they want ("face", "hand", "red car");
 * we match user asks against those labels (not a closed taxonomy).
 */

import { EXPLICIT_PHOTO_TAGS } from "@/lib/content-policy";

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
  pussy: ["nude", "nudes", "body", "spicy", "cono"],
  cono: ["pussy", "nude", "spicy"],
  nude: ["nudes", "naked", "desnuda", "desnudo", "pussy"],
  car: ["coche", "auto", "carro"],
  coche: ["car", "auto", "carro"],
};

/** Soft / SFW-leaning labels preferred on generic "send a pic" asks. */
const SOFT_PHOTO_HINTS = new Set([
  "face",
  "cara",
  "selfie",
  "selfi",
  "casual",
  "outfit",
  "hand",
  "mano",
  "smile",
  "closeup",
  "headshot",
  "mirror",
  "gym",
]);

/** Tokens that can be photo subjects when not extracted via "of/de your X". */
const KNOWN_SUBJECTS = new Set([
  ...Object.keys(ALIASES),
  ...Object.values(ALIASES).flat(),
  ...EXPLICIT_PHOTO_TAGS,
  ...SOFT_PHOTO_HINTS,
  "fullbody",
  "thighs",
  "lingerie",
  "boobs",
  "breasts",
  "naked",
  "nudes",
  "pussy",
  "cono",
]);

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
  // Conversational fillers — never treat as photo subjects ("Really? Send a pic")
  "really",
  "ok",
  "okay",
  "yeah",
  "yep",
  "yup",
  "sure",
  "just",
  "like",
  "can",
  "could",
  "would",
  "wanna",
  "want",
  "need",
  "now",
  "see",
  "ver",
  "babe",
  "baby",
  "amor",
  "pls",
  "plz",
  "thanks",
  "thank",
  "tho",
  "though",
  "well",
  "then",
  "also",
  "too",
  "more",
  "another",
  "again",
  "still",
  "maybe",
  "perhaps",
  "how",
  "are",
  "feeling",
  "u",
  "ur",
  "imo",
  "lol",
  "lmao",
  "haha",
  "hahaha",
]);

const PHOTO_TRIGGER =
  /\b(photo|photos|pic|pics|picture|pictures|selfie|selfi|nude|nudes|foto|fotos|imagen|im[aá]genes?|send\s+(me\s+)?(one|a|your)|manda(?:me)?|env[ií]a(?:me)?|muestra(?:me)?|show\s+(me\s+)?(your|a)|snap|dame)\b/i;

/** "I want to see ur pussy" / "show me your ass" without saying pic/photo. */
const SEE_BODY_TRIGGER =
  /\b((?:want|wanna|let\s+me)\s+(?:to\s+)?see|(?:see|ver)\s+(?:your|ur|tu|tus)|show\s+(?:me\s+)?(?:your|ur|tu)|muestra(?:me)?\s+(?:tu|tus))\b/i;

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
    /\b(?:pic|photo|picture|foto|imagen|selfie)\s+(?:of\s+)?(?:your\s+|ur\s+|tu\s+|tus\s+)?([a-zàáéíóúñü0-9][\wàáéíóúñü\s-]{0,36})/i,
    /\b(?:of\s+(?:your\s+|ur\s+)?|de\s+(?:tu\s+|tus\s+|la\s+|el\s+|una?\s+)?)([a-zàáéíóúñü0-9][\wàáéíóúñü\s-]{0,36})/i,
    /\b(?:see|ver|show).{0,16}?\b(?:your|ur|tu|tus)\s+([a-zàáéíóúñü0-9][\wàáéíóúñü-]{1,24})\b/i,
    /\b(?:your|ur|tu|tus)\s+([a-zàáéíóúñü0-9][\wàáéíóúñü-]{1,24})\b/i,
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

/** Fallback subjects only if they look like real photo labels — not chat filler. */
function substantiveQueryTokens(tokens: string[]): string[] {
  return tokens.filter((t) => !PHOTO_TRIGGER.test(t) && KNOWN_SUBJECTS.has(t));
}

export function parsePhotoIntent(text: string): PhotoIntent {
  const subject = extractSubject(text);
  const fromSubject = subject ? tokenizeLabel(subject) : [];
  const allTokens = tokenizeLabel(text);
  // Prefer phrase after "of/de/your"; otherwise only keep known photo subjects.
  // Leftover fillers ("really", "ok") must NOT become a miss subject.
  const query =
    fromSubject.length > 0
      ? fromSubject
      : substantiveQueryTokens(allTokens);

  const wantsPhoto =
    PHOTO_TRIGGER.test(text) ||
    SEE_BODY_TRIGGER.test(text) ||
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

function photoLabelTokens(photo: RankablePhoto): Set<string> {
  const labelBits = [photo.kind, ...(photo.tags ?? []), photo.caption ?? ""]
    .filter(Boolean)
    .join(" ");
  return expandTokens(tokenizeLabel(labelBits));
}

function isSpicyPhoto(photo: RankablePhoto): boolean {
  const tokens = photoLabelTokens(photo);
  for (const t of tokens) {
    if (EXPLICIT_PHOTO_TAGS.has(t)) return true;
    if (t === "ass" || ALIASES.ass?.includes(t)) return true;
    if (t === "tits" || ALIASES.tits?.includes(t)) return true;
    if (t === "nude" || ALIASES.nude?.includes(t)) return true;
    if (t === "pussy" || ALIASES.pussy?.includes(t)) return true;
  }
  return false;
}

function isSpicyBodyAsk(wanted: Set<string>): boolean {
  for (const t of wanted) {
    if (EXPLICIT_PHOTO_TAGS.has(t)) return true;
    if (
      t === "ass" ||
      t === "tits" ||
      t === "nude" ||
      t === "nudes" ||
      t === "pussy" ||
      t === "body" ||
      t === "fullbody" ||
      ALIASES.ass?.includes(t) ||
      ALIASES.tits?.includes(t) ||
      ALIASES.nude?.includes(t) ||
      ALIASES.pussy?.includes(t)
    ) {
      return true;
    }
  }
  return false;
}

function isSoftPhoto(photo: RankablePhoto): boolean {
  if (isSpicyPhoto(photo)) return false;
  const tokens = photoLabelTokens(photo);
  for (const t of tokens) {
    if (SOFT_PHOTO_HINTS.has(t)) return true;
  }
  // Untagged / unknown labels count as "normal" for early sends
  return true;
}

function shufflePhotos(photos: RankablePhoto[]): RankablePhoto[] {
  return [...photos].sort(() => Math.random() - 0.5);
}

/**
 * Score photos against free-text query tokens from the user ask.
 * Generic "send a pic" → soft/normal photos first (never random spicy opener).
 * Explicit body ask with no exact label → fall back to spicy/nude gallery.
 * Other specific asks with zero overlap → miss.
 */
export function rankPhotosForIntent(
  photos: RankablePhoto[],
  intent: PhotoIntent,
): RankPhotosResult {
  if (!photos.length) return { photos: [], miss: false };

  const wanted = expandTokens(intent.query);
  if (wanted.size === 0) {
    const soft = photos.filter(isSoftPhoto);
    const pool = soft.length ? soft : photos;
    // Prefer face/selfie/casual when available; keep non-spicy unknowns as fallback
    const preferred = pool.filter((p) => {
      const tokens = photoLabelTokens(p);
      for (const t of tokens) if (SOFT_PHOTO_HINTS.has(t)) return true;
      return false;
    });
    return {
      photos: shufflePhotos(preferred.length ? preferred : pool),
      miss: false,
    };
  }

  const scored = photos.map((p) => {
    const photoTokens = photoLabelTokens(p);
    let score = 0;
    for (const w of wanted) {
      if (photoTokens.has(w)) score += 3;
    }
    return { photo: p, score };
  });

  scored.sort((a, b) => b.score - a.score || Math.random() - 0.5);
  const best = scored[0]?.score ?? 0;
  if (best <= 0) {
    if (isSpicyBodyAsk(wanted)) {
      const spicy = photos.filter(isSpicyPhoto);
      const bodyish = photos.filter((p) => {
        const tok = photoLabelTokens(p);
        return tok.has("body") || tok.has("fullbody") || isSpicyPhoto(p);
      });
      const pool = spicy.length ? spicy : bodyish;
      if (pool.length) {
        return { photos: shufflePhotos(pool), miss: false };
      }
    }
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
