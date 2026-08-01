import { randomBytes } from "crypto";
import { prisma } from "@/lib/db";
import { getWorkspaceAuthPort } from "@/lib/workspace/auth";
import {
  requireWorkspacePermission,
  WorkspaceAuthError,
} from "@/lib/workspace/permissions";
import {
  isInvitableRole,
  type InvitableRole,
  type WorkspaceRole,
} from "@/lib/workspace/roles";

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export async function listWorkspaceMembers(workspaceId: string) {
  return prisma.workspaceMember.findMany({
    where: { workspaceId },
    include: {
      user: {
        select: { id: true, name: true, email: true, image: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function inviteWorkspaceMember(params: {
  actorUserId: string;
  workspaceId: string;
  email: string;
  role: string;
}) {
  const email = params.email.trim().toLowerCase();
  if (!email || !email.includes("@")) {
    throw new WorkspaceAuthError("Valid email required", 400, "INVALID_EMAIL");
  }
  if (!isInvitableRole(params.role)) {
    throw new WorkspaceAuthError(
      "Role must be admin, editor, or viewer",
      400,
      "INVALID_ROLE",
    );
  }
  const role = params.role as InvitableRole;

  if (role === "admin") {
    await requireWorkspacePermission(
      params.actorUserId,
      params.workspaceId,
      "members.manage_admins",
    );
  } else {
    await requireWorkspacePermission(
      params.actorUserId,
      params.workspaceId,
      "members.manage",
    );
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    const already = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: params.workspaceId,
          userId: existingUser.id,
        },
      },
    });
    if (already) {
      throw new WorkspaceAuthError(
        "User is already a member",
        409,
        "ALREADY_MEMBER",
      );
    }
  }

  await prisma.workspaceInvite.updateMany({
    where: {
      workspaceId: params.workspaceId,
      email,
      acceptedAt: null,
      revokedAt: null,
    },
    data: { revokedAt: new Date() },
  });

  const token = randomBytes(24).toString("hex");
  const invite = await prisma.workspaceInvite.create({
    data: {
      workspaceId: params.workspaceId,
      email,
      role,
      token,
      invitedByUserId: params.actorUserId,
      expiresAt: new Date(Date.now() + INVITE_TTL_MS),
    },
  });

  const workspace = await prisma.workspace.findUniqueOrThrow({
    where: { id: params.workspaceId },
  });

  const auth = getWorkspaceAuthPort();
  await auth.inviteRemoteMember({
    externalTeamId: workspace.externalAuthTeamId,
    email,
    role,
  });

  return invite;
}

export async function acceptWorkspaceInvite(params: {
  token: string;
  userId: string;
  userEmail: string | null;
}) {
  const invite = await prisma.workspaceInvite.findUnique({
    where: { token: params.token },
  });
  if (!invite || invite.revokedAt || invite.acceptedAt) {
    throw new WorkspaceAuthError("Invite not found", 404, "INVITE_NOT_FOUND");
  }
  if (invite.expiresAt.getTime() < Date.now()) {
    throw new WorkspaceAuthError("Invite expired", 410, "INVITE_EXPIRED");
  }
  const email = params.userEmail?.toLowerCase();
  if (!email || email !== invite.email.toLowerCase()) {
    throw new WorkspaceAuthError(
      "Sign in with the invited email address",
      403,
      "EMAIL_MISMATCH",
    );
  }
  if (!isInvitableRole(invite.role)) {
    throw new WorkspaceAuthError("Invalid invite role", 400, "INVALID_ROLE");
  }

  const member = await prisma.$transaction(async (tx) => {
    const created = await tx.workspaceMember.upsert({
      where: {
        workspaceId_userId: {
          workspaceId: invite.workspaceId,
          userId: params.userId,
        },
      },
      create: {
        workspaceId: invite.workspaceId,
        userId: params.userId,
        role: invite.role,
      },
      update: {},
    });
    await tx.workspaceInvite.update({
      where: { id: invite.id },
      data: { acceptedAt: new Date() },
    });
    await tx.user.update({
      where: { id: params.userId },
      data: { activeWorkspaceId: invite.workspaceId },
    });
    return created;
  });

  return member;
}

export async function updateMemberRole(params: {
  actorUserId: string;
  workspaceId: string;
  targetUserId: string;
  role: string;
}) {
  if (!isInvitableRole(params.role) && params.role !== "admin") {
    throw new WorkspaceAuthError("Invalid role", 400, "INVALID_ROLE");
  }

  const target = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId: params.workspaceId,
        userId: params.targetUserId,
      },
    },
  });
  if (!target) {
    throw new WorkspaceAuthError("Member not found", 404, "NOT_FOUND");
  }
  if (target.role === "owner") {
    throw new WorkspaceAuthError(
      "Cannot change the Owner role. Transfer ownership instead.",
      403,
      "OWNER_IMMUTABLE",
    );
  }

  const nextRole = params.role as WorkspaceRole;
  const elevatesToAdmin = nextRole === "admin" || target.role === "admin";
  if (elevatesToAdmin) {
    await requireWorkspacePermission(
      params.actorUserId,
      params.workspaceId,
      "members.manage_admins",
    );
  } else {
    await requireWorkspacePermission(
      params.actorUserId,
      params.workspaceId,
      "members.manage",
    );
  }

  if (nextRole === "admin" && target.role !== "admin") {
    await requireWorkspacePermission(
      params.actorUserId,
      params.workspaceId,
      "members.manage_admins",
    );
  }

  return prisma.workspaceMember.update({
    where: { id: target.id },
    data: { role: nextRole },
  });
}

export async function removeWorkspaceMember(params: {
  actorUserId: string;
  workspaceId: string;
  targetUserId: string;
}) {
  const target = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId: params.workspaceId,
        userId: params.targetUserId,
      },
    },
  });
  if (!target) {
    throw new WorkspaceAuthError("Member not found", 404, "NOT_FOUND");
  }
  if (target.role === "owner") {
    throw new WorkspaceAuthError(
      "Owner cannot be removed. Transfer ownership first.",
      403,
      "OWNER_IMMUTABLE",
    );
  }

  if (target.role === "admin") {
    await requireWorkspacePermission(
      params.actorUserId,
      params.workspaceId,
      "members.manage_admins",
    );
  } else {
    await requireWorkspacePermission(
      params.actorUserId,
      params.workspaceId,
      "members.manage",
    );
  }

  if (params.actorUserId === params.targetUserId) {
    throw new WorkspaceAuthError(
      "Use leave workspace instead of removing yourself.",
      400,
      "USE_LEAVE",
    );
  }

  await prisma.workspaceMember.delete({ where: { id: target.id } });
  return true;
}
