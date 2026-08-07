import {
  createUIMessageStreamResponse,
  toUIMessageStream,
  type UIMessage,
} from "ai";
import { prisma } from "@/lib/db";
import { containsProhibitedMinorContent } from "@/lib/ai/safety";
import { checkAndIncrementDailyLimit } from "@/lib/memory/limits";
import { getActiveCharacter } from "@/lib/users";
import { streamCharacterReply } from "@/lib/chat/engine";
import { requireAppUser } from "@/lib/session";
import { paywallResponse } from "@/lib/billing/paywall";

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const user = await requireAppUser().catch(() => null);
    if (!user) {
      return Response.json({ error: "Not authenticated" }, { status: 401 });
    }
    const body = await req.json();
    const messages = (body.messages ?? []) as UIMessage[];
    const characterId = body.characterId as string | undefined;

    const character = characterId
      ? await prisma.character.findFirst({
          where: { id: characterId, userId: user.id },
        })
      : await getActiveCharacter(user.id);

    if (!character) {
      return Response.json(
        { error: "No hay personaje activo. Crea uno en /chat/new" },
        { status: 400 },
      );
    }

    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    const lastText =
      lastUser?.parts
        ?.filter((p): p is { type: "text"; text: string } => p.type === "text")
        .map((p) => p.text)
        .join("\n") ?? "";

    if (!lastText.trim()) {
      return Response.json({ error: "Mensaje vacío" }, { status: 400 });
    }

    if (containsProhibitedMinorContent(lastText)) {
      const { track } = await import("@/lib/metrics");
      track("safety_block");
      return Response.json(
        {
          error:
            "Contenido no permitido: vesperer.com es solo para adultos consentidos (18+). No se permite material sexual con menores ni age-play.",
        },
        { status: 400 },
      );
    }

    const limit = await checkAndIncrementDailyLimit(user.id);
    if (!limit.allowed) {
      const { track } = await import("@/lib/metrics");
      track("daily_limit_hit", { feature: "daily_messages" });
      return paywallResponse({
        userId: user.id,
        reason: "daily_message_limit",
        feature: "daily_messages",
        plan: "creator",
        limit: limit.limit,
        remaining: 0,
      });
    }

    const streamed = await streamCharacterReply({
      userId: user.id,
      message: lastText,
      characterId: character.id,
      partner: { channel: "web" },
      skipDailyLimit: true,
    });

    if (!streamed.ok) {
      if (streamed.status === 204) {
        return new Response(null, { status: 204 });
      }
      return Response.json(
        { error: streamed.error },
        { status: streamed.status },
      );
    }

    return createUIMessageStreamResponse({
      stream: toUIMessageStream({ stream: streamed.streamResult.stream }),
      headers: {
        "X-Daily-Remaining": String(limit.remaining),
        "X-Model": streamed.prepared.modelId,
        "X-Subject-Id": streamed.prepared.subjectId,
      },
    });
  } catch (error) {
    console.error("[api/chat]", error);
    const message =
      error instanceof Error ? error.message : "Error interno del servidor";
    if (message.includes("OPENROUTER") || message.includes("rate")) {
      const { track } = await import("@/lib/metrics");
      track("openrouter_error");
      return Response.json(
        {
          error:
            "OpenRouter no disponible o rate limit. Reintenta en unos segundos.",
        },
        { status: 502 },
      );
    }
    return Response.json({ error: message }, { status: 500 });
  }
}
