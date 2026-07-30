const TELEGRAM_API = "https://api.telegram.org";

export async function telegramSendMessage(
  chatId: number | string,
  text: string,
) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN missing");

  // Telegram max ~4096; split if needed
  const chunks: string[] = [];
  let rest = text;
  while (rest.length > 4000) {
    chunks.push(rest.slice(0, 4000));
    rest = rest.slice(4000);
  }
  chunks.push(rest);

  for (const chunk of chunks) {
    const res = await fetch(`${TELEGRAM_API}/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: chunk,
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Telegram send failed: ${body}`);
    }
  }
}

export async function telegramSendChatAction(
  chatId: number | string,
  action: "typing" | "upload_photo" = "typing",
) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return;
  await fetch(`${TELEGRAM_API}/bot${token}/sendChatAction`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, action }),
  });
}

export async function telegramSendPhoto(
  chatId: number | string,
  photoUrl: string,
  caption?: string | null,
) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN missing");

  const res = await fetch(`${TELEGRAM_API}/bot${token}/sendPhoto`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      photo: photoUrl,
      caption: caption?.slice(0, 1024) || undefined,
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Telegram sendPhoto failed: ${body}`);
  }
}

export function getBotUsernameFromEnv() {
  return process.env.TELEGRAM_BOT_USERNAME?.replace(/^@/, "") ?? null;
}
