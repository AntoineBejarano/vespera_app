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
import {
  hasWorkspacePermission,
  requireWorkspacePermission,
} from "@/lib/workspace/permissions";
import {
  PERSONA_LICENSES,
  REGISTRY_CHANNELS,
  personaLicenseSchema,
} from "@/lib/personas/license";
import { ALLOWED_MODELS } from "@/lib/ai/models";
import {
  layersChanged,
  snapshotAndBumpVersion,
} from "@/lib/personas/versions";
import {
  clampIntensityForWorkspace,
  ContentPolicyError,
} from "@/lib/content-policy";
import { assertCapability } from "@/lib/content-policy/runtime";
import { containsProhibitedPersonaConfig } from "@/lib/ai/safety";

export const personaPatchSchema = z.object({
  active: z.boolean().optional(),
  intensity: z.number().int().min(1).max(5).optional(),
  /** OpenRouter model for this persona only. null clears to account default. */
  preferredModel: z.string().nullable().optional(),
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
  license: personaLicenseSchema.optional(),
  channels: z.array(z.enum(REGISTRY_CHANNELS)).max(12).optional(),
  changelog: z.string().max(280).nullable().optional(),
  bumpMajor: z.boolean().optional(),
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
        preferredModel: string | null;
        license: string;
        channels: string[];
        versionMajor: number;
        versionMinor: number;
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
  workspaceId?: string;
  input: PersonaPatchInput;
}): Promise<PersonaUpdateResult> {
  const character = await prisma.character.findFirst({
    where: {
      id: params.characterId,
      ...(params.workspaceId
        ? { workspaceId: params.workspaceId }
        : { userId: params.user.id }),
      archivedAt: null,
    },
  });
  if (!character) {
    return { ok: false, status: 404, error: "Not found" };
  }

  const canWrite = await hasWorkspacePermission(
    params.user.id,
    character.workspaceId,
    "personas.write",
  );
  if (!canWrite) {
    return {
      ok: false,
      status: 403,
      error: "Missing permission: personas.write",
      code: "MISSING_CAPABILITY",
    };
  }

  const data = params.input;
  const soulMd = data.soulMd ?? data.soul;
  const styleMd = data.styleMd ?? data.style;
  const rulesMd = data.rulesMd ?? data.rules;
  const contextMd = data.contextMd ?? data.context;

  if (
    data.isPublic !== undefined ||
    data.allowFork !== undefined ||
    data.slug !== undefined ||
    data.license !== undefined ||
    data.channels !== undefined
  ) {
    const canPublish = await hasWorkspacePermission(
      params.user.id,
      character.workspaceId,
      "content.publish",
    );
    if (!canPublish) {
      return {
        ok: false,
        status: 403,
        error: "Missing permission: content.publish. Ask an admin to publish.",
        code: "MISSING_CAPABILITY",
      };
    }
  }

  if (data.license !== undefined && !PERSONA_LICENSES.includes(data.license)) {
    return { ok: false, status: 400, error: "Invalid license." };
  }

  if (
    data.preferredModel !== undefined &&
    data.preferredModel !== null &&
    !ALLOWED_MODELS.includes(data.preferredModel)
  ) {
    return { ok: false, status: 400, error: "Model not allowed." };
  }

  if (data.isAdult !== undefined) {
    if (data.isAdult) {
      try {
        await assertCapability({
          workspaceId: character.workspaceId,
          characterAdult: true,
          subjectAgeVerified: false,
          channel: "web",
          requestedCapability: "persona_adult_config",
          isDelivery: false,
        });
        await requireWorkspacePermission(
          params.user.id,
          character.workspaceId,
          "adult.manage_content",
        );
      } catch (err) {
        if (err instanceof ContentPolicyError) {
          return {
            ok: false,
            status: 403,
            error: err.message,
            code: err.code,
          };
        }
        return {
          ok: false,
          status: 403,
          error:
            "After Dark partner approval required to mark personas adult. Apply via partners@vesperer.com.",
          code: "ADULT_DISABLED",
        };
      }
    }
  }

  if (data.isPublic === true && (data.isAdult === true || character.isAdult)) {
    try {
      await assertCapability({
        workspaceId: character.workspaceId,
        characterAdult: true,
        subjectAgeVerified: false,
        channel: "public",
        requestedCapability: "publish_adult",
        isDelivery: true,
      });
    } catch (err) {
      if (err instanceof ContentPolicyError) {
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

  const ws = await prisma.workspace.findUnique({
    where: { id: character.workspaceId },
    select: { adultEnabled: true },
  });
  if (data.intensity !== undefined) {
    data.intensity = clampIntensityForWorkspace(
      data.intensity,
      Boolean(ws?.adultEnabled) &&
        (data.isAdult === true ||
          (data.isAdult !== false && character.isAdult)),
    );
  }

  const configBlob = [
    data.name,
    data.soul ?? data.soulMd,
    data.style ?? data.styleMd,
    data.rules ?? data.rulesMd,
    data.context ?? data.contextMd,
    data.tagline,
    data.openingLine,
  ]
    .filter(Boolean)
    .join("\n");
  if (configBlob && containsProhibitedPersonaConfig(configBlob)) {
    return {
      ok: false,
      status: 400,
      error:
        "Persona update blocked: real-person, minor, or non-consent policy violation",
      code: "PERSONA_HARD_BLOCK",
    };
  }

  if (data.active) {
    await prisma.character.updateMany({
      where: { workspaceId: character.workspaceId, active: true },
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

  const nextLayers = {
    name: data.name ?? character.name,
    tagline: data.tagline !== undefined ? data.tagline : character.tagline,
    openingLine:
      data.openingLine !== undefined
        ? data.openingLine
        : character.openingLine,
    soulMd: soulMd !== undefined ? soulMd : character.soulMd,
    styleMd: styleMd !== undefined ? styleMd : character.styleMd,
    rulesMd: rulesMd !== undefined ? rulesMd : character.rulesMd,
    contextMd: contextMd !== undefined ? contextMd : character.contextMd,
  };

  const shouldVersion = layersChanged(character, nextLayers);
  let versionMajor = character.versionMajor;
  let versionMinor = character.versionMinor;

  if (shouldVersion) {
    const bumped = await snapshotAndBumpVersion({
      character,
      userId: params.user.id,
      changelog: data.changelog,
      bump: data.bumpMajor ? "major" : "minor",
    });
    versionMajor = bumped.versionMajor;
    versionMinor = bumped.versionMinor;
  }

  const nextLicense =
    data.license ??
    (data.allowFork === false && character.license === "fork_allowed"
      ? "public"
      : character.license);

  const updated = await prisma.character.update({
    where: { id: params.characterId },
    data: {
      updatedByUserId: params.user.id,
      active: data.active ?? character.active,
      intensity: data.intensity ?? character.intensity,
      preferredModel:
        data.preferredModel !== undefined
          ? data.preferredModel
          : character.preferredModel,
      name: nextLayers.name,
      soulMd: nextLayers.soulMd,
      styleMd: nextLayers.styleMd,
      rulesMd: nextLayers.rulesMd,
      contextMd: nextLayers.contextMd,
      limitsJson,
      isPublic: data.isPublic ?? character.isPublic,
      slug: nextSlug,
      tagline: nextLayers.tagline,
      openingLine: nextLayers.openingLine,
      categories: data.categories ?? character.categories,
      allowFork: data.allowFork ?? character.allowFork,
      isAdult: data.isAdult ?? character.isAdult,
      license: nextLicense,
      channels: data.channels ?? character.channels,
      versionMajor,
      versionMinor,
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
      preferredModel: updated.preferredModel,
      license: updated.license,
      channels: updated.channels,
      versionMajor: updated.versionMajor,
      versionMinor: updated.versionMinor,
    },
  };
}

export async function deleteOwnedPersona(params: {
  userId: string;
  characterId: string;
  workspaceId?: string;
}): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  const character = await prisma.character.findFirst({
    where: {
      id: params.characterId,
      ...(params.workspaceId
        ? { workspaceId: params.workspaceId }
        : { userId: params.userId }),
      archivedAt: null,
    },
    select: { id: true, workspaceId: true },
  });
  if (!character) {
    return { ok: false, status: 404, error: "Not found" };
  }
  try {
    await requireWorkspacePermission(
      params.userId,
      character.workspaceId,
      "content.archive",
    );
  } catch {
    return {
      ok: false,
      status: 403,
      error: "Missing permission: content.archive",
    };
  }
  await prisma.character.update({
    where: { id: character.id },
    data: {
      archivedAt: new Date(),
      archivedByUserId: params.userId,
      active: false,
      isPublic: false,
    },
  });
  return { ok: true };
}
