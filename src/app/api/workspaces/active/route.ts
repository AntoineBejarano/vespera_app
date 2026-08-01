import { z } from "zod";
import { getAppUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import {
  getWorkspaceMembership,
  workspaceAuthResponse,
  WorkspaceAuthError,
} from "@/lib/workspace/permissions";

const bodySchema = z.object({
  workspaceId: z.string().min(1),
});

/** Set active workspace (UX context only — authz still checks membership). */
export async function POST(req: Request) {
  const user = await getAppUser();
  if (!user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "workspaceId required" }, { status: 400 });
  }

  try {
    const membership = await getWorkspaceMembership(
      user.id,
      parsed.data.workspaceId,
    );
    if (!membership) {
      throw new WorkspaceAuthError(
        "You are not a member of this workspace.",
        403,
        "NOT_A_MEMBER",
      );
    }
    await prisma.user.update({
      where: { id: user.id },
      data: { activeWorkspaceId: parsed.data.workspaceId },
    });
    return Response.json({
      activeWorkspaceId: parsed.data.workspaceId,
      role: membership.role,
    });
  } catch (err) {
    const res = workspaceAuthResponse(err);
    if (res) return res;
    throw err;
  }
}
