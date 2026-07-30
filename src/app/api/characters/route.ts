import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generateIdentitySheet } from "@/lib/identity/generator";
import { onboardingAnswersSchema } from "@/lib/identity/schema";
import { maxCharactersForPlan } from "@/lib/monetization";
import { countUserCharacters } from "@/lib/users";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "No autenticado" }, { status: 401 });
  }

  const characters = await prisma.character.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      name: true,
      intensity: true,
      active: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return Response.json({ characters });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "No autenticado" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user?.ageVerifiedAt) {
    return Response.json({ error: "Debes verificar edad 18+" }, { status: 403 });
  }

  const count = await countUserCharacters(user.id);
  const max = maxCharactersForPlan(user.plan);
  if (count >= max) {
    return Response.json(
      {
        error: `Límite de personajes (${max}). Free: 2; premium: más.`,
      },
      { status: 403 },
    );
  }

  const body = await req.json();
  const parsed = onboardingAnswersSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Respuestas de onboarding inválidas" }, { status: 400 });
  }

  try {
    const identity = await generateIdentitySheet(
      parsed.data,
      user.preferredModel ?? undefined,
    );

    await prisma.character.updateMany({
      where: { userId: user.id, active: true },
      data: { active: false },
    });

    const character = await prisma.character.create({
      data: {
        userId: user.id,
        name: parsed.data.name,
        identityJson: identity as object,
        intensity: parsed.data.intensity,
        limitsJson: {
          boundaries: parsed.data.boundaries,
          excludedThemes: identity.excludedThemes,
        } as object,
        active: true,
      },
    });

    const { track } = await import("@/lib/metrics");
    track("character_created");

    await prisma.conversation.create({
      data: {
        userId: user.id,
        characterId: character.id,
        title: `Con ${character.name}`,
      },
    });

    return Response.json({ character: { id: character.id, name: character.name } });
  } catch (error) {
    console.error("[characters POST]", error);
    const detail =
      error instanceof Error ? error.message : "Error desconocido";
    return Response.json(
      {
        error: `No se pudo generar el personaje: ${detail}`,
      },
      { status: 502 },
    );
  }
}
