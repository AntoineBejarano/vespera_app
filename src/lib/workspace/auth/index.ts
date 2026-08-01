import { hexclaveWorkspaceAuth } from "@/lib/workspace/auth/hexclave";
import { supabaseWorkspaceAuth } from "@/lib/workspace/auth/supabase";
import type { WorkspaceAuthPort } from "@/lib/workspace/auth/port";

export type { WorkspaceAuthPort } from "@/lib/workspace/auth/port";

/**
 * Active IdP adapter. Product authz never goes through this —
 * only identity lifecycle / optional remote teams.
 */
export function getWorkspaceAuthPort(): WorkspaceAuthPort {
  const provider = (process.env.AUTH_PROVIDER ?? "hexclave").toLowerCase();
  if (provider === "supabase") return supabaseWorkspaceAuth;
  return hexclaveWorkspaceAuth;
}
