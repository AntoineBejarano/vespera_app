import { prisma } from "@/lib/db";
import {
  evaluateContentPolicy,
  type ContentPolicyContext,
  type PolicyCapability,
  type PolicyChannel,
  ContentPolicyError,
} from "@/lib/content-policy";
import { parseJsonStringArray } from "@/lib/adult/constants";
import { track } from "@/lib/metrics";

export async function loadWorkspacePolicyFields(workspaceId: string) {
  const ws = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: {
      adultEnabled: true,
      adultRiskStatus: true,
      adultApprovalExpiresAt: true,
      adultAllowedCapabilities: true,
      adultAllowedCountries: true,
      adultAgeAssuranceRequired: true,
    },
  });
  if (!ws) return null;
  const expired = Boolean(
    ws.adultApprovalExpiresAt &&
      ws.adultApprovalExpiresAt.getTime() <= Date.now(),
  );
  return {
    workspaceAdultEnabled: ws.adultEnabled && !expired,
    workspaceRiskStatus: expired ? "expired" : ws.adultRiskStatus,
    workspaceApprovalExpired: expired,
    workspaceAllowedCapabilities: parseJsonStringArray(
      ws.adultAllowedCapabilities,
    ),
    workspaceAllowedCountries: parseJsonStringArray(ws.adultAllowedCountries),
    ageAssuranceRequired: ws.adultAgeAssuranceRequired,
  };
}

export function isEndUserAgeAssured(user: {
  ageAssuredAt?: Date | null;
  ageAssuranceExpiresAt?: Date | null;
  ageAssuranceStatus?: string | null;
}): boolean {
  if (!user.ageAssuredAt) return false;
  if (user.ageAssuranceStatus && user.ageAssuranceStatus !== "verified") {
    return false;
  }
  if (
    user.ageAssuranceExpiresAt &&
    user.ageAssuranceExpiresAt.getTime() <= Date.now()
  ) {
    return false;
  }
  return true;
}

export async function assertCapability(params: {
  workspaceId: string;
  characterAdult: boolean;
  subjectAgeVerified: boolean;
  channel: PolicyChannel;
  requestedCapability: PolicyCapability;
  jurisdiction?: string | null;
  isDelivery?: boolean;
}): Promise<void> {
  const fields = await loadWorkspacePolicyFields(params.workspaceId);
  const ctx: ContentPolicyContext = {
    workspaceAdultEnabled: fields?.workspaceAdultEnabled ?? false,
    workspaceRiskStatus: fields?.workspaceRiskStatus,
    workspaceApprovalExpired: fields?.workspaceApprovalExpired,
    workspaceAllowedCapabilities: fields?.workspaceAllowedCapabilities,
    workspaceAllowedCountries: fields?.workspaceAllowedCountries,
    characterAdult: params.characterAdult,
    subjectAgeVerified: params.subjectAgeVerified,
    channel: params.channel,
    requestedCapability: params.requestedCapability,
    jurisdiction: params.jurisdiction,
    isDelivery: params.isDelivery,
  };
  const decision = evaluateContentPolicy(ctx);
  if (!decision.allowed) {
    track("content_policy_deny", {
      code: decision.code,
      capability: params.requestedCapability,
      channel: params.channel,
      workspaceId: params.workspaceId,
    });
    throw new ContentPolicyError(decision.reason, decision.code);
  }
}

// Re-export pure helpers for convenience
export {
  looksLikeAdultSexualRequest,
  EXPLICIT_PHOTO_TAGS,
} from "@/lib/content-policy";
