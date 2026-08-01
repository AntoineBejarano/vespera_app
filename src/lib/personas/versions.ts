import type { Character, Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";

type VersionableCharacter = Pick<
  Character,
  | "id"
  | "name"
  | "tagline"
  | "openingLine"
  | "soulMd"
  | "styleMd"
  | "rulesMd"
  | "contextMd"
  | "metaJson"
  | "license"
  | "versionMajor"
  | "versionMinor"
>;

export function layersChanged(
  before: VersionableCharacter,
  next: {
    name?: string;
    tagline?: string | null;
    openingLine?: string | null;
    soulMd?: string | null;
    styleMd?: string | null;
    rulesMd?: string | null;
    contextMd?: string | null;
  },
) {
  const fields = [
    ["name", next.name ?? before.name, before.name],
    ["tagline", next.tagline !== undefined ? next.tagline : before.tagline, before.tagline],
    [
      "openingLine",
      next.openingLine !== undefined ? next.openingLine : before.openingLine,
      before.openingLine,
    ],
    ["soulMd", next.soulMd !== undefined ? next.soulMd : before.soulMd, before.soulMd],
    ["styleMd", next.styleMd !== undefined ? next.styleMd : before.styleMd, before.styleMd],
    ["rulesMd", next.rulesMd !== undefined ? next.rulesMd : before.rulesMd, before.rulesMd],
    [
      "contextMd",
      next.contextMd !== undefined ? next.contextMd : before.contextMd,
      before.contextMd,
    ],
  ] as const;

  return fields.some(([, a, b]) => (a ?? "") !== (b ?? ""));
}

/** Snapshot current state, then return bumped major/minor for the new tip. */
export async function snapshotAndBumpVersion(params: {
  character: VersionableCharacter;
  userId: string;
  changelog?: string | null;
  bump: "minor" | "major";
  tx?: Prisma.TransactionClient;
}) {
  const db = params.tx ?? prisma;
  const { character } = params;

  await db.characterVersion.create({
    data: {
      characterId: character.id,
      versionMajor: character.versionMajor,
      versionMinor: character.versionMinor,
      changelog: params.changelog?.trim() || null,
      name: character.name,
      tagline: character.tagline,
      openingLine: character.openingLine,
      soulMd: character.soulMd,
      styleMd: character.styleMd,
      rulesMd: character.rulesMd,
      contextMd: character.contextMd,
      metaJson: (character.metaJson ?? undefined) as
        | Prisma.InputJsonValue
        | undefined,
      license: character.license,
      createdByUserId: params.userId,
    },
  });

  if (params.bump === "major") {
    return { versionMajor: character.versionMajor + 1, versionMinor: 0 };
  }
  return {
    versionMajor: character.versionMajor,
    versionMinor: character.versionMinor + 1,
  };
}

export async function listPersonaVersions(characterId: string, limit = 20) {
  return prisma.characterVersion.findMany({
    where: { characterId },
    orderBy: [{ versionMajor: "desc" }, { versionMinor: "desc" }],
    take: limit,
    select: {
      id: true,
      versionMajor: true,
      versionMinor: true,
      changelog: true,
      name: true,
      createdAt: true,
      createdByUserId: true,
    },
  });
}
