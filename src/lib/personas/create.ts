import { z } from "zod";
import { prisma } from "@/lib/db";
import { generatePersonaLayers } from "@/lib/persona/generator";
import { onboardingAnswersSchema } from "@/lib/identity/schema";
import { maxCharactersForPlan } from "@/lib/monetization";
import { countWorkspaceCharacters } from "@/lib/users";
import { ensureRelationshipState } from "@/lib/persona/relationship";
import { resolveSubject } from "@/lib/persona/subject";
import { Prisma, type User } from "@/generated/prisma/client";
import { needsAccountAgeGate } from "@/lib/legal/gate";
import { getOrCreateActiveWorkspaceId } from "@/lib/workspace/ensure";
import { requireWorkspacePermission } from "@/lib/workspace/permissions";
import { generateChatApiKeySecret } from "@/lib/api-keys/chat-keys";
import {
  clampIntensityForWorkspace,
  ContentPolicyError,
} from "@/lib/content-policy";
import { assertCapability } from "@/lib/content-policy/runtime";
import { evaluatePersonaConfigSafety } from "@/lib/ai/safety";

export const personaDirectCreateSchema = z.object({
  name: z.string().min(1).max(80),
  soul: z.string().min(20).max(50_000),
  style: z.string().min(10).max(50_000),
  rules: z.string().min(10).max(50_000),
  context: z.string().min(10).max(50_000),
  intensity: z.number().int().min(1).max(5).default(3),
  tagline: z.string().max(200).optional(),
  openingLine: z.string().max(2000).optional(),
  isPublic: z.boolean().optional(),
  isAdult: z.boolean().optional(),
  boundaries: z.string().max(2000).optional(),
});

export const personaGenerateCreateSchema = onboardingAnswersSchema;

export type PersonaCreateResult = {
  id: string;
  name: string;
  /** Chat API key for this persona (vesp_…) — shown once in create response */
  chatApiKey: string;
  layers: string[];
  mode: "direct" | "generate";
};

export async function assertCanCreatePersona(
  user: User,
  workspaceId?: string,
) {
  if (needsAccountAgeGate(user)) {
    return { ok: false as const, status: 403, error: "Age verification 18+ required" };
  }
  const wsId = workspaceId ?? (await getOrCreateActiveWorkspaceId(user));
  try {
    await requireWorkspacePermission(user.id, wsId, "personas.write");
  } catch {
    return {
      ok: false as const,
      status: 403,
      error: "Missing permission: personas.write. Ask a workspace admin for Editor access.",
    };
  }
  const count = await countWorkspaceCharacters(wsId);
  const max = maxCharactersForPlan(user.plan);
  if (count >= max) {
    return {
      ok: false as const,
      status: 403,
      error: `Persona limit reached (${max}).`,
    };
  }
  return { ok: true as const, workspaceId: wsId };
}

async function finalizePersona(params: {
  user: User;
  workspaceId: string;
  name: string;
  identity: object;
  soulMd: string;
  styleMd: string;
  rulesMd: string;
  contextMd: string;
  metaJson: object;
  intensity: number;
  limitsJson: Prisma.InputJsonValue;
  tagline?: string;
  openingLine?: string;
  isPublic?: boolean;
  isAdult?: boolean;
  mode: "direct" | "generate";
}): Promise<PersonaCreateResult> {
  let isPublic = params.isPublic ?? false;
  let isAdult = params.isAdult ?? false;

  if (isPublic) {
    try {
      await requireWorkspacePermission(
        params.user.id,
        params.workspaceId,
        "content.publish",
      );
    } catch {
      isPublic = false;
    }
  }

  const ws = await prisma.workspace.findUnique({
    where: { id: params.workspaceId },
  });
  const adultConfigOk = Boolean(ws?.adultEnabled);

  if (isAdult) {
    try {
      await assertCapability({
        workspaceId: params.workspaceId,
        characterAdult: true,
        subjectAgeVerified: false,
        channel: "web",
        requestedCapability: "persona_adult_config",
        isDelivery: false,
      });
    } catch (err) {
      if (err instanceof ContentPolicyError) {
        isAdult = false;
      } else {
        throw err;
      }
    }
  }

  if (isAdult && isPublic) {
    try {
      await assertCapability({
        workspaceId: params.workspaceId,
        characterAdult: true,
        subjectAgeVerified: false,
        channel: "public",
        requestedCapability: "publish_adult",
        isDelivery: true,
      });
    } catch {
      // Partner may configure adult personas privately — never publish adult without HEAA
      isPublic = false;
    }
  }

  const intensity = clampIntensityForWorkspace(
    params.intensity,
    adultConfigOk && isAdult,
  );

  const safetyBlob = [
    params.name,
    params.soulMd,
    params.styleMd,
    params.rulesMd,
    params.contextMd,
    params.tagline,
    params.openingLine,
  ]
    .filter(Boolean)
    .join("\n");
  const configSafety = evaluatePersonaConfigSafety(safetyBlob);
  if (configSafety.blocked) {
    throw new ContentPolicyError(
      `Persona config blocked: real-person, minor, or non-consent policy violation (${configSafety.rule})`,
      "PERSONA_HARD_BLOCK",
    );
  }

  await prisma.character.updateMany({
    where: { workspaceId: params.workspaceId, active: true },
    data: { active: false },
  });

  const { raw: chatApiKey, keyPrefix, lastFour, keyHash } =
    generateChatApiKeySecret();

  const character = await prisma.character.create({
    data: {
      workspaceId: params.workspaceId,
      userId: params.user.id,
      updatedByUserId: params.user.id,
      name: params.name,
      identityJson: params.identity,
      soulMd: params.soulMd,
      styleMd: params.styleMd,
      rulesMd: params.rulesMd,
      contextMd: params.contextMd,
      metaJson: params.metaJson,
      intensity,
      limitsJson: params.limitsJson,
      active: true,
      apiKey: chatApiKey,
      apiKeyHash: keyHash,
      apiKeyPrefix: keyPrefix,
      apiKeyLastFour: lastFour,
      tagline: params.tagline,
      openingLine: params.openingLine,
      isPublic,
      isAdult,
    },
  });

  const subject = await resolveSubject({
    workspaceId: character.workspaceId,
    webUserId: params.user.id,
    displayName: params.user.name ?? params.user.email,
  });
  await ensureRelationshipState(subject.id, character.id, params.user.id);
  await prisma.conversation.create({
    data: {
      userId: params.user.id,
      characterId: character.id,
      title: `With ${character.name}`,
    },
  });

  const { track } = await import("@/lib/metrics");
  track("character_created");

  return {
    id: character.id,
    name: character.name,
    chatApiKey,
    layers: ["soul", "style", "rules", "context", "relationship"],
    mode: params.mode,
  };
}

export async function createPersonaFromDirect(
  user: User,
  input: z.infer<typeof personaDirectCreateSchema>,
  workspaceId?: string,
): Promise<PersonaCreateResult> {
  const identity = {
    temperament: input.soul.slice(0, 200),
    desires: [] as string[],
    fears: [] as string[],
    contradictions: [] as string[],
    linguisticStyle: input.style.slice(0, 200),
    humor: "natural",
    backstory: input.context.slice(0, 300),
    goals: [] as string[],
    relationshipDynamic: "defined by context and rules",
    intensity: input.intensity,
    kinks: [] as string[],
    boundaries: input.boundaries ? [input.boundaries] : [],
    excludedThemes: [] as string[],
  };

  const wsId = workspaceId ?? (await getOrCreateActiveWorkspaceId(user));
  return finalizePersona({
    user,
    workspaceId: wsId,
    name: input.name,
    identity,
    soulMd: input.soul,
    styleMd: input.style,
    rulesMd: input.rules,
    contextMd: input.context,
    metaJson: { source: "api_direct", createdVia: "cli_or_api" },
    intensity: input.intensity,
    limitsJson: {
      boundaries: input.boundaries ?? "",
      excludedThemes: [],
    },
    tagline: input.tagline,
    openingLine: input.openingLine,
    isPublic: input.isPublic,
    isAdult: input.isAdult,
    mode: "direct",
  });
}

export async function createPersonaFromGenerate(
  user: User,
  input: z.infer<typeof personaGenerateCreateSchema>,
  workspaceId?: string,
): Promise<PersonaCreateResult> {
  const layers = await generatePersonaLayers(
    input,
    user.preferredModel ?? undefined,
  );

  const identity =
    layers.identity ??
    ({
      temperament: layers.soulMd.slice(0, 200),
      desires: [],
      fears: [],
      contradictions: [],
      linguisticStyle: layers.styleMd.slice(0, 200),
      humor: "natural",
      backstory: layers.contextMd.slice(0, 300),
      goals: [],
      relationshipDynamic: input.relationshipType,
      intensity: input.intensity,
      kinks: [],
      boundaries: input.boundaries ? [input.boundaries] : [],
      excludedThemes: [],
    } as const);

  const wsId = workspaceId ?? (await getOrCreateActiveWorkspaceId(user));
  return finalizePersona({
    user,
    workspaceId: wsId,
    name: input.name,
    identity: identity as object,
    soulMd: layers.soulMd,
    styleMd: layers.styleMd,
    rulesMd: layers.rulesMd,
    contextMd: layers.contextMd,
    metaJson: layers.meta as object,
    intensity: input.intensity,
    limitsJson: {
      boundaries: input.boundaries,
      excludedThemes: identity.excludedThemes ?? [],
    },
    mode: "generate",
  });
}

export async function createPersonaFromBody(
  user: User,
  body: unknown,
  workspaceId?: string,
) {
  const gate = await assertCanCreatePersona(user, workspaceId);
  if (!gate.ok) {
    return { ok: false as const, status: gate.status, error: gate.error };
  }
  const wsId = gate.workspaceId;

  const asRecord = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const mode = asRecord.mode === "generate" ? "generate" : "direct";

  if (mode === "generate" || (!asRecord.soul && !asRecord.soulMd && asRecord.personality)) {
    const parsed = personaGenerateCreateSchema.safeParse(asRecord);
    if (!parsed.success) {
      return {
        ok: false as const,
        status: 400,
        error: "Invalid generate payload",
        details: parsed.error.flatten(),
      };
    }
    try {
      const character = await createPersonaFromGenerate(user, parsed.data, wsId);
      return { ok: true as const, character };
    } catch (error) {
      const detail = error instanceof Error ? error.message : "Unknown error";
      return {
        ok: false as const,
        status: 502,
        error: `Could not generate persona: ${detail}`,
      };
    }
  }

  const parsed = personaDirectCreateSchema.safeParse({
    ...asRecord,
    soul: asRecord.soul ?? asRecord.soulMd,
    style: asRecord.style ?? asRecord.styleMd,
    rules: asRecord.rules ?? asRecord.rulesMd,
    context: asRecord.context ?? asRecord.contextMd,
  });
  if (!parsed.success) {
    return {
      ok: false as const,
      status: 400,
      error:
        "Invalid direct payload. Provide name, soul, style, rules, context (or mode:\"generate\" with onboarding fields).",
      details: parsed.error.flatten(),
    };
  }

  const character = await createPersonaFromDirect(user, parsed.data, wsId);
  return { ok: true as const, character };
}
