import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

/**
 * Webhook stub for Telegram. Enable when TELEGRAM_BOT_TOKEN + TELEGRAM_WEBHOOK_SECRET are set.
 * Validates secret header and acknowledges updates; full message routing is post-MVP.
 */
export async function POST(req: Request) {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!secret) {
    return Response.json({ error: "Telegram no configurado" }, { status: 503 });
  }

  const header = req.headers.get("x-telegram-bot-api-secret-token");
  if (header !== secret) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const update = await req.json();
  console.info("[telegram webhook]", {
    updateId: update.update_id,
    from: update.message?.from?.id,
  });

  // Linking flow can use deep-link tokens stored in Redis; web session optional.
  const session = await auth();
  if (session?.user?.id && update.message?.from?.id) {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { telegramId: String(update.message.from.id) },
    });
  }

  return Response.json({ ok: true });
}
