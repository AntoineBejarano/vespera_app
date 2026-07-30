import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ALLOWED_MODELS, resolveModel } from "@/lib/ai/models";
import { getDailyUsage } from "@/lib/memory/limits";
import { z } from "zod";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "No autenticado" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { settings: true },
  });
  if (!user) {
    return Response.json({ error: "Usuario no encontrado" }, { status: 404 });
  }

  const usage = await getDailyUsage(user.id);

  return Response.json({
    preferredModel: resolveModel(user.preferredModel),
    allowedModels: ALLOWED_MODELS,
    language: user.language,
    plan: user.plan,
    usage,
    adultConsentAt: user.adultConsentAt,
    howToAddress: user.settings?.howToAddress ?? user.name ?? null,
    name: user.name,
  });
}

const schema = z.object({
  preferredModel: z.string().optional(),
  language: z.string().optional(),
  intensityDefault: z.number().int().min(1).max(5).optional(),
});

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "No autenticado" }, { status: 401 });
  }

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return Response.json({ error: "Datos inválidos" }, { status: 400 });
  }

  if (
    parsed.data.preferredModel &&
    !ALLOWED_MODELS.includes(parsed.data.preferredModel)
  ) {
    return Response.json({ error: "Modelo no permitido" }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      preferredModel: parsed.data.preferredModel,
      language: parsed.data.language,
    },
  });

  if (parsed.data.preferredModel) {
    await prisma.userSettings.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        preferredModel: parsed.data.preferredModel,
      },
      update: { preferredModel: parsed.data.preferredModel },
    });
  }

  return Response.json({
    preferredModel: resolveModel(user.preferredModel),
  });
}
