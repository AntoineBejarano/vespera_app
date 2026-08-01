import { cookies } from "next/headers";
import { z } from "zod";
import { getAppUser } from "@/lib/session";
import {
  DEBUG_ROLE_COOKIE,
  getDebugRoleOverride,
  isSuperadminUser,
} from "@/lib/platform/superadmin";
import {
  capabilitiesForRole,
  ROLE_CAPABILITIES,
} from "@/lib/workspace/capabilities";
import {
  isWorkspaceRole,
  ROLE_LABELS,
  WORKSPACE_ROLES,
  type WorkspaceRole,
} from "@/lib/workspace/roles";

const bodySchema = z.object({
  /** Workspace role to simulate, or "real" to clear override */
  role: z.union([z.enum(WORKSPACE_ROLES), z.literal("real")]),
});

/** Superadmin-only: current debug role + capability matrix. */
export async function GET() {
  const user = await getAppUser();
  if (!user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }
  if (!isSuperadminUser(user)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const override = await getDebugRoleOverride();
  const effective = override ?? "owner";

  return Response.json({
    isSuperadmin: true,
    email: user.email,
    debugRole: override,
    effectiveRole: effective,
    roleLabel: ROLE_LABELS[effective],
    capabilities: capabilitiesForRole(effective),
    roles: WORKSPACE_ROLES.map((role) => ({
      id: role,
      label: ROLE_LABELS[role],
      capabilities: [...ROLE_CAPABILITIES[role]],
    })),
  });
}

/** Superadmin-only: set role impersonation cookie. */
export async function POST(req: Request) {
  const user = await getAppUser();
  if (!user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }
  if (!isSuperadminUser(user)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return Response.json(
      { error: "role must be owner|admin|editor|viewer|real" },
      { status: 400 },
    );
  }

  const jar = await cookies();
  if (parsed.data.role === "real") {
    jar.delete(DEBUG_ROLE_COOKIE);
    return Response.json({
      ok: true,
      debugRole: null,
      effectiveRole: null,
      note: "Using real membership roles (Owner access for workspaces you are not in).",
    });
  }

  const role = parsed.data.role as WorkspaceRole;
  if (!isWorkspaceRole(role)) {
    return Response.json({ error: "Invalid role" }, { status: 400 });
  }

  jar.set(DEBUG_ROLE_COOKIE, role, {
    httpOnly: false,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  return Response.json({
    ok: true,
    debugRole: role,
    effectiveRole: role,
    capabilities: capabilitiesForRole(role),
  });
}
