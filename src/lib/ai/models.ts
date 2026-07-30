export const DEFAULT_MODEL =
  process.env.DEFAULT_MODEL ?? "undi95/toppy-m-7b";

export const ALLOWED_MODELS = (
  process.env.ALLOWED_MODELS ??
  [
    "undi95/toppy-m-7b",
    "neversleep/noromaid-20b",
    "cognitivecomputations/dolphin-mixtral-8x7b",
    "gryphe/mythomax-l2-13b",
    "nousresearch/hermes-3-llama-3.1-70b",
  ].join(",")
)
  .split(",")
  .map((m) => m.trim())
  .filter(Boolean);

export function resolveModel(preferred?: string | null): string {
  if (preferred && ALLOWED_MODELS.includes(preferred)) {
    return preferred;
  }
  if (ALLOWED_MODELS.includes(DEFAULT_MODEL)) {
    return DEFAULT_MODEL;
  }
  return ALLOWED_MODELS[0] ?? DEFAULT_MODEL;
}

export const MODEL_LABELS: Record<string, string> = {
  "undi95/toppy-m-7b": "Toppy M 7B (rápido)",
  "neversleep/noromaid-20b": "Noromaid 20B (roleplay)",
  "cognitivecomputations/dolphin-mixtral-8x7b": "Dolphin Mixtral (uncensored)",
  "gryphe/mythomax-l2-13b": "MythoMax 13B (nicho RP)",
  "nousresearch/hermes-3-llama-3.1-70b": "Hermes 3 70B (calidad)",
};
