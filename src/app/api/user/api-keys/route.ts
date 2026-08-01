import { getAppUser } from "@/lib/session";
import { needsAccountAgeGate } from "@/lib/legal/gate";
import {
  createUserApiKey,
  listUserApiKeys,
} from "@/lib/api-keys/user-keys";
import {
  requireWorkspacePermission,
  workspaceAuthResponse,
} from "@/lib/workspace/permissions";
import {
  resolveSessionWorkspaceId,
  workspaceIdFromRequest,
} from "@/lib/workspace/resolve";

export async function GET(req: Request) {
  const user = await getAppUser();
  if (!user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }
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
    const keys = await listUserApiKeys(workspaceId);
    return Response.json({ keys, workspaceId });
  } catch (err) {
    const res = workspaceAuthResponse(err);
    if (res) return res;
    throw err;
  }
}

export async function POST(req: Request) {
  const user = await getAppUser();
  if (!user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }
  if (needsAccountAgeGate(user)) {
    return Response.json({ error: "Age verification 18+ required" }, { status: 403 });
  }

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

    const body = await req.json().catch(() => ({}));
    const name = String(body.name ?? "cli").slice(0, 60);
    const created = await createUserApiKey(user.id, name, workspaceId);

    return Response.json({
      key: {
        id: created.id,
        name: created.name,
        keyPrefix: created.keyPrefix,
        lastFour: created.lastFour,
        /** Shown once — store it. */
        secret: created.secret,
      },
      workspaceId,
    });
  } catch (err) {
    const res = workspaceAuthResponse(err);
    if (res) return res;
    throw err;
  }
}
