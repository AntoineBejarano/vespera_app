import type { WorkspaceRole } from "@/lib/workspace/roles";

/**
 * Domain capabilities — routes authorize these, never role names.
 * Portable across IdPs (Hexclave v1 → Supabase later).
 */
export const WORKSPACE_CAPABILITIES = [
  "workspace.read",
  "personas.read",
  "knowledge.read",
  "chat_history.read",
  "personas.write",
  "knowledge.write",
  "playground.run",
  "content.publish",
  "content.archive",
  "connections.manage",
  "account_keys.manage",
  "chat_keys.manage",
  "adult.manage_content",
  "members.manage",
  "members.manage_admins",
  "adult.enable_workspace",
  "billing.manage",
  "workspace.update",
  "workspace.delete",
  "ownership.transfer",
] as const;

export type WorkspaceCapability = (typeof WORKSPACE_CAPABILITIES)[number];

const VIEWER_CAPS: WorkspaceCapability[] = [
  "workspace.read",
  "personas.read",
  "knowledge.read",
  "chat_history.read",
];

const EDITOR_CAPS: WorkspaceCapability[] = [
  ...VIEWER_CAPS,
  "personas.write",
  "knowledge.write",
  "playground.run",
];

const ADMIN_CAPS: WorkspaceCapability[] = [
  ...EDITOR_CAPS,
  "content.publish",
  "content.archive",
  "connections.manage",
  "account_keys.manage",
  "chat_keys.manage",
  "adult.manage_content",
  "members.manage",
];

const OWNER_CAPS: WorkspaceCapability[] = [
  ...ADMIN_CAPS,
  "members.manage_admins",
  "adult.enable_workspace",
  "billing.manage",
  "workspace.update",
  "workspace.delete",
  "ownership.transfer",
];

export const ROLE_CAPABILITIES: Record<WorkspaceRole, readonly WorkspaceCapability[]> =
  {
    viewer: VIEWER_CAPS,
    editor: EDITOR_CAPS,
    admin: ADMIN_CAPS,
    owner: OWNER_CAPS,
  };

export function roleHasCapability(
  role: WorkspaceRole,
  capability: WorkspaceCapability,
): boolean {
  return ROLE_CAPABILITIES[role].includes(capability);
}

export function capabilitiesForRole(
  role: WorkspaceRole,
): readonly WorkspaceCapability[] {
  return ROLE_CAPABILITIES[role];
}
