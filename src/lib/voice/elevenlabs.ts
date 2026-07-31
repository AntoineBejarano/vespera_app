import "server-only";
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

export function getElevenLabs() {
  const apiKey = process.env.ELEVENLABS_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("Voice API key is not configured");
  }
  return new ElevenLabsClient({ apiKey });
}

async function streamToBuffer(
  stream: ReadableStream<Uint8Array>,
): Promise<Buffer> {
  const reader = stream.getReader();
  const chunks: Buffer[] = [];
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) chunks.push(Buffer.from(value));
  }
  return Buffer.concat(chunks);
}

function isPlanBlockedError(error: unknown): boolean {
  const e = error as {
    statusCode?: number;
    body?: { detail?: { code?: string } };
    message?: string;
  };
  if (e?.statusCode === 402) return true;
  if (e?.body?.detail?.code === "paid_plan_required") return true;
  return /paid_plan_required|payment_required/i.test(String(e?.message ?? ""));
}

async function convertOnce(params: {
  voiceId: string;
  text: string;
  modelId: string;
  outputFormat: "mp3_44100_128" | "opus_48000_128";
}): Promise<Buffer> {
  const client = getElevenLabs();
  const audio = await client.textToSpeech.convert(params.voiceId, {
    text: params.text,
    modelId: params.modelId,
    outputFormat: params.outputFormat,
  });

  if (Buffer.isBuffer(audio)) return audio;
  if (audio instanceof Uint8Array) return Buffer.from(audio);
  return streamToBuffer(audio);
}

export async function synthesizeSpeech(params: {
  voiceId: string;
  text: string;
  modelId?: string;
  fallbackVoiceId?: string;
  /** Telegram voice notes prefer OGG/OPUS. */
  outputFormat?: "mp3_44100_128" | "opus_48000_128";
}): Promise<Buffer> {
  const modelId = params.modelId ?? "eleven_flash_v2_5";
  const outputFormat = params.outputFormat ?? "mp3_44100_128";

  try {
    return await convertOnce({
      voiceId: params.voiceId,
      text: params.text,
      modelId,
      outputFormat,
    });
  } catch (error) {
    if (!params.fallbackVoiceId || !isPlanBlockedError(error)) throw error;
    console.warn(
      "[voice] cast voice blocked by plan; using fallback voice id",
    );
    return convertOnce({
      voiceId: params.fallbackVoiceId,
      text: params.text,
      modelId,
      outputFormat,
    });
  }
}
