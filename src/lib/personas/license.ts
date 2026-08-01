import { z } from "zod";

export const PERSONA_LICENSES = [
  "private",
  "public",
  "fork_allowed",
  "non_commercial",
  "commercial",
] as const;

export type PersonaLicense = (typeof PERSONA_LICENSES)[number];

export const personaLicenseSchema = z.enum(PERSONA_LICENSES);

export const PERSONA_LICENSE_LABELS: Record<PersonaLicense, string> = {
  private: "Private",
  public: "Public view",
  fork_allowed: "Fork allowed",
  non_commercial: "Non-commercial",
  commercial: "Commercial use allowed",
};

export const PERSONA_LICENSE_BLURBS: Record<PersonaLicense, string> = {
  private: "Only the creator and collaborators can access this persona.",
  public: "Anyone can view the registry page. Forking follows the fork setting.",
  fork_allowed: "Others may fork and build their own version.",
  non_commercial: "Fork and reuse allowed for non-commercial projects.",
  commercial: "Commercial use of this persona definition is allowed.",
};

export const REGISTRY_CHANNELS = [
  "vesperer",
  "web",
  "telegram",
  "api",
  "chai",
  "sillytavern",
  "character_card",
] as const;

export type RegistryChannel = (typeof REGISTRY_CHANNELS)[number];

export const REGISTRY_CHANNEL_LABELS: Record<RegistryChannel, string> = {
  vesperer: "Vesperer",
  web: "Web",
  telegram: "Telegram",
  api: "API",
  chai: "Chai-ready",
  sillytavern: "SillyTavern",
  character_card: "Character Card",
};

export function formatPersonaVersion(major: number, minor: number) {
  return `${major}.${minor}`;
}

export function isPersonaLicense(value: string): value is PersonaLicense {
  return (PERSONA_LICENSES as readonly string[]).includes(value);
}
