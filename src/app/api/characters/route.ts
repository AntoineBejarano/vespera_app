import { randomBytes } from "crypto";
import { prisma } from "@/lib/db";
import { generatePersonaLayers } from "@/lib/persona/generator";
import { onboardingAnswersSchema } from "@/lib/identity/schema";
import { maxCharactersForPlan } from "@/lib/monetization";
import { countUserCharacters } from "@/lib/users";
import { ensureRelationshipState } from "@/lib/persona/relationship";
import { Prisma } from "@/generated/prisma/client";
import { requireAppUser, getAppUser } from "@/lib/session";
import { needsAccountAgeGate } from "@/lib/legal/gate";

export async function GET() {
  const user = await getAppUser();
  if (!user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  const characters = await prisma.character.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      name: true,
      intensity: true,
      active: true,
      createdAt: true,
      updatedAt: true,
      metaJson: true,
      apiKey: true,
      _count: {
        select: {
          telegramBots: true,
          photos: true,
          relationships: true,
        },
      },
      telegramBots: {
        select: {
          id: true,
          username: true,
          active: true,
          label: true,
          _count: { select: { peers: true } },
        },
      },
    },
  });

  return Response.json({
    characters: characters.map((c) => ({
      id: c.id,
      name: c.name,
      intensity: c.intensity,
      active: c.active,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      metaJson: c.metaJson,
      hasApiKey: Boolean(c.apiKey),
      botCount: c._count.telegramBots,
      photoCount: c._count.photos,
      peerCount: c.telegramBots.reduce((n, b) => n + b._count.peers, 0),
      bots: c.telegramBots.map((b) => ({
        id: b.id,
        username: b.username,
        active: b.active,
        label: b.label,
        peerCount: b._count.peers,
      })),
    })),
  });
}

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
      {
        error: `Persona limit reached (${max}).`,
      },
      { status: 403 },
    );
  }

  const body = await req.json();
  const parsed = onboardingAnswersSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid onboarding answers" }, { status: 400 });
  }

  try {
    const layers = await generatePersonaLayers(
      parsed.data,
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
        relationshipDynamic: parsed.data.relationshipType,
        intensity: parsed.data.intensity,
        kinks: [],
        boundaries: parsed.data.boundaries
          ? [parsed.data.boundaries]
          : [],
        excludedThemes: [],
      } as const);

    // New persona becomes the default for admin test chat (others stay usable)
    await prisma.character.updateMany({
      where: { userId: user.id, active: true },
      data: { active: false },
    });

    const apiKey = `vesp_${randomBytes(24).toString("hex")}`;

    const character = await prisma.character.create({
      data: {
        userId: user.id,
        name: parsed.data.name,
        identityJson: identity as object,
        soulMd: layers.soulMd,
        styleMd: layers.styleMd,
        rulesMd: layers.rulesMd,
        contextMd: layers.contextMd,
        metaJson: layers.meta as object,
        intensity: parsed.data.intensity,
        limitsJson: {
          boundaries: parsed.data.boundaries,
          excludedThemes: identity.excludedThemes ?? [],
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
    track("character_created");

    return Response.json({
      character: {
        id: character.id,
        name: character.name,
        apiKey,
        layers: ["soul", "style", "rules", "context", "relationship"],
      },
    });
  } catch (error) {
    console.error("[characters POST]", error);
    const detail =
      error instanceof Error ? error.message : "Unknown error";
    return Response.json(
      {
        error: `Could not generate persona: ${detail}`,
      },
      { status: 502 },
    );
  }
}
