import { getAppUser } from "@/lib/session";
import { loadLivingMindSnapshot } from "@/lib/chat/living-mind";
import {
  resolveSessionWorkspaceId,
  workspaceAuthResponse,
  workspaceIdFromRequest,
} from "@/lib/workspace";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const user = await getAppUser({ or: "return-null" });
    if (!user) {
      return Response.json({ error: "Not authenticated" }, { status: 401 });
    }

    const characterId = new URL(req.url).searchParams.get("characterId")?.trim();
    if (!characterId) {
      return Response.json({ error: "characterId is required" }, { status: 400 });
    }

    const workspaceId = await resolveSessionWorkspaceId(
      user,
      workspaceIdFromRequest(req),
    );
    const mind = await loadLivingMindSnapshot({
      userId: user.id,
      workspaceId,
      characterId,
    });

    return Response.json(
      { mind },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    const auth = workspaceAuthResponse(error);
    if (auth) return auth;
    console.error("[api/chat/mind]", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Could not load mind" },
      { status: 500 },
    );
  }
}
