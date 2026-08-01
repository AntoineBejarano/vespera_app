import { getAppUser } from "@/lib/session";
import { revokeUserApiKey } from "@/lib/api-keys/user-keys";
import {
  requireWorkspacePermission,
  workspaceAuthResponse,
} from "@/lib/workspace/permissions";
import {
  resolveSessionWorkspaceId,
  workspaceIdFromRequest,
} from "@/lib/workspace/resolve";

export async function DELETE(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const user = await getAppUser();
  if (!user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }
  const { id } = await ctx.params;

  try {
    const workspaceId = await resolveSessionWorkspaceId(
      user,
      workspaceIdFromRequest(req),
    );
    await requireWorkspacePermission(
      user.id,
      workspaceId,
      "account_keys.manage",
    );
    const ok = await revokeUserApiKey(workspaceId, id);
    if (!ok) {
      return Response.json({ error: "Key not found" }, { status: 404 });
    }
    return Response.json({ ok: true });
  } catch (err) {
    const res = workspaceAuthResponse(err);
    if (res) return res;
    throw err;
  }
}
