import type { WorkspaceAuthPort } from "@/lib/workspace/auth/port";

/**
 * Placeholder for future Supabase Auth migration.
 * Implement session JWT → User.externalAuthUserId mapping and wire invites
 * via WorkspaceInvite + Resend. See docs/supabase-migration-checklist.md.
 */
export const supabaseWorkspaceAuth: WorkspaceAuthPort = {
  provider: "supabase",

  async createRemoteTeam() {
    throw new Error(
      "SupabaseWorkspaceAuth is not active. Switch AUTH_PROVIDER after implementing the adapter.",
    );
  },

  async inviteRemoteMember() {
    throw new Error(
      "SupabaseWorkspaceAuth is not active. Switch AUTH_PROVIDER after implementing the adapter.",
    );
  },
};
