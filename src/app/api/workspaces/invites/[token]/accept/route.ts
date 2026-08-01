import { getAppUser } from "@/lib/session";
import { acceptWorkspaceInvite } from "@/lib/workspace/members";
import { workspaceAuthResponse } from "@/lib/workspace/permissions";

type Params = { params: Promise<{ token: string }> };

export async function POST(_req: Request, { params }: Params) {
  const user = await getAppUser();
  if (!user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }
  const { token } = await params;

  try {
    const member = await acceptWorkspaceInvite({
      token,
      userId: user.id,
      userEmail: user.email,
    });
    return Response.json({
      ok: true,
      workspaceId: member.workspaceId,
      role: member.role,
    });
  } catch (err) {
    const res = workspaceAuthResponse(err);
    if (res) return res;
    throw err;
  }
}
