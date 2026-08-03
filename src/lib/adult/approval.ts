import { prisma } from "@/lib/db";
import {
  ADULT_POLICY_VERSION,
  type AdultCapability,
  parseJsonStringArray,
  toJsonStringArray,
} from "@/lib/adult/constants";
import { isSuperadminUser } from "@/lib/platform/superadmin";
import { track } from "@/lib/metrics";

export type ApprovalStatus = "pending" | "approved" | "revoked" | "expired";

function isExpired(expiresAt: Date | null | undefined, now = new Date()) {
  return Boolean(expiresAt && expiresAt.getTime() <= now.getTime());
}

/** Live config-gate: approved, not revoked, not expired. Never implies end-user delivery. */
export async function isWorkspaceAdultConfigAllowed(
  workspaceId: string,
): Promise<boolean> {
  const ws = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: {
      adultEnabled: true,
      adultRiskStatus: true,
      adultApprovalExpiresAt: true,
    },
  });
  if (!ws?.adultEnabled) return false;
  if (ws.adultRiskStatus === "revoked" || ws.adultRiskStatus === "expired") {
    return false;
  }
  if (isExpired(ws.adultApprovalExpiresAt)) return false;
  return true;
}

export async function approveAdultWorkspace(params: {
  workspaceId: string;
  actor: { id: string; email?: string | null };
  reason: string;
  capabilities?: AdultCapability[];
  allowedCountries?: string[];
  ageAssuranceRequired?: boolean;
  ageAssuranceProvider?: string | null;
  expiresAt?: Date | null;
  policyVersion?: string;
}) {
  if (!isSuperadminUser(params.actor)) {
    throw new AdultApprovalError("Only platform operators can approve After Dark partners", 403);
  }
  const reason = params.reason.trim();
  if (reason.length < 8) {
    throw new AdultApprovalError("Approval reason required (min 8 chars)", 400);
  }

  const capabilities = params.capabilities ?? [
    "persona_adult_config",
    "chat_adult",
  ];
  const allowedCountries = params.allowedCountries ?? [];
  const policyVersion = params.policyVersion ?? ADULT_POLICY_VERSION;
  const ageAssuranceRequired = params.ageAssuranceRequired ?? true;
  const now = new Date();

  const approval = await prisma.$transaction(async (tx) => {
    // Revoke any prior active approvals for this workspace
    await tx.adultWorkspaceApproval.updateMany({
      where: {
        workspaceId: params.workspaceId,
        status: { in: ["pending", "approved"] },
      },
      data: {
        status: "revoked",
        revokedAt: now,
        revokeReason: "Superseded by new approval",
      },
    });

    const row = await tx.adultWorkspaceApproval.create({
      data: {
        workspaceId: params.workspaceId,
        status: "approved",
        approvedByUserId: params.actor.id,
        approvedAt: now,
        reason,
        policyVersion,
        capabilities: toJsonStringArray(capabilities),
        allowedCountries: toJsonStringArray(allowedCountries),
        ageAssuranceRequired,
        ageAssuranceProvider: params.ageAssuranceProvider ?? null,
        expiresAt: params.expiresAt ?? null,
      },
    });

    await tx.workspace.update({
      where: { id: params.workspaceId },
      data: {
        adultEnabled: true,
        adultApprovedAt: now,
        adultApprovedBy: params.actor.id,
        adultPolicyVersion: policyVersion,
        adultTermsAcceptedAt: now,
        adultRiskStatus: "approved",
        adultAllowedCapabilities: toJsonStringArray(capabilities),
        adultAllowedCountries: toJsonStringArray(allowedCountries),
        adultAgeAssuranceRequired: ageAssuranceRequired,
        adultAgeAssuranceProvider: params.ageAssuranceProvider ?? null,
        adultApprovalExpiresAt: params.expiresAt ?? null,
      },
    });

    return row;
  });

  track("adult_approval", {
    workspaceId: params.workspaceId,
    action: "approve",
    actorId: params.actor.id,
  });

  return approval;
}

export async function revokeAdultWorkspace(params: {
  workspaceId: string;
  actor: { id: string; email?: string | null };
  reason: string;
}) {
  if (!isSuperadminUser(params.actor)) {
    throw new AdultApprovalError("Only platform operators can revoke After Dark partners", 403);
  }
  const reason = params.reason.trim();
  if (reason.length < 4) {
    throw new AdultApprovalError("Revoke reason required", 400);
  }
  const now = new Date();

  await prisma.$transaction(async (tx) => {
    await tx.adultWorkspaceApproval.updateMany({
      where: {
        workspaceId: params.workspaceId,
        status: { in: ["pending", "approved"] },
      },
      data: {
        status: "revoked",
        revokedAt: now,
        revokeReason: reason,
      },
    });

    await tx.workspace.update({
      where: { id: params.workspaceId },
      data: {
        adultEnabled: false,
        adultRiskStatus: "revoked",
        adultApprovalExpiresAt: now,
      },
    });

    // Force public adult personas off apex / public surfaces
    await tx.character.updateMany({
      where: { workspaceId: params.workspaceId, isAdult: true },
      data: { isPublic: false, isAdult: false },
    });
  });

  track("adult_approval", {
    workspaceId: params.workspaceId,
    action: "revoke",
    actorId: params.actor.id,
  });
}

export async function syncExpiredApprovals(workspaceId?: string) {
  const now = new Date();
  const where = {
    status: "approved" as const,
    expiresAt: { lte: now },
    ...(workspaceId ? { workspaceId } : {}),
  };
  const expired = await prisma.adultWorkspaceApproval.findMany({ where });
  for (const row of expired) {
    await prisma.$transaction([
      prisma.adultWorkspaceApproval.update({
        where: { id: row.id },
        data: { status: "expired" },
      }),
      prisma.workspace.update({
        where: { id: row.workspaceId },
        data: {
          adultEnabled: false,
          adultRiskStatus: "expired",
        },
      }),
    ]);
  }
  return expired.length;
}

export function workspaceAdultCapabilitySet(ws: {
  adultAllowedCapabilities?: string | null;
}): Set<string> {
  return new Set(parseJsonStringArray(ws.adultAllowedCapabilities));
}

export class AdultApprovalError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.name = "AdultApprovalError";
    this.status = status;
  }
}
