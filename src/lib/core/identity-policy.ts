import { z } from "zod";

export const IDENTITY_KINDS = [
  "webUserId",
  "telegramUserId",
  "externalCustomerId",
  "phoneNumberHash",
] as const;

export type IdentityKind = (typeof IDENTITY_KINDS)[number];

export const EVIDENCE_TYPES = [
  "telegram_account_link",
  "operator_verified",
  "consumed_link_token",
] as const;

export type EvidenceType = (typeof EVIDENCE_TYPES)[number];

export const identityEvidenceSchema = z.object({
  type: z.enum(EVIDENCE_TYPES),
  note: z.string().max(280).optional(),
});

export type IdentityEvidence = z.infer<typeof identityEvidenceSchema>;

export function isIdentityKind(raw: unknown): raw is IdentityKind {
  return typeof raw === "string" && (IDENTITY_KINDS as readonly string[]).includes(raw);
}

/** Heuristic merge of two existing subjects is never allowed. */
export function evidenceAllowsVerifiedLink(evidence: unknown): boolean {
  const parsed = identityEvidenceSchema.safeParse(evidence);
  return parsed.success;
}

export type IdentityClaimDecision =
  | { action: "fill" }
  | { action: "reject"; code: "NO_EVIDENCE" | "IDENTITY_OWNED" | "INVALID_KIND" };

/**
 * Pure policy for claiming an identity onto a subject.
 * Filling an empty slot on the same subject is ok.
 * Taking an identifier already owned by another subject requires verified evidence.
 */
export function decideIdentityClaim(params: {
  kind: unknown;
  ownedByOtherSubject: boolean;
  evidence: unknown;
}): IdentityClaimDecision {
  if (!isIdentityKind(params.kind)) {
    return { action: "reject", code: "INVALID_KIND" };
  }
  if (!params.ownedByOtherSubject) {
    return { action: "fill" };
  }
  if (!evidenceAllowsVerifiedLink(params.evidence)) {
    return { action: "reject", code: "NO_EVIDENCE" };
  }
  return { action: "fill" };
}
