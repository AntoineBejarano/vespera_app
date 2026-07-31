-- Platform operator attestation (B2B channel/API responsibilities)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "platformOperatorAcceptedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "platformOperatorVersion" TEXT;
