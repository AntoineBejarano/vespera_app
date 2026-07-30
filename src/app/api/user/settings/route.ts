import { prisma } from "@/lib/db";
import { ALLOWED_MODELS, resolveModel } from "@/lib/ai/models";
import { getDailyUsage } from "@/lib/memory/limits";
import { z } from "zod";
import { requireAppUser, getAppUser } from "@/lib/session";

export async function GET() {
  const user = await getAppUser();
  if (!user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  const profile = await prisma.user.findUnique({
    where: { id: user.id },
    include: { settings: true },
  });
  if (!profile) {
    return Response.json({ error: "User not found" }, { status: 404 });
  }

  const usage = await getDailyUsage(profile.id);

  return Response.json({
    preferredModel: resolveModel(profile.preferredModel),
    allowedModels: ALLOWED_MODELS,
    language: profile.language,
    plan: profile.plan,
    usage,
    adultConsentAt: profile.adultConsentAt,
    howToAddress: profile.settings?.howToAddress ?? profile.name ?? null,
    name: profile.name,
  });
}

const schema = z.object({
  preferredModel: z.string().optional(),
  language: z.string().optional(),
  intensityDefault: z.number().int().min(1).max(5).optional(),
});

export async function PATCH(req: Request) {
  const user = await getAppUser();
  if (!user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
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

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      preferredModel: parsed.data.preferredModel,
      language: parsed.data.language,
    },
  });

  if (parsed.data.preferredModel) {
    await prisma.userSettings.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        preferredModel: parsed.data.preferredModel,
      },
      update: { preferredModel: parsed.data.preferredModel },
    });
  }

  return Response.json({
    preferredModel: resolveModel(updated.preferredModel),
  });
}
