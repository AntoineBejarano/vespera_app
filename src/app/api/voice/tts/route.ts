import { z } from "zod";
import { evaluateContentSafety, logSafetyBlock } from "@/lib/ai/safety";
import { getCharacterVoice } from "@/lib/voice/characters";
import { synthesizeSpeech } from "@/lib/voice/elevenlabs";

export const maxDuration = 30;

const bodySchema = z.object({
  text: z.string().min(1).max(2000),
  agent: z.enum(["luna", "einstein", "stoic-mentor", "tatiana"]),
});

export async function POST(req: Request) {
  if (!process.env.ELEVENLABS_API_KEY?.trim()) {
    return Response.json({ error: "Voice is unavailable" }, { status: 503 });
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return Response.json({ error: "Invalid voice request" }, { status: 400 });
  }

  const inputSafety = evaluateContentSafety(parsed.data.text);
  if (inputSafety.blocked) {
    logSafetyBlock("voice_tts_input", inputSafety.rule);
    return Response.json({ error: inputSafety.userMessage }, { status: 400 });
  }

  const voice = getCharacterVoice(parsed.data.agent);
  if (!voice) {
    return Response.json(
      { error: "No voice assigned for this character" },
      { status: 404 },
    );
  }

  try {
    const audio = await synthesizeSpeech({
      voiceId: voice.voiceId,
      fallbackVoiceId: voice.fallbackVoiceId,
      text: parsed.data.text,
      modelId: voice.modelId,
    });

    return new Response(new Uint8Array(audio), {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
        "X-Vesperer-Voice": voice.label,
      },
    });
  } catch (error) {
    console.error("[voice/tts]", error);
    return Response.json({ error: "Voice failed" }, { status: 500 });
  }
}
