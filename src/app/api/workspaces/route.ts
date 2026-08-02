import { z } from "zod";
import { getAppUser } from "@/lib/session";
import {
  getWorkspaceMembership,
  listUserWorkspaces,
} from "@/lib/workspace/permissions";
import {
  createWorkspace,
  ensurePersonalWorkspace,
} from "@/lib/workspace/ensure";
import { capabilitiesForRole, type WorkspaceCapability } from "@/lib/workspace/capabilities";
import { isWorkspaceRole } from "@/lib/workspace/roles";
import { prisma } from "@/lib/db";
import {
  getDebugRoleOverride,
  isSuperadminUser,
} from "@/lib/platform/superadmin";

const createSchema = z.object({
  name: z.string().min(1).max(80),
  switchTo: z.boolean().optional(),
});

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
  const workspaces = memberships.map((m) => {
    const role = isWorkspaceRole(m.role) ? m.role : "viewer";
    return {
      id: m.workspace.id,
      name: m.workspace.name,
      adultEnabled: m.workspace.adultEnabled,
      role,
      capabilities: capabilitiesForRole(role) as WorkspaceCapability[],
    };
  });

  const activeId = refreshed.activeWorkspaceId;
  const activeMembership = activeId
    ? await getWorkspaceMembership(refreshed.id, activeId)
    : null;

  return Response.json({
    workspaces,
    activeWorkspaceId: activeId,
    isSuperadmin: isSuperadminUser(refreshed),
    debugRole: isSuperadminUser(refreshed)
      ? await getDebugRoleOverride()
      : null,
    activeRole: activeMembership?.role ?? null,
    activeCapabilities: activeMembership
      ? capabilitiesForRole(activeMembership.role)
      : [],
  });
}

/** Create an additional workspace; caller becomes Owner. */
export async function POST(req: Request) {
  const user = await getAppUser();
  if (!user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }
  if (user.isTelegramPeer) {
    return Response.json({ error: "Not allowed" }, { status: 403 });
  }

  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "name required" }, { status: 400 });
  }

  try {
    const workspace = await createWorkspace({
      user,
      name: parsed.data.name,
      switchTo: parsed.data.switchTo,
    });
    return Response.json(
      {
        workspace: {
          id: workspace.id,
          name: workspace.name,
          adultEnabled: workspace.adultEnabled,
          role: "owner",
        },
      },
      { status: 201 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed";
    return Response.json({ error: message }, { status: 400 });
  }
}
