import { prisma } from "@/lib/db";
import {
  roleHasCapability,
  type WorkspaceCapability,
} from "@/lib/workspace/capabilities";
import {
  isWorkspaceRole,
  type WorkspaceRole,
} from "@/lib/workspace/roles";

export class WorkspaceAuthError extends Error {
  status: number;
  code: string;

  constructor(message: string, status = 403, code = "FORBIDDEN") {
    super(message);
    this.name = "WorkspaceAuthError";
    this.status = status;
    this.code = code;
  }
}

export type WorkspaceMembership = {
  workspaceId: string;
  userId: string;
  role: WorkspaceRole;
};

export async function getWorkspaceMembership(
  userId: string,
  workspaceId: string,
): Promise<WorkspaceMembership | null> {
  const row = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: { workspaceId, userId },
    },
  });
  if (!row || !isWorkspaceRole(row.role)) return null;
  return {
    workspaceId: row.workspaceId,
    userId: row.userId,
    role: row.role,
  };
}

export async function listUserWorkspaces(userId: string) {
  return prisma.workspaceMember.findMany({
    where: { userId },
    include: {
      workspace: {
        select: {
          id: true,
          name: true,
          adultEnabled: true,
          createdAt: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });
}

/**
 * Authorize a concrete capability against Prisma membership.
 * Never calls Hexclave — IdP-portable.
 */
export async function requireWorkspacePermission(
  userId: string,
  workspaceId: string,
  capability: WorkspaceCapability,
): Promise<WorkspaceMembership> {
  const membership = await getWorkspaceMembership(userId, workspaceId);
  if (!membership) {
    throw new WorkspaceAuthError(
      "You are not a member of this workspace.",
      403,
      "NOT_A_MEMBER",
    );
  }
  if (!roleHasCapability(membership.role, capability)) {
    throw new WorkspaceAuthError(
      `Missing permission: ${capability}. Ask a workspace admin for a higher role.`,
      403,
      "MISSING_CAPABILITY",
    );
  }
  return membership;
}

export async function hasWorkspacePermission(
  userId: string,
  workspaceId: string,
  capability: WorkspaceCapability,
): Promise<boolean> {
  try {
    await requireWorkspacePermission(userId, workspaceId, capability);
    return true;
  } catch (err) {
    if (err instanceof WorkspaceAuthError) return false;
    throw err;
  }
}

export function workspaceAuthResponse(err: unknown): Response | null {
  if (!(err instanceof WorkspaceAuthError)) return null;
  return Response.json(
    { error: err.message, code: err.code },
    { status: err.status },
  );
}
