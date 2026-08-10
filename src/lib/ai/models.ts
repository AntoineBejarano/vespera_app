export const DEFAULT_MODEL =
  process.env.DEFAULT_MODEL ??
  "~google/gemini-flash-latest";

export const INTERNAL_MODEL =
  process.env.INTERNAL_MODEL ?? "google/gemini-3.1-flash-lite";

export const PREMIUM_MODEL =
  process.env.PREMIUM_MODEL ?? "~anthropic/claude-haiku-latest";

export const DEEP_REASONING_MODEL =
  process.env.DEEP_REASONING_MODEL ?? "~anthropic/claude-sonnet-latest";

export const ALLOWED_MODELS = (
  process.env.ALLOWED_MODELS ??
  [
    DEFAULT_MODEL,
    INTERNAL_MODEL,
    PREMIUM_MODEL,
    DEEP_REASONING_MODEL,
    "google/gemini-3.5-flash",
    "anthropic/claude-haiku-4.5",
    "anthropic/claude-sonnet-5",
    "nousresearch/hermes-4-70b",
    "cognitivecomputations/dolphin-mistral-24b-venice-edition",
  ].join(",")
)
  .split(",")
  .map((m) => m.trim())
  .filter(Boolean)
  .filter((model, index, models) => models.indexOf(model) === index);

export function resolveModel(preferred?: string | null): string {
  if (preferred && ALLOWED_MODELS.includes(preferred)) {
    return preferred;
  }
  if (ALLOWED_MODELS.includes(DEFAULT_MODEL)) {
    return DEFAULT_MODEL;
  }
  return ALLOWED_MODELS[0] ?? DEFAULT_MODEL;
}

export function resolveInternalModel(preferred?: string | null): string {
  if (preferred && ALLOWED_MODELS.includes(preferred)) {
    return preferred;
  }
  if (ALLOWED_MODELS.includes(INTERNAL_MODEL)) {
    return INTERNAL_MODEL;
  }
  return resolveModel(null);
}

export const MODEL_LABELS: Record<string, string> = {
  "~google/gemini-flash-latest": "Gemini Flash Latest (default chat)",
  "google/gemini-3.1-flash-lite": "Gemini 3.1 Flash Lite (internal/memory)",
  "google/gemini-3.5-flash": "Gemini 3.5 Flash (quality)",
  "~anthropic/claude-haiku-latest": "Claude Haiku Latest (premium persona)",
  "anthropic/claude-haiku-4.5": "Claude Haiku 4.5 (premium persona)",
  "~anthropic/claude-sonnet-latest": "Claude Sonnet Latest (deep reasoning)",
  "anthropic/claude-sonnet-5": "Claude Sonnet 5 (deep reasoning)",
  "cognitivecomputations/dolphin-mistral-24b-venice-edition":
    "Dolphin Venice 24B (natural + uncensored)",
  "nousresearch/hermes-4-70b": "Hermes 4 70B (calidad)",
};
