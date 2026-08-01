import type { Character } from "@/generated/prisma/client";

/** Public management view — never includes chat apiKey. */
export function serializePersona(
  c: Pick<
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
  >,
  opts?: { includeLayers?: boolean },
) {
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
