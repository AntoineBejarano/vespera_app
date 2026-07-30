const EMOJIS = ["😊", "😉", "🥺", "😌", "🔥", "💋", "😅", "🥰", "😏", "💕", "🙈", "✨"];

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

/** Light, believable typos — not gibberish */
export function applyHumanTypos(text: string, chance = 0.22): string {
  if (Math.random() > chance) return text;

  let out = text;

  // Soft English slips / occasional accent drops if Spanish slipped in
  if (Math.random() < 0.35) {
    out = out
      .replace(/á/g, () => (Math.random() < 0.4 ? "a" : "á"))
      .replace(/é/g, () => (Math.random() < 0.4 ? "e" : "é"))
      .replace(/í/g, () => (Math.random() < 0.35 ? "i" : "í"))
      .replace(/ó/g, () => (Math.random() < 0.4 ? "o" : "ó"))
      .replace(/ú/g, () => (Math.random() < 0.35 ? "u" : "ú"))
      .replace(/ñ/g, () => (Math.random() < 0.25 ? "n" : "ñ"));
  }

  // Occasional double letter / missing letter in a mid word
  if (Math.random() < 0.35) {
    const words = out.split(/(\s+)/);
    const idx = words.findIndex(
      (w) => w.length > 4 && /^[A-Za-zÀ-ÿ]+$/.test(w),
    );
    if (idx >= 0) {
      const w = words[idx]!;
      const i = 1 + Math.floor(Math.random() * (w.length - 2));
      if (Math.random() < 0.5) {
        words[idx] = w.slice(0, i) + w[i] + w.slice(i); // double
      } else {
        words[idx] = w.slice(0, i) + w.slice(i + 1); // drop
      }
      out = words.join("");
    }
  }

  // lowercase start sometimes
  if (Math.random() < 0.35 && out[0] && /[A-ZÁÉÍÓÚ]/.test(out[0])) {
    out = out[0].toLowerCase() + out.slice(1);
  }

  // missing terminal punctuation sometimes
  if (Math.random() < 0.3) {
    out = out.replace(/[.!?]+$/u, "");
  }

  return out;
}

export function maybeAddEmoji(text: string, chance = 0.22): string {
  if (Math.random() > chance) return text;
  if (/[\u{1F300}-\u{1FAFF}]/u.test(text)) return text;
  return `${text.trim()} ${pick(EMOJIS)}`;
}

/**
 * Split a model reply into several short Telegram-like bubbles.
 * Don't force multiple bubbles for a single short line.
 */
export function splitIntoBubbles(raw: string): string[] {
  let text = raw
    .replace(/\r/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  // Strip markdown-ish / therapist scaffolding
  text = text
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*/g, "")
    .replace(/^[-•]\s+/gm, "");

  const sentences = text
    .split(/(?<=[.!?…])\s+|\n+/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (sentences.length === 0) return [text];

  // One short reply → one bubble
  if (sentences.length === 1 && sentences[0]!.length < 160) {
    return [maybeAddEmoji(applyHumanTypos(sentences[0]!))].filter(Boolean);
  }

  const target = Math.min(
    3,
    Math.max(1, Math.ceil(sentences.length * rand(0.45, 0.85))),
  );

  const bubbles: string[] = [];
  let bucket: string[] = [];
  const perBubble = Math.max(1, Math.ceil(sentences.length / target));

  for (const s of sentences) {
    bucket.push(s);
    if (bucket.length >= perBubble && bubbles.length < target - 1) {
      bubbles.push(bucket.join(" "));
      bucket = [];
    }
  }
  if (bucket.length) bubbles.push(bucket.join(" "));

  if (bubbles.length === 1 && bubbles[0]!.length > 160) {
    const long = bubbles[0]!;
    const mid = Math.floor(long.length / 2);
    const cut = long.lastIndexOf(" ", mid);
    if (cut > 40) {
      return [long.slice(0, cut).trim(), long.slice(cut).trim()]
        .filter(Boolean)
        .map((b) => maybeAddEmoji(applyHumanTypos(b)));
    }
  }

  return bubbles
    .map((b) => maybeAddEmoji(applyHumanTypos(b)))
    .map((b) => b.trim())
    .filter((b) => b.length > 0)
    .slice(0, 4);
}

export function randomReplyDelayMs(): number {
  // Think time before first bubble
  return Math.floor(rand(800, 3500));
}

export function randomBetweenBubblesMs(): number {
  return Math.floor(rand(600, 2800));
}

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function looksLikePhotoRequest(text: string): boolean {
  return /\b(photo|photos|pic|pics|picture|selfie|nude|nudes|foto|fotos|imagen|im[aá]gen|selfi)\b/i.test(
    text,
  );
}
