import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createTelegramLinkToken } from "@/lib/telegram/link";
import { getBotUsernameFromEnv } from "@/lib/telegram/api";
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

  const bot = getBotUsernameFromEnv();
  return Response.json({
    linked: Boolean(user?.telegramId),
    telegramId: user?.telegramId ?? null,
    howToAddress: user?.settings?.howToAddress ?? user?.name ?? null,
    botUsername: bot,
  });
}

const patchSchema = z.object({
  howToAddress: z.string().min(1).max(40).optional(),
  createLink: z.boolean().optional(),
});

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "No autenticado" }, { status: 401 });
  }

  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) {
    return Response.json({ error: "Datos inválidos" }, { status: 400 });
  }

  if (parsed.data.howToAddress) {
    await prisma.userSettings.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        howToAddress: parsed.data.howToAddress,
      },
      update: { howToAddress: parsed.data.howToAddress },
    });
    await prisma.user.update({
      where: { id: session.user.id },
      data: { name: parsed.data.howToAddress },
    });
  }

  if (parsed.data.createLink) {
    const token = await createTelegramLinkToken(session.user.id);
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
