import { randomBytes } from "crypto";
import { prisma } from "@/lib/db";
import {
  requireWorkspacePermission,
  WorkspaceAuthError,
} from "@/lib/workspace/permissions";

const TRANSFER_TTL_MS = 48 * 60 * 60 * 1000;

/**
 * Owner invariants:
 * 1. Exactly one Owner per workspace
 * 2. Owner cannot leave or remove themselves
 * 3. Transfer is atomic and requires acceptance
 * 4. After transfer, previous Owner becomes Admin
 */
export async function assertSingleOwner(workspaceId: string) {
  const owners = await prisma.workspaceMember.count({
    where: { workspaceId, role: "owner" },
  });
  if (owners !== 1) {
    throw new WorkspaceAuthError(
      "Workspace owner invariant violated",
      500,
      "OWNER_INVARIANT",
    );
  }
}

export async function leaveWorkspace(params: {
  userId: string;
  workspaceId: string;
}) {
  const member = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId: params.workspaceId,
        userId: params.userId,
      },
    },
  });
  if (!member) {
    throw new WorkspaceAuthError("Not a member", 404, "NOT_A_MEMBER");
  }
  if (member.role === "owner") {
    throw new WorkspaceAuthError(
      "Owner cannot leave. Transfer ownership first.",
      403,
      "OWNER_CANNOT_LEAVE",
    );
  }
  await prisma.workspaceMember.delete({ where: { id: member.id } });
  const next = await prisma.workspaceMember.findFirst({
    where: { userId: params.userId },
    orderBy: { createdAt: "asc" },
  });
  await prisma.user.update({
    where: { id: params.userId },
    data: { activeWorkspaceId: next?.workspaceId ?? null },
  });
}

export async function startOwnershipTransfer(params: {
  actorUserId: string;
  workspaceId: string;
  toUserId: string;
}) {
  await requireWorkspacePermission(
    params.actorUserId,
    params.workspaceId,
    "ownership.transfer",
  );
  await assertSingleOwner(params.workspaceId);

  if (params.toUserId === params.actorUserId) {
    throw new WorkspaceAuthError(
      "Cannot transfer ownership to yourself",
      400,
      "INVALID_TARGET",
    );
  }

  const target = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId: params.workspaceId,
        userId: params.toUserId,
      },
    },
  });
  if (!target) {
    throw new WorkspaceAuthError(
      "New owner must already be a workspace member",
      400,
      "TARGET_NOT_MEMBER",
    );
  }

  await prisma.workspaceOwnershipTransfer.updateMany({
    where: {
      workspaceId: params.workspaceId,
      acceptedAt: null,
      cancelledAt: null,
    },
    data: { cancelledAt: new Date() },
  });

  return prisma.workspaceOwnershipTransfer.create({
    data: {
      workspaceId: params.workspaceId,
      fromUserId: params.actorUserId,
      toUserId: params.toUserId,
      token: randomBytes(24).toString("hex"),
      expiresAt: new Date(Date.now() + TRANSFER_TTL_MS),
    },
  });
}

export async function acceptOwnershipTransfer(params: {
  token: string;
  userId: string;
}) {
  const transfer = await prisma.workspaceOwnershipTransfer.findUnique({
    where: { token: params.token },
  });
  if (!transfer || transfer.cancelledAt || transfer.acceptedAt) {
    throw new WorkspaceAuthError("Transfer not found", 404, "NOT_FOUND");
  }
  if (transfer.expiresAt.getTime() < Date.now()) {
    throw new WorkspaceAuthError("Transfer expired", 410, "EXPIRED");
  }
  if (transfer.toUserId !== params.userId) {
    throw new WorkspaceAuthError(
      "Only the designated new owner can accept",
      403,
      "NOT_TRANSFEREE",
    );
  }

  await prisma.$transaction(async (tx) => {
    const owners = await tx.workspaceMember.findMany({
      where: { workspaceId: transfer.workspaceId, role: "owner" },
    });
    if (owners.length !== 1 || owners[0].userId !== transfer.fromUserId) {
      throw new WorkspaceAuthError(
        "Owner invariant failed",
        500,
        "OWNER_INVARIANT",
      );
    }

    await tx.workspaceMember.update({
      where: { id: owners[0].id },
      data: { role: "admin" },
    });

    await tx.workspaceMember.upsert({
      where: {
        workspaceId_userId: {
          workspaceId: transfer.workspaceId,
          userId: transfer.toUserId,
        },
      },
      create: {
        workspaceId: transfer.workspaceId,
        userId: transfer.toUserId,
        role: "owner",
      },
      update: { role: "owner" },
    });

    await tx.workspaceOwnershipTransfer.update({
      where: { id: transfer.id },
      data: { acceptedAt: new Date() },
    });
  });

  await assertSingleOwner(transfer.workspaceId);
  return { workspaceId: transfer.workspaceId };
}

function normalizeWorkspaceConfirm(value: string) {
  return value
    .normalize("NFKC")
    .replace(/[\u2018\u2019\u201A\u2032]/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function confirmMatchesWorkspace(confirmName: string, workspaceName: string) {
  const confirm = normalizeWorkspaceConfirm(confirmName);
  if (!confirm) return false;
  if (confirm.toUpperCase() === "DELETE") return true;
  return confirm === normalizeWorkspaceConfirm(workspaceName);
}

export async function deleteWorkspace(params: {
  actorUserId: string;
  workspaceId: string;
  confirmName: string;
}) {
  await requireWorkspacePermission(
    params.actorUserId,
    params.workspaceId,
    "workspace.delete",
  );
  const workspace = await prisma.workspace.findUnique({
    where: { id: params.workspaceId },
  });
  if (!workspace) {
    throw new WorkspaceAuthError("Workspace not found", 404, "NOT_FOUND");
  }
  if (!confirmMatchesWorkspace(params.confirmName, workspace.name)) {
    throw new WorkspaceAuthError(
      'Type DELETE or the exact workspace name to confirm',
      400,
      "NAME_MISMATCH",
    );
  }

  const membership = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId: params.workspaceId,
        userId: params.actorUserId,
      },
    },
  });
  if (membership?.role === "owner") {
    const ownedCount = await prisma.workspaceMember.count({
      where: { userId: params.actorUserId, role: "owner" },
    });
    if (ownedCount <= 1) {
      throw new WorkspaceAuthError(
        "You need at least one workspace. Create another before deleting this one.",
        400,
        "LAST_WORKSPACE",
      );
    }
  }

  const fallback = await prisma.workspaceMember.findFirst({
    where: {
      userId: params.actorUserId,
      workspaceId: { not: params.workspaceId },
      role: "owner",
    },
    orderBy: { createdAt: "asc" },
    select: { workspaceId: true },
  });

  await prisma.$transaction(async (tx) => {
    await tx.user.updateMany({
      where: { activeWorkspaceId: params.workspaceId },
      data: { activeWorkspaceId: fallback?.workspaceId ?? null },
    });
    await tx.workspace.delete({ where: { id: params.workspaceId } });
  });
}
