import type { Character } from "@/generated/prisma/client";
import { formatPersonaVersion } from "@/lib/personas/license";

type SerializablePersona = Pick<
  Character,
  | "id"
  | "name"
  | "intensity"
  | "active"
  | "tagline"
  | "openingLine"
  | "isPublic"
  | "isAdult"
  | "slug"
  | "categories"
  | "allowFork"
  | "soulMd"
  | "styleMd"
  | "rulesMd"
  | "contextMd"
  | "limitsJson"
  | "createdAt"
  | "updatedAt"
  | "apiKey"
> &
  Partial<
    Pick<Character, "license" | "channels" | "versionMajor" | "versionMinor">
  >;

/** Public management view — never includes chat apiKey. */
export function serializePersona(
  c: SerializablePersona,
  opts?: { includeLayers?: boolean },
) {
  const versionMajor = c.versionMajor ?? 1;
  const versionMinor = c.versionMinor ?? 0;
  const base = {
    id: c.id,
    name: c.name,
    intensity: c.intensity,
    active: c.active,
    tagline: c.tagline,
    openingLine: c.openingLine,
    isPublic: c.isPublic,
    isAdult: c.isAdult,
    slug: c.slug,
    categories: c.categories,
    allowFork: c.allowFork,
    license: c.license ?? "fork_allowed",
    channels: c.channels ?? [],
    version: formatPersonaVersion(versionMajor, versionMinor),
    versionMajor,
    versionMinor,
    hasChatApiKey: Boolean(
      c.apiKey ||
        ("apiKeyHash" in c && c.apiKeyHash) ||
        ("apiKeyPrefix" in c && c.apiKeyPrefix),
    ),
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  };

  if (!opts?.includeLayers) return base;

  return {
    ...base,
    soul: c.soulMd ?? "",
    style: c.styleMd ?? "",
    rules: c.rulesMd ?? "",
    context: c.contextMd ?? "",
    limits: c.limitsJson ?? null,
  };
}

export function serializePersonaListItem(
  c: Pick<
    Character,
    | "id"
    | "name"
    | "intensity"
    | "active"
    | "tagline"
    | "isPublic"
    | "isAdult"
    | "slug"
    | "createdAt"
    | "updatedAt"
    | "apiKey"
  >,
) {
  return {
    id: c.id,
    name: c.name,
    intensity: c.intensity,
    active: c.active,
    tagline: c.tagline,
    isPublic: c.isPublic,
    isAdult: c.isAdult,
    slug: c.slug,
    hasChatApiKey: Boolean(
      c.apiKey ||
        ("apiKeyHash" in c && c.apiKeyHash) ||
        ("apiKeyPrefix" in c && c.apiKeyPrefix),
    ),
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  };
}
