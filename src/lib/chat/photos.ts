/**
 * Photo tags for CharacterPhoto — used to match user requests
 * ("send a face pic", "mandame una de culo", etc.)
 */

export const PHOTO_TAG_OPTIONS = [
  { id: "face", label: "Face" },
  { id: "selfie", label: "Selfie" },
  { id: "body", label: "Body" },
  { id: "fullbody", label: "Full body" },
  { id: "ass", label: "Ass" },
  { id: "tits", label: "Tits" },
  { id: "legs", label: "Legs" },
  { id: "lingerie", label: "Lingerie" },
  { id: "nude", label: "Nude" },
  { id: "mirror", label: "Mirror" },
  { id: "bed", label: "Bed" },
  { id: "outfit", label: "Outfit" },
  { id: "casual", label: "Casual" },
  { id: "gym", label: "Gym" },
  { id: "spicy", label: "Spicy" },
] as const;

export type PhotoTagId = (typeof PHOTO_TAG_OPTIONS)[number]["id"];

/** Synonyms → canonical tag */
const SYNONYMS: Record<string, PhotoTagId> = {
  face: "face",
  cara: "face",
  rost: "face",
  rostro: "face",
  closeup: "face",
  "close-up": "face",
  headshot: "face",
  selfie: "selfie",
  selfi: "selfie",
  body: "body",
  cuerpo: "body",
  figure: "body",
  fullbody: "fullbody",
  "full body": "fullbody",
  "cuerpo entero": "fullbody",
  ass: "ass",
  culo: "ass",
  butt: "ass",
  booty: "ass",
  trasero: "ass",
  tits: "tits",
  boobs: "tits",
  pecho: "tits",
  tetas: "tits",
  breasts: "tits",
  legs: "legs",
  piernas: "legs",
  thighs: "legs",
  muslos: "legs",
  lingerie: "lingerie",
  lenceria: "lingerie",
  lencería: "lingerie",
  underwear: "lingerie",
  nude: "nude",
  nudes: "nude",
  naked: "nude",
  desnuda: "nude",
  desnudo: "nude",
  mirror: "mirror",
  espejo: "mirror",
  bed: "bed",
  cama: "bed",
  outfit: "outfit",
  look: "outfit",
  casual: "casual",
  gym: "gym",
  spicy: "spicy",
  hot: "spicy",
};

export type PhotoIntent = {
  wantsPhoto: boolean;
  tags: PhotoTagId[];
  /** loose keywords found for logging / caption */
  rawHints: string[];
};

const PHOTO_TRIGGER =
  /\b(photo|photos|pic|pics|picture|pictures|selfie|selfi|nude|nudes|foto|fotos|imagen|im[aá]genes?|send\s+(me\s+)?(one|a|your)|manda(?:me)?|env[ií]a(?:me)?|muestra(?:me)?|show\s+(me\s+)?(your|a)|snap)\b/i;

export function parsePhotoIntent(text: string): PhotoIntent {
  const lower = text.toLowerCase();
  const rawHints: string[] = [];
  const found = new Set<PhotoTagId>();

  // Multi-word first
  for (const [syn, tag] of Object.entries(SYNONYMS)) {
    if (syn.includes(" ") && lower.includes(syn)) {
      found.add(tag);
      rawHints.push(syn);
    }
  }

  // Word tokens
  const tokens = lower
    .replace(/[^a-zàáéíóúñü0-9\s-]/gi, " ")
    .split(/\s+/)
    .filter(Boolean);

  for (const t of tokens) {
    const tag = SYNONYMS[t];
    if (tag) {
      found.add(tag);
      rawHints.push(t);
    }
  }

  // Phrases like "de cara", "de culo", "de pecho"
  const deMatch = lower.match(
    /\b(?:de|del|una?\s+de|pic\s+of\s+(?:your\s+)?|foto\s+de)\s+(cara|culo|pecho|tetas|cuerpo|piernas|ass|butt|face|tits|body|legs|selfie)\b/i,
  );
  if (deMatch?.[1]) {
    const syn = deMatch[1].toLowerCase();
    const tag = SYNONYMS[syn];
    if (tag) {
      found.add(tag);
      rawHints.push(syn);
    }
  }

  const wantsPhoto =
    PHOTO_TRIGGER.test(text) ||
    found.size > 0 ||
    /\b(send|manda|env[ií]a|show|muestra).{0,40}\b(ass|culo|face|cara|tits|pecho|body|cuerpo)\b/i.test(
      text,
    );

  return {
    wantsPhoto,
    tags: [...found],
    rawHints,
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

/**
 * Score photos against requested tags. Prefer exact kind/tag matches.
 */
export function rankPhotosForIntent(
  photos: RankablePhoto[],
  intent: PhotoIntent,
): RankablePhoto[] {
  if (!photos.length) return [];

  const wanted = new Set(intent.tags);
  if (wanted.size === 0) {
    // Generic "send a pic" — prefer selfie/face/casual, else random shuffle
    const preferred = photos.filter((p) =>
      ["selfie", "face", "casual"].includes(p.kind) ||
      p.tags.some((t) => ["selfie", "face", "casual"].includes(t)),
    );
    const pool = preferred.length ? preferred : photos;
    return [...pool].sort(() => Math.random() - 0.5);
  }

  const scored = photos.map((p) => {
    const photoTags = new Set(
      [p.kind, ...p.tags].map((t) => t.toLowerCase().trim()).filter(Boolean),
    );
    let score = 0;
    for (const w of wanted) {
      if (photoTags.has(w)) score += 3;
      // soft related
      if (w === "face" && photoTags.has("selfie")) score += 1;
      if (w === "selfie" && photoTags.has("face")) score += 1;
      if (w === "nude" && photoTags.has("spicy")) score += 1;
      if (w === "ass" && photoTags.has("body")) score += 0.5;
      if (w === "tits" && photoTags.has("body")) score += 0.5;
    }
    return { photo: p, score };
  });

  scored.sort((a, b) => b.score - a.score || Math.random() - 0.5);
  const best = scored[0]?.score ?? 0;
  if (best <= 0) {
    // No tag match — still send something rather than nothing
    return [...photos].sort(() => Math.random() - 0.5);
  }
  return scored.filter((s) => s.score === best).map((s) => s.photo);
}

export function normalizeTags(input: unknown): string[] {
  const allowed = new Set(PHOTO_TAG_OPTIONS.map((t) => t.id));
  let raw: string[] = [];
  if (Array.isArray(input)) {
    raw = input.map((x) => String(x).toLowerCase().trim());
  } else if (typeof input === "string") {
    raw = input.split(/[,;\s]+/).map((x) => x.toLowerCase().trim());
  }
  return [...new Set(raw.filter((t) => allowed.has(t as PhotoTagId)))];
}

export function photoHintLabel(photo: RankablePhoto): string {
  const tags = [photo.kind, ...photo.tags].filter(Boolean);
  const uniq = [...new Set(tags.map((t) => t.toLowerCase()))];
  return uniq.join(", ");
}
