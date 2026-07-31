const TELEGRAM_API = "https://api.telegram.org";

function requireToken(token?: string | null) {
  const t = token || process.env.TELEGRAM_BOT_TOKEN;
  if (!t) throw new Error("TELEGRAM_BOT_TOKEN missing");
  return t;
}

export async function telegramSendMessage(
  chatId: number | string,
  text: string,
  botToken?: string | null,
) {
  const token = requireToken(botToken);

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
  action: "typing" | "upload_photo" | "record_voice" | "upload_voice" = "typing",
  botToken?: string | null,
) {
  const token = botToken || process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return;
  await fetch(`${TELEGRAM_API}/bot${token}/sendChatAction`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, action }),
  });
}

/** Send an OGG/OPUS buffer as a Telegram voice note. */
export async function telegramSendVoice(
  chatId: number | string,
  audio: Buffer,
  botToken?: string | null,
  filename = "voice.ogg",
) {
  const token = requireToken(botToken);
  const form = new FormData();
  form.append("chat_id", String(chatId));
  form.append(
    "voice",
    new Blob([new Uint8Array(audio)], { type: "audio/ogg" }),
    filename,
  );

  const res = await fetch(`${TELEGRAM_API}/bot${token}/sendVoice`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Telegram sendVoice failed: ${body}`);
  }
}

export async function telegramSendPhoto(
  chatId: number | string,
  photoUrl: string,
  caption?: string | null,
  botToken?: string | null,
) {
  const token = requireToken(botToken);

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
