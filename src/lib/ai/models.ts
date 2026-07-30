export const DEFAULT_MODEL =
  process.env.DEFAULT_MODEL ??
  "cognitivecomputations/dolphin-mistral-24b-venice-edition";

export const ALLOWED_MODELS = (
  process.env.ALLOWED_MODELS ??
  [
    "cognitivecomputations/dolphin-mistral-24b-venice-edition",
    "gryphe/mythomax-l2-13b",
    "nousresearch/hermes-3-llama-3.1-70b",
    "nousresearch/hermes-4-70b",
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
  "cognitivecomputations/dolphin-mistral-24b-venice-edition":
    "Dolphin Venice 24B (natural + uncensored)",
  "gryphe/mythomax-l2-13b": "MythoMax 13B (roleplay clásico, más literario)",
  "nousresearch/hermes-3-llama-3.1-70b": "Hermes 3 70B (calidad)",
  "nousresearch/hermes-4-70b": "Hermes 4 70B (calidad)",
};
