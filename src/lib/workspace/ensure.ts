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
 * Ensure a non-peer user has a personal workspace and is Owner.
 * Idempotent. Does not create remote Hexclave teams (adapter may sync later).
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
    if (user.activeWorkspaceId !== existing.workspaceId) {
      await prisma.user.update({
        where: { id: user.id },
        data: { activeWorkspaceId: existing.workspaceId },
      });
    }
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
