import { auth } from "@/lib/auth";
import { runCharacterReply } from "@/lib/chat/engine";
import { requireUser } from "@/lib/users";

export const maxDuration = 60;

/**
 * Admin/test chat — same engine as Telegram (bubbles + optional photo).
 */
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: "Not authenticated" }, { status: 401 });
    }

    await requireUser(session.user.id);
    const body = await req.json();
    const message = String(body.message ?? "").trim();
    const characterId = body.characterId as string | undefined;

    const result = await runCharacterReply({
      userId: session.user.id,
      message,
      characterId,
      partner: { channel: "web" },
    });

    if (!result.ok) {
      return Response.json(
        { error: result.error },
        { status: result.status },
      );
    }

    return Response.json({
      text: result.text,
      bubbles: result.bubbles,
      photo: result.photo,
      characterName: result.characterName,
      modelId: result.modelId,
    });
  } catch (error) {
    console.error("[api/chat/reply]", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return Response.json({ error: message }, { status: 500 });
  }
}
