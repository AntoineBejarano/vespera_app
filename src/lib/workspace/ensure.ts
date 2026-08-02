import { prisma } from "@/lib/db";
import type { User, Workspace } from "@/generated/prisma/client";

function personalWorkspaceName(user: Pick<User, "name" | "email">) {
  const base =
    user.name?.trim() ||
    user.email?.split("@")[0] ||
    "Personal";
  return `${base}'s workspace`;
}

/**
 * Ensure a non-peer user has at least one owned workspace.
 * Idempotent. Never overwrites a valid activeWorkspaceId.
 */
export async function ensurePersonalWorkspace(user: User): Promise<Workspace> {
  if (user.isTelegramPeer) {
    throw new Error("TELEGRAM_PEER_NO_WORKSPACE");
  }

  const existing = await prisma.workspaceMember.findFirst({
    where: { userId: user.id, role: "owner" },
    include: { workspace: true },
    orderBy: { createdAt: "asc" },
  });
  if (existing) {
    // Only set active when missing or pointing at a workspace the user left
    if (user.activeWorkspaceId) {
      const stillMember = await prisma.workspaceMember.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId: user.activeWorkspaceId,
            userId: user.id,
          },
        },
      });
      if (stillMember) return existing.workspace;
    }
    await prisma.user.update({
      where: { id: user.id },
      data: { activeWorkspaceId: existing.workspaceId },
    });
    return existing.workspace;
  }

  const workspace = await prisma.workspace.create({
    data: {
      name: personalWorkspaceName(user),
      members: {
        create: {
          userId: user.id,
          role: "owner",
        },
      },
    },
  });

  await prisma.user.update({
    where: { id: user.id },
    data: { activeWorkspaceId: workspace.id },
  });

  return workspace;
}

/** Create an additional workspace; caller becomes Owner. */
export async function createWorkspace(params: {
  user: User;
  name: string;
  switchTo?: boolean;
}): Promise<Workspace> {
  if (params.user.isTelegramPeer) {
    throw new Error("TELEGRAM_PEER_NO_WORKSPACE");
  }
  const name = params.name.trim().slice(0, 80);
  if (!name) throw new Error("Workspace name required");

  const workspace = await prisma.workspace.create({
    data: {
      name,
      members: {
        create: {
          userId: params.user.id,
          role: "owner",
        },
      },
    },
  });

  if (params.switchTo !== false) {
    await prisma.user.update({
      where: { id: params.user.id },
      data: { activeWorkspaceId: workspace.id },
    });
  }

  return workspace;
}

export async function getOrCreateActiveWorkspaceId(user: User): Promise<string> {
  if (user.activeWorkspaceId) {
    const member = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: user.activeWorkspaceId,
          userId: user.id,
        },
      },
    });
    if (member) return user.activeWorkspaceId;
  }
  const ws = await ensurePersonalWorkspace(user);
  return ws.id;
}
