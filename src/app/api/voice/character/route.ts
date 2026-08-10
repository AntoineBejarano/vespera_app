import { z } from "zod";
import { prisma } from "@/lib/db";
import { getAppUser } from "@/lib/session";
import { evaluateContentSafety, logSafetyBlock } from "@/lib/ai/safety";
import { resolveVoiceForCharacter } from "@/lib/voice/characters";
import { synthesizeSpeech } from "@/lib/voice/elevenlabs";
import {
  requireWorkspacePermission,
  resolveSessionWorkspaceId,
  workspaceAuthResponse,
  workspaceIdFromRequest,
} from "@/lib/workspace";

export const maxDuration = 30;

const bodySchema = z.object({
  text: z.string().min(1).max(2_000),
  characterId: z.string().min(1).max(120),
});

export async function POST(req: Request) {
  try {
    const user = await getAppUser({ or: "return-null" });
    if (!user) {
      return Response.json({ error: "Not authenticated" }, { status: 401 });
    }

    const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) {
      return Response.json({ error: "Invalid voice request" }, { status: 400 });
    }

    const workspaceId = await resolveSessionWorkspaceId(
      user,
      workspaceIdFromRequest(req),
    );
    await requireWorkspacePermission(user.id, workspaceId, "playground.run");

    const character = await prisma.character.findFirst({
      where: {
        id: parsed.data.characterId,
        workspaceId,
        archivedAt: null,
        isAdult: false,
      },
      select: { name: true, slug: true, isAdult: true },
    });
    if (!character) {
      return Response.json({ error: "Persona not available for voice" }, { status: 404 });
    }

    const safety = evaluateContentSafety(parsed.data.text);
    if (safety.blocked) {
      logSafetyBlock("character_voice_input", safety.rule, {
        userId: user.id,
        characterId: parsed.data.characterId,
      });
      return Response.json({ error: safety.userMessage }, { status: 400 });
    }

    const voice = resolveVoiceForCharacter(character);
    if (!voice) {
      return Response.json(
        { error: "Use browser voice for this persona", fallback: "browser" },
        {
          headers: {
            "Cache-Control": "private, no-store",
            "X-Vesperer-Voice-Fallback": "browser",
          },
        },
      );
    }
    if (!process.env.ELEVENLABS_API_KEY?.trim()) {
      return Response.json(
        { error: "Use browser voice for this persona", fallback: "browser" },
        {
          headers: {
            "Cache-Control": "private, no-store",
            "X-Vesperer-Voice-Fallback": "browser",
          },
        },
      );
    }

    const audio = await synthesizeSpeech({
      voiceId: voice.voiceId,
      fallbackVoiceId: voice.fallbackVoiceId,
      text: parsed.data.text,
      modelId: voice.modelId,
      speed: voice.speed ?? 1,
    });

    return new Response(new Uint8Array(audio), {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "private, no-store",
        "X-Vesperer-Voice": voice.label,
      },
    });
  } catch (error) {
    const auth = workspaceAuthResponse(error);
    if (auth) return auth;
    console.error("[api/voice/character]", error);
    return Response.json({ error: "Voice failed" }, { status: 500 });
  }
}
