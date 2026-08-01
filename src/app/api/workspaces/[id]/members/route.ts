import { z } from "zod";
import { getAppUser } from "@/lib/session";
import {
  inviteWorkspaceMember,
  listWorkspaceMembers,
  removeWorkspaceMember,
  updateMemberRole,
} from "@/lib/workspace/members";
import {
  hasWorkspacePermission,
  requireWorkspacePermission,
  workspaceAuthResponse,
} from "@/lib/workspace/permissions";
import { ROLE_LABELS } from "@/lib/workspace/roles";

type Params = { params: Promise<{ id: string }> };

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(["admin", "editor", "viewer"]),
});

const patchSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(["admin", "editor", "viewer"]),
});

export async function GET(_req: Request, { params }: Params) {
  const user = await getAppUser();
  if (!user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }
  const { id: workspaceId } = await params;

  try {
    await requireWorkspacePermission(user.id, workspaceId, "workspace.read");
    const members = await listWorkspaceMembers(workspaceId);
    const canManage = await hasWorkspacePermission(
      user.id,
      workspaceId,
      "members.manage",
    );
    const canInviteAdmin = await hasWorkspacePermission(
      user.id,
      workspaceId,
      "members.manage_admins",
    );
    return Response.json({
      members: members.map((m) => ({
        id: m.id,
        userId: m.userId,
        role: m.role,
        roleLabel: ROLE_LABELS[m.role as keyof typeof ROLE_LABELS] ?? m.role,
        name: m.user.name,
        email: m.user.email,
        image: m.user.image,
        createdAt: m.createdAt,
      })),
      canManage,
      canInviteAdmin,
    });
  } catch (err) {
    const res = workspaceAuthResponse(err);
    if (res) return res;
    throw err;
  }
}

export async function POST(req: Request, { params }: Params) {
  const user = await getAppUser();
  if (!user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }
  const { id: workspaceId } = await params;
  const parsed = inviteSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "email and role required" }, { status: 400 });
  }

  try {
    const invite = await inviteWorkspaceMember({
      actorUserId: user.id,
      workspaceId,
      email: parsed.data.email,
      role: parsed.data.role,
    });
    return Response.json(
      {
        invite: {
          id: invite.id,
          email: invite.email,
          role: invite.role,
          expiresAt: invite.expiresAt,
          token: invite.token,
          acceptPath: `/workspaces/invites/${invite.token}`,
        },
      },
      { status: 201 },
    );
  } catch (err) {
    const res = workspaceAuthResponse(err);
    if (res) return res;
    throw err;
  }
}

export async function PATCH(req: Request, { params }: Params) {
  const user = await getAppUser();
  if (!user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }
  const { id: workspaceId } = await params;
  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "userId and role required" }, { status: 400 });
  }

  try {
    const member = await updateMemberRole({
      actorUserId: user.id,
      workspaceId,
      targetUserId: parsed.data.userId,
      role: parsed.data.role,
    });
    return Response.json({ member: { userId: member.userId, role: member.role } });
  } catch (err) {
    const res = workspaceAuthResponse(err);
    if (res) return res;
    throw err;
  }
}

export async function DELETE(req: Request, { params }: Params) {
  const user = await getAppUser();
  if (!user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }
  const { id: workspaceId } = await params;
  const targetUserId = new URL(req.url).searchParams.get("userId");
  if (!targetUserId) {
    return Response.json({ error: "userId required" }, { status: 400 });
  }

  try {
    await removeWorkspaceMember({
      actorUserId: user.id,
      workspaceId,
      targetUserId,
    });
    return Response.json({ ok: true });
  } catch (err) {
    const res = workspaceAuthResponse(err);
    if (res) return res;
    throw err;
  }
}
