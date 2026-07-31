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

export async function synthesizeSpeech(params: {
  voiceId: string;
  text: string;
  modelId?: string;
  /** Telegram voice notes prefer OGG/OPUS. */
  outputFormat?: "mp3_44100_128" | "opus_48000_128";
}): Promise<Buffer> {
  const client = getElevenLabs();
  const audio = await client.textToSpeech.convert(params.voiceId, {
    text: params.text,
    modelId: params.modelId ?? "eleven_flash_v2_5",
    outputFormat: params.outputFormat ?? "mp3_44100_128",
  });

  if (Buffer.isBuffer(audio)) return audio;
  if (audio instanceof Uint8Array) return Buffer.from(audio);
  return streamToBuffer(audio);
}
