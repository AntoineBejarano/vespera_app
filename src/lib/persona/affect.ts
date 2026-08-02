import { z } from "zod";

/** Controlled conversational tone — never free text in prompts. */
export const CURRENT_TONES = [
  "neutral",
  "warm",
  "playful",
  "reflective",
  "cautious",
  "formal",
  "supportive",
  "challenging",
  "distant",
] as const;

export type CurrentTone = (typeof CURRENT_TONES)[number];

export function clamp01(n: number): number {
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

export function parseCurrentTone(raw: unknown): CurrentTone {
  if (typeof raw === "string" && (CURRENT_TONES as readonly string[]).includes(raw)) {
    return raw as CurrentTone;
  }
  return "neutral";
}

/** Optional extensible affect payload — validated before prompt injection. */
export const affectJsonSchema = z
  .object({
    notes: z.string().max(400).optional(),
    topicsSensitive: z.array(z.string().max(80)).max(12).optional(),
    lastShiftReason: z.string().max(200).optional(),
  })
  .strict()
  .optional();

export type AffectJson = z.infer<typeof affectJsonSchema>;

export function parseAffectJson(raw: unknown): AffectJson | undefined {
  const parsed = affectJsonSchema.safeParse(raw);
  return parsed.success ? parsed.data : undefined;
}

export type AffectSnapshot = {
  mood: string;
  trust: number;
  affection: number;
  energy: number;
  familiarity: number;
  openness: number;
  playfulness: number;
  currentTone: CurrentTone;
  summary?: string | null;
  affectJson?: AffectJson;
};

export function normalizeAffect(row: {
  mood: string;
  trust: number;
  affection: number;
  energy: number;
  familiarity?: number | null;
  openness?: number | null;
  playfulness?: number | null;
  currentTone?: string | null;
  summary?: string | null;
  affectJson?: unknown;
}): AffectSnapshot {
  return {
    mood: (row.mood || "neutral").slice(0, 40),
    trust: clamp01(row.trust),
    affection: clamp01(row.affection),
    energy: clamp01(row.energy),
    familiarity: clamp01(row.familiarity ?? 0.2),
    openness: clamp01(row.openness ?? 0.4),
    playfulness: clamp01(row.playfulness ?? 0.4),
    currentTone: parseCurrentTone(row.currentTone),
    summary: row.summary,
    affectJson: parseAffectJson(row.affectJson),
  };
}
