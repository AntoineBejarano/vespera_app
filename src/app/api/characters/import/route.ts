import { randomBytes } from "crypto";
import { prisma } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";
import { getAppUser } from "@/lib/session";
import { needsAccountAgeGate } from "@/lib/legal/gate";
import { maxCharactersForPlan } from "@/lib/monetization";
import { countUserCharacters } from "@/lib/users";
import { ensureRelationshipState } from "@/lib/persona/relationship";
import {
  importRequestSchema,
  parseCharacterImport,
} from "@/lib/characters/import";
import { containsProhibitedMinorContent } from "@/lib/ai/safety";

export async function POST(req: Request) {
  const user = await getAppUser();
  if (!user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }
  if (needsAccountAgeGate(user)) {
    return Response.json({ error: "Age verification 18+ required" }, { status: 403 });
  }

  const count = await countUserCharacters(user.id);
  const max = maxCharactersForPlan(user.plan);
  if (count >= max) {
    return Response.json(
      { error: `Persona limit reached (${max}).` },
      { status: 403 },
    );
  }

  const body = await req.json();
  const parsed = importRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      {
        error:
          "Confirm you have permission to use this content, then paste a valid character export.",
      },
      { status: 400 },
    );
  }

  let draft;
  try {
    draft = parseCharacterImport(parsed.data.raw, parsed.data.source);
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Import failed" },
      { status: 400 },
    );
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
    return Response.json(
      { error: "Import blocked: prohibited minor-related content." },
      { status: 400 },
    );
  }

  await prisma.character.updateMany({
    where: { userId: user.id, active: true },
    data: { active: false },
  });

  const apiKey = `vesp_${randomBytes(24).toString("hex")}`;

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
      apiKey,
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

  return Response.json({
    character: {
      id: character.id,
      name: character.name,
      warnings: draft.warnings,
    },
  });
}
