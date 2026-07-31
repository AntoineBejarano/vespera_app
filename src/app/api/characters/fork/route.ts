import { randomBytes } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";
import { getAppUser } from "@/lib/session";
import { needsAccountAgeGate } from "@/lib/legal/gate";
import { maxCharactersForPlan } from "@/lib/monetization";
import { countUserCharacters } from "@/lib/users";
import { ensureRelationshipState } from "@/lib/persona/relationship";
import { getShowcaseBySlug } from "@/lib/characters/showcase";

const bodySchema = z.object({
  /** Fork a published DB character */
  characterId: z.string().optional(),
  /** Fork a curated showcase slug */
  showcaseSlug: z.string().optional(),
});

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

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success || (!parsed.data.characterId && !parsed.data.showcaseSlug)) {
    return Response.json({ error: "characterId or showcaseSlug required" }, { status: 400 });
  }

  let source: {
    id: string | null;
    name: string;
    soulMd: string;
    styleMd: string;
    rulesMd: string;
    contextMd: string;
    identityJson: Prisma.InputJsonValue;
    metaJson: Prisma.InputJsonValue | undefined;
    intensity: number;
    tagline: string | null;
    openingLine: string | null;
    categories: string[];
    allowFork: boolean;
    isAdult: boolean;
    limitsJson: Prisma.InputJsonValue | undefined;
  };

  if (parsed.data.showcaseSlug) {
    const showcase = getShowcaseBySlug(parsed.data.showcaseSlug);
    if (!showcase || !showcase.allowFork) {
      return Response.json({ error: "Character not available to fork" }, { status: 404 });
    }
    source = {
      id: null,
      name: showcase.name,
      soulMd: showcase.soulMd,
      styleMd: showcase.styleMd,
      rulesMd: showcase.rulesMd,
      contextMd: showcase.contextMd,
      identityJson: {
        temperament: showcase.tagline,
        desires: [],
        fears: [],
        contradictions: [],
        linguisticStyle: "natural",
        humor: "light",
        backstory: showcase.tagline,
        goals: [],
        relationshipDynamic: "companion",
        intensity: showcase.intensity,
        kinks: [],
        boundaries: [],
        excludedThemes: [],
      },
      metaJson: {
        name: showcase.name,
        relationshipMode: "companion",
        intensity: showcase.intensity,
        forkedFromShowcase: showcase.slug,
      },
      intensity: showcase.intensity,
      tagline: showcase.tagline,
      openingLine: showcase.openingLine,
      categories: showcase.categories,
      allowFork: true,
      isAdult: showcase.isAdult,
      limitsJson: undefined,
    };
  } else {
    const original = await prisma.character.findFirst({
      where: {
        id: parsed.data.characterId,
        OR: [{ isPublic: true, allowFork: true }, { userId: user.id }],
      },
    });
    if (!original || (!original.isPublic && original.userId !== user.id)) {
      return Response.json({ error: "Character not available to fork" }, { status: 404 });
    }
    if (original.isPublic && !original.allowFork && original.userId !== user.id) {
      return Response.json({ error: "Forking disabled for this character" }, { status: 403 });
    }
    source = {
      id: original.id,
      name: original.name,
      soulMd: original.soulMd ?? `# Soul\n\n${original.name}`,
      styleMd: original.styleMd ?? `# Style\n\nSpeak as ${original.name}.`,
      rulesMd: original.rulesMd ?? `# Rules\n\nStay in character.`,
      contextMd: original.contextMd ?? `# Context\n\nForked character.`,
      identityJson: original.identityJson as Prisma.InputJsonValue,
      metaJson: (original.metaJson ?? undefined) as
        | Prisma.InputJsonValue
        | undefined,
      intensity: original.intensity,
      tagline: original.tagline,
      openingLine: original.openingLine,
      categories: original.categories,
      allowFork: true,
      isAdult: original.isAdult,
      limitsJson: (original.limitsJson ?? undefined) as
        | Prisma.InputJsonValue
        | undefined,
    };
  }

  await prisma.character.updateMany({
    where: { userId: user.id, active: true },
    data: { active: false },
  });

  const apiKey = `vesp_${randomBytes(24).toString("hex")}`;
  const character = await prisma.character.create({
    data: {
      userId: user.id,
      name: `${source.name}`,
      identityJson: source.identityJson,
      soulMd: source.soulMd,
      styleMd: source.styleMd,
      rulesMd: source.rulesMd,
      contextMd: source.contextMd,
      metaJson: source.metaJson,
      intensity: source.intensity,
      tagline: source.tagline,
      openingLine: source.openingLine,
      categories: source.categories,
      isAdult: source.isAdult,
      isPublic: false,
      allowFork: true,
      forkedFromId: source.id,
      limitsJson: source.limitsJson,
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
  track("character_forked");

  return Response.json({
    character: { id: character.id, name: character.name },
  });
}
