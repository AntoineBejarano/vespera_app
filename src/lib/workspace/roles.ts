/** Product roles shown in UI. `operator` reserved for After Dark human-in-the-loop (phase 2). */
export const WORKSPACE_ROLES = ["owner", "admin", "editor", "viewer"] as const;
export type WorkspaceRole = (typeof WORKSPACE_ROLES)[number];

/** Roles that can be assigned via invite (never owner). */
export const INVITABLE_ROLES = ["admin", "editor", "viewer"] as const;
export type InvitableRole = (typeof INVITABLE_ROLES)[number];

export function isWorkspaceRole(value: string): value is WorkspaceRole {
  return (WORKSPACE_ROLES as readonly string[]).includes(value);
}

export function isInvitableRole(value: string): value is InvitableRole {
  return (INVITABLE_ROLES as readonly string[]).includes(value);
}

export const ROLE_LABELS: Record<WorkspaceRole, string> = {
  owner: "Owner",
  admin: "Admin",
  editor: "Editor",
  viewer: "Viewer",
};
