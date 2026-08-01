import type { User } from "@/generated/prisma/client";
import type { InvitableRole } from "@/lib/workspace/roles";

/**
 * Identity / invites lifecycle only.
 * Product authz (capabilities) lives in Prisma — never in this port.
 */
export type WorkspaceAuthPort = {
  readonly provider: "hexclave" | "supabase";

  /** Create a remote team in the IdP (optional). Returns external team id or null. */
  createRemoteTeam(params: {
    displayName: string;
    ownerExternalUserId: string;
  }): Promise<{ externalTeamId: string | null }>;

  /**
   * Invite via IdP email if supported. Always also persist WorkspaceInvite in Prisma
   * at the call site — this is only the remote side-effect.
   */
  inviteRemoteMember(params: {
    externalTeamId: string | null;
    email: string;
    role: InvitableRole;
  }): Promise<{ ok: boolean; detail?: string }>;

  /** Sync remote membership into Prisma when IdP is source of invite acceptance. */
  syncMembershipFromRemote?(params: {
    workspaceId: string;
    externalTeamId: string;
  }): Promise<void>;
};

export type SessionUserResolver = {
  getSessionUser(opts?: {
    or?: "redirect" | "throw" | "return-null";
  }): Promise<User | null>;
};
