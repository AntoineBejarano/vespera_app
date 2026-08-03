/** After Dark partner policy version — bump when adult partner terms change. */
export const ADULT_POLICY_VERSION = "2026-08-02";

export const PARTNERS_EMAIL =
  process.env.PARTNERS_EMAIL?.trim() || "partners@vesperer.com";

export const ADULT_CAPABILITIES = [
  "chat_adult",
  "image_explicit",
  "voice_adult",
  "persona_adult_config",
  "publish_adult",
] as const;

export type AdultCapability = (typeof ADULT_CAPABILITIES)[number];

export function parseJsonStringArray(raw: string | null | undefined): string[] {
  if (!raw?.trim()) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x): x is string => typeof x === "string");
  } catch {
    return [];
  }
}

export function toJsonStringArray(values: string[]): string {
  return JSON.stringify(values);
}
