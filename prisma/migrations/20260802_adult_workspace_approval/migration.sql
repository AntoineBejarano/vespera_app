-- After Dark partner approval (config access ≠ end-user delivery)

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "ageAssuranceStatus" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "ageAssuranceProvider" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "ageAssuredAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "ageAssuranceExpiresAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "ageBand" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "countryCode" TEXT;

ALTER TABLE "Workspace" ADD COLUMN IF NOT EXISTS "adultApprovedAt" TIMESTAMP(3);
ALTER TABLE "Workspace" ADD COLUMN IF NOT EXISTS "adultApprovedBy" TEXT;
ALTER TABLE "Workspace" ADD COLUMN IF NOT EXISTS "adultPolicyVersion" TEXT;
ALTER TABLE "Workspace" ADD COLUMN IF NOT EXISTS "adultTermsAcceptedAt" TIMESTAMP(3);
ALTER TABLE "Workspace" ADD COLUMN IF NOT EXISTS "adultRiskStatus" TEXT NOT NULL DEFAULT 'none';
ALTER TABLE "Workspace" ADD COLUMN IF NOT EXISTS "adultAllowedCapabilities" TEXT;
ALTER TABLE "Workspace" ADD COLUMN IF NOT EXISTS "adultAllowedCountries" TEXT;
ALTER TABLE "Workspace" ADD COLUMN IF NOT EXISTS "adultAgeAssuranceRequired" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Workspace" ADD COLUMN IF NOT EXISTS "adultAgeAssuranceProvider" TEXT;
ALTER TABLE "Workspace" ADD COLUMN IF NOT EXISTS "adultApprovalExpiresAt" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "Workspace_adultEnabled_idx" ON "Workspace"("adultEnabled");

CREATE TABLE IF NOT EXISTS "AdultWorkspaceApproval" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "approvedByUserId" TEXT,
    "approvedAt" TIMESTAMP(3),
    "reason" TEXT NOT NULL,
    "policyVersion" TEXT NOT NULL,
    "capabilities" TEXT NOT NULL DEFAULT '[]',
    "allowedCountries" TEXT NOT NULL DEFAULT '[]',
    "ageAssuranceRequired" BOOLEAN NOT NULL DEFAULT true,
    "ageAssuranceProvider" TEXT,
    "expiresAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "revokeReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdultWorkspaceApproval_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "AdultWorkspaceApproval_workspaceId_status_idx" ON "AdultWorkspaceApproval"("workspaceId", "status");
CREATE INDEX IF NOT EXISTS "AdultWorkspaceApproval_approvedByUserId_idx" ON "AdultWorkspaceApproval"("approvedByUserId");
CREATE INDEX IF NOT EXISTS "AdultWorkspaceApproval_expiresAt_idx" ON "AdultWorkspaceApproval"("expiresAt");

DO $$ BEGIN
  ALTER TABLE "AdultWorkspaceApproval" ADD CONSTRAINT "AdultWorkspaceApproval_workspaceId_fkey"
    FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "AdultWorkspaceApproval" ADD CONSTRAINT "AdultWorkspaceApproval_approvedByUserId_fkey"
    FOREIGN KEY ("approvedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
