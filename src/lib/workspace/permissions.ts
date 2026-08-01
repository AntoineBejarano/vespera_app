import { prisma } from "@/lib/db";
import {
  roleHasCapability,
  type WorkspaceCapability,
} from "@/lib/workspace/capabilities";
import {
  isWorkspaceRole,
  type WorkspaceRole,
} from "@/lib/workspace/roles";
import {
  getDebugRoleOverride,
  isSuperadminEmail,
} from "@/lib/platform/superadmin";

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
  /** True when role comes from superadmin debug override / synthetic access */
  debug?: boolean;
  /** Real DB role when debug override is active */
  realRole?: WorkspaceRole | null;
};

async function resolveUserEmail(userId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });
  return user?.email ?? null;
}

async function applyDebugRole(
  membership: WorkspaceMembership,
  email: string | null,
): Promise<WorkspaceMembership> {
  if (!isSuperadminEmail(email)) return membership;
  const override = await getDebugRoleOverride();
  if (!override) return membership;
  return {
    ...membership,
    role: override,
    debug: true,
    realRole: membership.realRole ?? membership.role,
  };
}

export async function getWorkspaceMembership(
  userId: string,
  workspaceId: string,
): Promise<WorkspaceMembership | null> {
  const row = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: { workspaceId, userId },
    },
  });

  const email = await resolveUserEmail(userId);

  if (row && isWorkspaceRole(row.role)) {
    return applyDebugRole(
      {
        workspaceId: row.workspaceId,
        userId: row.userId,
        role: row.role,
        realRole: row.role,
      },
      email,
    );
  }

  // Superadmin can enter any workspace (synthetic membership).
  if (isSuperadminEmail(email)) {
    const exists = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { id: true },
    });
    if (!exists) return null;
    const override = (await getDebugRoleOverride()) ?? "owner";
    return {
      workspaceId,
      userId,
      role: override,
      debug: true,
      realRole: null,
    };
  }

  return null;
}

export async function listUserWorkspaces(userId: string) {
  const email = await resolveUserEmail(userId);

  if (isSuperadminEmail(email)) {
    const all = await prisma.workspace.findMany({
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        name: true,
        adultEnabled: true,
        createdAt: true,
      },
    });
    const mine = await prisma.workspaceMember.findMany({
      where: { userId },
      select: { workspaceId: true, role: true },
    });
    const roleByWs = new Map(mine.map((m) => [m.workspaceId, m.role]));
    const override = await getDebugRoleOverride();

    return all.map((workspace) => {
      const real = roleByWs.get(workspace.id);
      const realRole =
        real && isWorkspaceRole(real) ? real : null;
      const role = override ?? realRole ?? ("owner" as WorkspaceRole);
      return {
        id: `debug-${workspace.id}`,
        workspaceId: workspace.id,
        userId,
        role,
        createdAt: workspace.createdAt,
        updatedAt: workspace.createdAt,
        workspace,
      };
    });
  }

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
 * Superadmins honor the debug-role cookie (default: full Owner access).
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
