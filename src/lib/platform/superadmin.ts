import { cookies } from "next/headers";
import {
  isWorkspaceRole,
  type WorkspaceRole,
} from "@/lib/workspace/roles";

/** Always allowed — primary operator. Extra emails via SUPERADMIN_EMAILS. */
const BUILTIN_SUPERADMIN_EMAILS = ["antubejar96@gmail.com"];

export const DEBUG_ROLE_COOKIE = "vesperer_debug_role";

export function getSuperadminEmails(): string[] {
  const fromEnv = (process.env.SUPERADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return [...new Set([...BUILTIN_SUPERADMIN_EMAILS, ...fromEnv])];
}

export function isSuperadminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return getSuperadminEmails().includes(email.trim().toLowerCase());
}

export function isSuperadminUser(user: {
  email?: string | null;
}): boolean {
  return isSuperadminEmail(user.email);
}

/** Role the superadmin is currently simulating (null = use real membership). */
export async function getDebugRoleOverride(): Promise<WorkspaceRole | null> {
  try {
    const jar = await cookies();
    const raw = jar.get(DEBUG_ROLE_COOKIE)?.value?.trim().toLowerCase();
    if (!raw || raw === "real") return null;
    if (isWorkspaceRole(raw)) return raw;
    return null;
  } catch {
    // cookies() unavailable outside a request context
    return null;
  }
}
