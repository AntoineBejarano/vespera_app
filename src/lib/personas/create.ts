import { randomBytes } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { generatePersonaLayers } from "@/lib/persona/generator";
import { onboardingAnswersSchema } from "@/lib/identity/schema";
import { maxCharactersForPlan } from "@/lib/monetization";
import { countUserCharacters } from "@/lib/users";
import { ensureRelationshipState } from "@/lib/persona/relationship";
import { Prisma, type User } from "@/generated/prisma/client";
import { needsAccountAgeGate } from "@/lib/legal/gate";

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

export async function assertCanCreatePersona(user: User) {
  if (needsAccountAgeGate(user)) {
    return { ok: false as const, status: 403, error: "Age verification 18+ required" };
  }
  const count = await countUserCharacters(user.id);
  const max = maxCharactersForPlan(user.plan);
  if (count >= max) {
    return {
      ok: false as const,
      status: 403,
      error: `Persona limit reached (${max}).`,
    };
  }
  return { ok: true as const };
}

async function finalizePersona(params: {
  user: User;
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
  await prisma.character.updateMany({
    where: { userId: params.user.id, active: true },
    data: { active: false },
  });

  const chatApiKey = `vesp_${randomBytes(24).toString("hex")}`;

  const character = await prisma.character.create({
    data: {
      userId: params.user.id,
      name: params.name,
      identityJson: params.identity,
      soulMd: params.soulMd,
      styleMd: params.styleMd,
      rulesMd: params.rulesMd,
      contextMd: params.contextMd,
      metaJson: params.metaJson,
      intensity: params.intensity,
      limitsJson: params.limitsJson,
      active: true,
      apiKey: chatApiKey,
      tagline: params.tagline,
      openingLine: params.openingLine,
      isPublic: params.isPublic ?? false,
      isAdult: params.isAdult ?? false,
    },
  });

  await ensureRelationshipState(params.user.id, character.id);
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

  return finalizePersona({
    user,
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

  return finalizePersona({
    user,
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

export async function createPersonaFromBody(user: User, body: unknown) {
  const gate = await assertCanCreatePersona(user);
  if (!gate.ok) {
    return { ok: false as const, status: gate.status, error: gate.error };
  }

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
      const character = await createPersonaFromGenerate(user, parsed.data);
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

  const character = await createPersonaFromDirect(user, parsed.data);
  return { ok: true as const, character };
}
