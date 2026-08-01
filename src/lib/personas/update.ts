import { z } from "zod";
import { Prisma, type User } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { clearHistory } from "@/lib/memory/history";
import { isValidSlug } from "@/lib/characters/slug";
import { ensureUniqueSlug } from "@/lib/characters/public";
import {
  ensurePlatformOperatorAttestation,
  isPlatformOperatorRequiredError,
} from "@/lib/legal/operator";

export const personaPatchSchema = z.object({
  active: z.boolean().optional(),
  intensity: z.number().int().min(1).max(5).optional(),
  name: z.string().min(1).max(80).optional(),
  /** Accept soul / soulMd aliases */
  soul: z.string().max(20000).optional(),
  soulMd: z.string().max(20000).optional(),
  style: z.string().max(20000).optional(),
  styleMd: z.string().max(20000).optional(),
  rules: z.string().max(20000).optional(),
  rulesMd: z.string().max(20000).optional(),
  context: z.string().max(20000).optional(),
  contextMd: z.string().max(20000).optional(),
  limitsJson: z.record(z.string(), z.unknown()).optional(),
  boundaries: z.string().max(2000).optional(),
  resetChat: z.boolean().optional(),
  isPublic: z.boolean().optional(),
  slug: z.string().min(2).max(64).optional(),
  tagline: z.string().max(180).nullable().optional(),
  openingLine: z.string().max(500).nullable().optional(),
  categories: z.array(z.string().max(40)).max(8).optional(),
  allowFork: z.boolean().optional(),
  isAdult: z.boolean().optional(),
  platformOperatorAccepted: z.boolean().optional(),
});

export type PersonaPatchInput = z.infer<typeof personaPatchSchema>;

export type PersonaUpdateResult =
  | {
      ok: true;
      character: {
        id: string;
        name: string;
        isPublic: boolean;
        slug: string | null;
        tagline: string | null;
        openingLine: string | null;
        categories: string[];
        allowFork: boolean;
        isAdult: boolean;
        active: boolean;
        intensity: number;
      };
    }
  | { ok: false; status: number; error: string; code?: string };

/**
 * Update a persona owned by `user`. Caller must already have verified ownership
 * via findFirst({ id, userId }) — this function re-checks for safety.
 */
export async function updateOwnedPersona(params: {
  user: User;
  characterId: string;
  input: PersonaPatchInput;
}): Promise<PersonaUpdateResult> {
  const character = await prisma.character.findFirst({
    where: { id: params.characterId, userId: params.user.id },
  });
  if (!character) {
    return { ok: false, status: 404, error: "Not found" };
  }

  const data = params.input;
  const soulMd = data.soulMd ?? data.soul;
  const styleMd = data.styleMd ?? data.style;
  const rulesMd = data.rulesMd ?? data.rules;
  const contextMd = data.contextMd ?? data.context;

  if (data.active) {
    await prisma.character.updateMany({
      where: { userId: params.user.id, active: true },
      data: { active: false },
    });
  }

  if (data.resetChat) {
    await clearHistory(params.user.id, params.characterId);
    const conversation = await prisma.conversation.findFirst({
      where: { userId: params.user.id, characterId: params.characterId },
      orderBy: { updatedAt: "desc" },
    });
    if (conversation) {
      await prisma.message.deleteMany({
        where: { conversationId: conversation.id },
      });
    }
  }

  let nextSlug = character.slug;
  const publishing = data.isPublic === true;
  const firstPublish = publishing && !character.isPublic;

  if (firstPublish) {
    try {
      await ensurePlatformOperatorAttestation({
        userId: params.user.id,
        user: params.user,
        platformOperatorAccepted: data.platformOperatorAccepted,
      });
    } catch (err) {
      if (isPlatformOperatorRequiredError(err)) {
        return {
          ok: false,
          status: 403,
          error: err.message,
          code: err.code,
        };
      }
      throw err;
    }
  }

  if (data.slug !== undefined) {
    const candidate = data.slug.toLowerCase().trim();
    if (!isValidSlug(candidate)) {
      return {
        ok: false,
        status: 400,
        error: "Slug must be lowercase letters, numbers, and hyphens.",
      };
    }
    nextSlug = await ensureUniqueSlug(candidate, params.characterId);
  } else if (publishing && !character.slug) {
    nextSlug = await ensureUniqueSlug(
      data.name ?? character.name,
      params.characterId,
    );
  }

  let limitsJson =
    data.limitsJson !== undefined
      ? (data.limitsJson as Prisma.InputJsonValue)
      : ((character.limitsJson ?? undefined) as
          | Prisma.InputJsonValue
          | undefined);

  if (data.boundaries !== undefined) {
    const prev =
      character.limitsJson &&
      typeof character.limitsJson === "object" &&
      !Array.isArray(character.limitsJson)
        ? (character.limitsJson as Record<string, unknown>)
        : {};
    limitsJson = {
      ...prev,
      ...(typeof data.limitsJson === "object" && data.limitsJson
        ? data.limitsJson
        : {}),
      boundaries: data.boundaries,
    } as Prisma.InputJsonValue;
  }

  const updated = await prisma.character.update({
    where: { id: params.characterId },
    data: {
      active: data.active ?? character.active,
      intensity: data.intensity ?? character.intensity,
      name: data.name ?? character.name,
      soulMd: soulMd !== undefined ? soulMd : character.soulMd,
      styleMd: styleMd !== undefined ? styleMd : character.styleMd,
      rulesMd: rulesMd !== undefined ? rulesMd : character.rulesMd,
      contextMd: contextMd !== undefined ? contextMd : character.contextMd,
      limitsJson,
      isPublic: data.isPublic ?? character.isPublic,
      slug: nextSlug,
      tagline: data.tagline !== undefined ? data.tagline : character.tagline,
      openingLine:
        data.openingLine !== undefined
          ? data.openingLine
          : character.openingLine,
      categories: data.categories ?? character.categories,
      allowFork: data.allowFork ?? character.allowFork,
      isAdult: data.isAdult ?? character.isAdult,
    },
  });

  return {
    ok: true,
    character: {
      id: updated.id,
      name: updated.name,
      isPublic: updated.isPublic,
      slug: updated.slug,
      tagline: updated.tagline,
      openingLine: updated.openingLine,
      categories: updated.categories,
      allowFork: updated.allowFork,
      isAdult: updated.isAdult,
      active: updated.active,
      intensity: updated.intensity,
    },
  };
}

export async function deleteOwnedPersona(params: {
  userId: string;
  characterId: string;
}): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  const character = await prisma.character.findFirst({
    where: { id: params.characterId, userId: params.userId },
    select: { id: true },
  });
  if (!character) {
    return { ok: false, status: 404, error: "Not found" };
  }
  await prisma.character.delete({ where: { id: character.id } });
  return { ok: true };
}
