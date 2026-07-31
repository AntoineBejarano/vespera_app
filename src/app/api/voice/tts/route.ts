import { z } from "zod";
import { getCharacterVoice } from "@/lib/voice/characters";
import { synthesizeSpeech } from "@/lib/voice/elevenlabs";

export const maxDuration = 30;

const bodySchema = z.object({
  text: z.string().min(1).max(2000),
  agent: z.enum(["luna", "einstein", "stoic-mentor", "tatiana"]),
});

export async function POST(req: Request) {
  if (!process.env.ELEVENLABS_API_KEY?.trim()) {
    return Response.json(
      { error: "ElevenLabs is not configured" },
      { status: 503 },
    );
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return Response.json({ error: "Invalid TTS payload" }, { status: 400 });
  }

  const voice = getCharacterVoice(parsed.data.agent);
  if (!voice) {
    return Response.json(
      {
        error: `No fixed ElevenLabs voice assigned for ${parsed.data.agent} yet.`,
      },
      { status: 404 },
    );
  }

  try {
    const audio = await synthesizeSpeech({
      voiceId: voice.voiceId,
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
    return Response.json({ error: "TTS failed" }, { status: 500 });
  }
}
