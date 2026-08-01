import type { User } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { getOrCreateActiveWorkspaceId } from "@/lib/workspace/ensure";
import {
  WorkspaceAuthError,
  getWorkspaceMembership,
} from "@/lib/workspace/permissions";

/**
 * Resolve workspace for a session user.
 * Header/query is UX context only — membership must exist in Prisma.
 */
export async function resolveSessionWorkspaceId(
  user: User,
  requestedWorkspaceId?: string | null,
): Promise<string> {
  if (requestedWorkspaceId) {
    const membership = await getWorkspaceMembership(
      user.id,
      requestedWorkspaceId,
    );
    if (!membership) {
      throw new WorkspaceAuthError(
        "You are not a member of this workspace.",
        403,
        "NOT_A_MEMBER",
      );
    }
    if (user.activeWorkspaceId !== requestedWorkspaceId) {
      await prisma.user.update({
        where: { id: user.id },
        data: { activeWorkspaceId: requestedWorkspaceId },
      });
    }
    return requestedWorkspaceId;
  }
  return getOrCreateActiveWorkspaceId(user);
}

export function workspaceIdFromRequest(req: Request): string | null {
  const header = req.headers.get("x-workspace-id")?.trim();
  if (header) return header;
  try {
    const url = new URL(req.url);
    return url.searchParams.get("workspaceId")?.trim() || null;
  } catch {
    return null;
  }
}
