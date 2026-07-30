import { prisma } from "@/lib/db";
import { createTelegramLinkToken } from "@/lib/telegram/link";
import { getBotUsernameFromEnv } from "@/lib/telegram/api";
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

  const bot = getBotUsernameFromEnv();
  return Response.json({
    linked: Boolean(profile?.telegramId),
    telegramId: profile?.telegramId ?? null,
    telegramFirstName: profile?.telegramFirstName ?? null,
    telegramUsername: profile?.telegramUsername ?? null,
    howToAddress: profile?.settings?.howToAddress ?? null,
    botUsername: bot,
  });
}

const patchSchema = z.object({
  howToAddress: z.string().min(1).max(40).optional(),
  createLink: z.boolean().optional(),
});

export async function PATCH(req: Request) {
  const user = await getAppUser();
  if (!user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) {
    return Response.json({ error: "Datos inválidos" }, { status: 400 });
  }

  if (parsed.data.howToAddress) {
    await prisma.userSettings.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        howToAddress: parsed.data.howToAddress,
      },
      update: { howToAddress: parsed.data.howToAddress },
    });
    // Do NOT overwrite user.name — Telegram first_name is the real identity
  }

  if (parsed.data.createLink) {
    const token = await createTelegramLinkToken(user.id);
    const bot = getBotUsernameFromEnv();
    const deepLink = bot
      ? `https://t.me/${bot}?start=${token}`
      : null;
    return Response.json({
      token,
      deepLink,
      instruction: deepLink
        ? `Abre este enlace en Telegram y pulsa Start: ${deepLink}`
        : `En Telegram escribe a tu bot: /start ${token}`,
    });
  }

  return Response.json({ ok: true });
}
