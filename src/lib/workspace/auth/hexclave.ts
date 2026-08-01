import "server-only";
import type { WorkspaceAuthPort } from "@/lib/workspace/auth/port";

/**
 * Hexclave adapter (v1): optional remote team lifecycle.
 * Membership/roles remain canonical in Prisma WorkspaceMember.
 * When Hexclave Teams are fully enabled in the project, extend createRemoteTeam /
 * inviteRemoteMember to call HexclaveServerApp team APIs and store externalAuthTeamId.
 */
export const hexclaveWorkspaceAuth: WorkspaceAuthPort = {
  provider: "hexclave",

  async createRemoteTeam() {
    // Soft no-op until Hexclave Teams are configured for this project.
    // Domain workspaces still work fully via Prisma.
    return { externalTeamId: null };
  },

  async inviteRemoteMember() {
    // Invites are handled via WorkspaceInvite + email (Resend) in app code.
    return { ok: true, detail: "prisma_invite_only" };
  },
};
