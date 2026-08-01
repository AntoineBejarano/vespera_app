import { randomBytes } from "crypto";
import { Prisma, type User } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { needsAccountAgeGate } from "@/lib/legal/gate";
import { maxCharactersForPlan } from "@/lib/monetization";
import { countUserCharacters } from "@/lib/users";
import { ensureRelationshipState } from "@/lib/persona/relationship";
import {
  importRequestSchema,
  parseCharacterImport,
} from "@/lib/characters/import";
import { containsProhibitedMinorContent } from "@/lib/ai/safety";

export type PersonaImportResult =
  | {
      ok: true;
      character: {
        id: string;
        name: string;
        chatApiKey: string;
        warnings: string[];
      };
    }
  | { ok: false; status: number; error: string };

export async function importPersonaFromBody(
  user: User,
  body: unknown,
): Promise<PersonaImportResult> {
  if (needsAccountAgeGate(user)) {
    return { ok: false, status: 403, error: "Age verification 18+ required" };
  }

  const count = await countUserCharacters(user.id);
  const max = maxCharactersForPlan(user.plan);
  if (count >= max) {
    return {
      ok: false,
      status: 403,
      error: `Persona limit reached (${max}).`,
    };
  }

  const parsed = importRequestSchema.safeParse(body);
  if (!parsed.success) {
    return {
      ok: false,
      status: 400,
      error:
        "Confirm you have permission to use this content, then paste a valid character export. Set permissionConfirmed:true.",
    };
  }

  let draft;
  try {
    draft = parseCharacterImport(parsed.data.raw, parsed.data.source);
  } catch (err) {
    return {
      ok: false,
      status: 400,
      error: err instanceof Error ? err.message : "Import failed",
    };
  }

  if (parsed.data.nameOverride) draft.name = parsed.data.nameOverride.trim();
  if (parsed.data.intensity) draft.intensity = parsed.data.intensity;

  const safetyBlob = [
    draft.name,
    draft.soulMd,
    draft.styleMd,
    draft.rulesMd,
    draft.contextMd,
    draft.openingLine,
  ].join("\n");
  if (containsProhibitedMinorContent(safetyBlob)) {
    return {
      ok: false,
      status: 400,
      error: "Import blocked: prohibited minor-related content.",
    };
  }

  await prisma.character.updateMany({
    where: { userId: user.id, active: true },
    data: { active: false },
  });

  const chatApiKey = `vesp_${randomBytes(24).toString("hex")}`;

  const character = await prisma.character.create({
    data: {
      userId: user.id,
      name: draft.name,
      identityJson: {
        temperament: draft.personality.slice(0, 200),
        desires: [],
        fears: [],
        contradictions: [],
        linguisticStyle: draft.style.slice(0, 200),
        humor: "natural",
        backstory: draft.scenario.slice(0, 300),
        goals: [],
        relationshipDynamic: draft.relationshipType,
        intensity: draft.intensity,
        kinks: [],
        boundaries: draft.boundaries ? [draft.boundaries] : [],
        excludedThemes: [],
      },
      soulMd: draft.soulMd,
      styleMd: draft.styleMd,
      rulesMd: draft.rulesMd,
      contextMd: draft.contextMd,
      metaJson: {
        name: draft.name,
        relationshipMode: draft.relationshipType,
        intensity: draft.intensity,
        importSource: draft.source,
        createdVia: "api_import",
      },
      tagline: draft.tagline,
      openingLine: draft.openingLine,
      categories: draft.categories,
      intensity: draft.intensity,
      limitsJson: {
        boundaries: draft.boundaries,
        importSource: draft.source,
      } as Prisma.InputJsonValue,
      active: true,
      apiKey: chatApiKey,
    },
  });

  await ensureRelationshipState(user.id, character.id);
  await prisma.conversation.create({
    data: {
      userId: user.id,
      characterId: character.id,
      title: `With ${character.name}`,
    },
  });

  const { track } = await import("@/lib/metrics");
  track("character_imported");

  return {
    ok: true,
    character: {
      id: character.id,
      name: character.name,
      chatApiKey,
      warnings: draft.warnings,
    },
  };
}
