import { getAppUser } from "@/lib/session";
import { listUserWorkspaces } from "@/lib/workspace/permissions";
import { ensurePersonalWorkspace } from "@/lib/workspace/ensure";
import { capabilitiesForRole, type WorkspaceCapability } from "@/lib/workspace/capabilities";
import { isWorkspaceRole } from "@/lib/workspace/roles";
import { prisma } from "@/lib/db";

/** List workspaces for the signed-in user + capabilities for the active one. */
export async function GET() {
  const user = await getAppUser();
  if (!user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  await ensurePersonalWorkspace(user);
  const refreshed =
    (await prisma.user.findUnique({ where: { id: user.id } })) ?? user;

  const memberships = await listUserWorkspaces(refreshed.id);
  const workspaces = memberships.map((m) => ({
    id: m.workspace.id,
    name: m.workspace.name,
    adultEnabled: m.workspace.adultEnabled,
    role: m.role,
    capabilities: isWorkspaceRole(m.role)
      ? capabilitiesForRole(m.role)
      : ([] as WorkspaceCapability[]),
  }));

  return Response.json({
    workspaces,
    activeWorkspaceId: refreshed.activeWorkspaceId,
  });
}
