-- Workspaces (portable tenant) + membership / invites / ownership transfers

CREATE TABLE "Workspace" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "externalAuthTeamId" TEXT,
    "adultEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Workspace_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Workspace_externalAuthTeamId_key" ON "Workspace"("externalAuthTeamId");
CREATE INDEX "Workspace_createdAt_idx" ON "Workspace"("createdAt");

CREATE TABLE "WorkspaceMember" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkspaceMember_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "WorkspaceMember_workspaceId_userId_key" ON "WorkspaceMember"("workspaceId", "userId");
CREATE INDEX "WorkspaceMember_userId_idx" ON "WorkspaceMember"("userId");
CREATE INDEX "WorkspaceMember_workspaceId_role_idx" ON "WorkspaceMember"("workspaceId", "role");

CREATE TABLE "WorkspaceInvite" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "invitedByUserId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkspaceInvite_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "WorkspaceInvite_token_key" ON "WorkspaceInvite"("token");
CREATE INDEX "WorkspaceInvite_workspaceId_email_idx" ON "WorkspaceInvite"("workspaceId", "email");
CREATE INDEX "WorkspaceInvite_email_idx" ON "WorkspaceInvite"("email");
CREATE INDEX "WorkspaceInvite_token_idx" ON "WorkspaceInvite"("token");

CREATE TABLE "WorkspaceOwnershipTransfer" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "fromUserId" TEXT NOT NULL,
    "toUserId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkspaceOwnershipTransfer_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "WorkspaceOwnershipTransfer_token_key" ON "WorkspaceOwnershipTransfer"("token");
CREATE INDEX "WorkspaceOwnershipTransfer_workspaceId_idx" ON "WorkspaceOwnershipTransfer"("workspaceId");
CREATE INDEX "WorkspaceOwnershipTransfer_token_idx" ON "WorkspaceOwnershipTransfer"("token");

-- User IdP portability + active workspace
ALTER TABLE "User" ADD COLUMN "externalAuthUserId" TEXT;
ALTER TABLE "User" ADD COLUMN "authProvider" TEXT DEFAULT 'hexclave';
ALTER TABLE "User" ADD COLUMN "activeWorkspaceId" TEXT;

CREATE UNIQUE INDEX "User_externalAuthUserId_key" ON "User"("externalAuthUserId");
CREATE INDEX "User_externalAuthUserId_idx" ON "User"("externalAuthUserId");

UPDATE "User" SET "externalAuthUserId" = "hexclaveId"
WHERE "hexclaveId" IS NOT NULL AND "externalAuthUserId" IS NULL;

-- Character tenant + chat key display metadata
ALTER TABLE "Character" ADD COLUMN "workspaceId" TEXT;
ALTER TABLE "Character" ADD COLUMN "updatedByUserId" TEXT;
ALTER TABLE "Character" ADD COLUMN "apiKeyHash" TEXT;
ALTER TABLE "Character" ADD COLUMN "apiKeyPrefix" TEXT;
ALTER TABLE "Character" ADD COLUMN "apiKeyLastFour" TEXT;
ALTER TABLE "Character" ADD COLUMN "archivedAt" TIMESTAMP(3);
ALTER TABLE "Character" ADD COLUMN "archivedByUserId" TEXT;

CREATE UNIQUE INDEX "Character_apiKeyHash_key" ON "Character"("apiKeyHash");
CREATE INDEX "Character_workspaceId_idx" ON "Character"("workspaceId");
CREATE INDEX "Character_workspaceId_active_idx" ON "Character"("workspaceId", "active");
CREATE INDEX "Character_apiKeyHash_idx" ON "Character"("apiKeyHash");
CREATE INDEX "Character_workspaceId_archivedAt_idx" ON "Character"("workspaceId", "archivedAt");

-- KnowledgePack tenant
ALTER TABLE "KnowledgePack" ADD COLUMN "workspaceId" TEXT;
ALTER TABLE "KnowledgePack" ADD COLUMN "archivedAt" TIMESTAMP(3);
ALTER TABLE "KnowledgePack" ADD COLUMN "archivedByUserId" TEXT;

CREATE INDEX "KnowledgePack_workspaceId_idx" ON "KnowledgePack"("workspaceId");
CREATE INDEX "KnowledgePack_workspaceId_active_idx" ON "KnowledgePack"("workspaceId", "active");

-- Drop old unique (userId, slug); will recreate as (workspaceId, slug) after backfill
DROP INDEX IF EXISTS "KnowledgePack_userId_slug_key";

-- UserApiKey tenant
ALTER TABLE "UserApiKey" ADD COLUMN "workspaceId" TEXT;
ALTER TABLE "UserApiKey" ADD COLUMN "lastFour" TEXT NOT NULL DEFAULT '';

CREATE INDEX "UserApiKey_workspaceId_idx" ON "UserApiKey"("workspaceId");

-- TelegramBot tenant
ALTER TABLE "TelegramBot" ADD COLUMN "workspaceId" TEXT;
CREATE INDEX "TelegramBot_workspaceId_idx" ON "TelegramBot"("workspaceId");

-- Backfill: one personal workspace per non-peer user
INSERT INTO "Workspace" ("id", "name", "adultEnabled", "createdAt", "updatedAt")
SELECT
  'ws_' || u."id",
  COALESCE(NULLIF(TRIM(u."name"), ''), SPLIT_PART(COALESCE(u."email", 'workspace'), '@', 1), 'Personal') || '''s workspace',
  false,
  NOW(),
  NOW()
FROM "User" u
WHERE u."isTelegramPeer" = false
  AND NOT EXISTS (SELECT 1 FROM "Workspace" w WHERE w."id" = 'ws_' || u."id");

INSERT INTO "WorkspaceMember" ("id", "workspaceId", "userId", "role", "createdAt", "updatedAt")
SELECT
  'wm_' || u."id",
  'ws_' || u."id",
  u."id",
  'owner',
  NOW(),
  NOW()
FROM "User" u
WHERE u."isTelegramPeer" = false
  AND NOT EXISTS (
    SELECT 1 FROM "WorkspaceMember" m
    WHERE m."workspaceId" = 'ws_' || u."id" AND m."userId" = u."id"
  );

UPDATE "User" u
SET "activeWorkspaceId" = 'ws_' || u."id"
WHERE u."isTelegramPeer" = false
  AND u."activeWorkspaceId" IS NULL
  AND EXISTS (SELECT 1 FROM "Workspace" w WHERE w."id" = 'ws_' || u."id");

UPDATE "Character" c
SET "workspaceId" = 'ws_' || c."userId"
WHERE c."workspaceId" IS NULL
  AND EXISTS (SELECT 1 FROM "Workspace" w WHERE w."id" = 'ws_' || c."userId");

UPDATE "Character" c
SET
  "apiKeyPrefix" = LEFT(c."apiKey", 12),
  "apiKeyLastFour" = RIGHT(c."apiKey", 4)
WHERE c."apiKey" IS NOT NULL
  AND c."apiKeyPrefix" IS NULL;

UPDATE "KnowledgePack" k
SET "workspaceId" = 'ws_' || k."userId"
WHERE k."workspaceId" IS NULL
  AND EXISTS (SELECT 1 FROM "Workspace" w WHERE w."id" = 'ws_' || k."userId");

UPDATE "UserApiKey" k
SET
  "workspaceId" = 'ws_' || k."userId",
  "lastFour" = CASE WHEN LENGTH(k."keyPrefix") >= 4 THEN RIGHT(k."keyPrefix", 4) ELSE '' END
WHERE k."workspaceId" IS NULL
  AND EXISTS (SELECT 1 FROM "Workspace" w WHERE w."id" = 'ws_' || k."userId");

UPDATE "TelegramBot" b
SET "workspaceId" = 'ws_' || b."ownerUserId"
WHERE b."workspaceId" IS NULL
  AND EXISTS (SELECT 1 FROM "Workspace" w WHERE w."id" = 'ws_' || b."ownerUserId");

-- Peer-created characters without a personal workspace: attach to a synthetic orphan workspace is invalid.
-- Create workspaces for any remaining creators that were peers-turned-creators edge cases.
INSERT INTO "Workspace" ("id", "name", "adultEnabled", "createdAt", "updatedAt")
SELECT DISTINCT
  'ws_' || c."userId",
  'Recovered workspace',
  false,
  NOW(),
  NOW()
FROM "Character" c
WHERE c."workspaceId" IS NULL
  AND NOT EXISTS (SELECT 1 FROM "Workspace" w WHERE w."id" = 'ws_' || c."userId");

INSERT INTO "WorkspaceMember" ("id", "workspaceId", "userId", "role", "createdAt", "updatedAt")
SELECT DISTINCT
  'wm_' || c."userId",
  'ws_' || c."userId",
  c."userId",
  'owner',
  NOW(),
  NOW()
FROM "Character" c
WHERE c."workspaceId" IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM "WorkspaceMember" m
    WHERE m."workspaceId" = 'ws_' || c."userId" AND m."userId" = c."userId"
  );

UPDATE "Character" c
SET "workspaceId" = 'ws_' || c."userId"
WHERE c."workspaceId" IS NULL;

UPDATE "KnowledgePack" k
SET "workspaceId" = 'ws_' || k."userId"
WHERE k."workspaceId" IS NULL;

UPDATE "UserApiKey" k
SET "workspaceId" = 'ws_' || k."userId"
WHERE k."workspaceId" IS NULL;

UPDATE "TelegramBot" b
SET "workspaceId" = 'ws_' || b."ownerUserId"
WHERE b."workspaceId" IS NULL;

-- Enforce NOT NULL
ALTER TABLE "Character" ALTER COLUMN "workspaceId" SET NOT NULL;
ALTER TABLE "KnowledgePack" ALTER COLUMN "workspaceId" SET NOT NULL;
ALTER TABLE "UserApiKey" ALTER COLUMN "workspaceId" SET NOT NULL;
ALTER TABLE "TelegramBot" ALTER COLUMN "workspaceId" SET NOT NULL;

CREATE UNIQUE INDEX "KnowledgePack_workspaceId_slug_key" ON "KnowledgePack"("workspaceId", "slug");

-- Foreign keys
ALTER TABLE "WorkspaceMember" ADD CONSTRAINT "WorkspaceMember_workspaceId_fkey"
  FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkspaceMember" ADD CONSTRAINT "WorkspaceMember_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "WorkspaceInvite" ADD CONSTRAINT "WorkspaceInvite_workspaceId_fkey"
  FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkspaceInvite" ADD CONSTRAINT "WorkspaceInvite_invitedByUserId_fkey"
  FOREIGN KEY ("invitedByUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "WorkspaceOwnershipTransfer" ADD CONSTRAINT "WorkspaceOwnershipTransfer_workspaceId_fkey"
  FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkspaceOwnershipTransfer" ADD CONSTRAINT "WorkspaceOwnershipTransfer_fromUserId_fkey"
  FOREIGN KEY ("fromUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkspaceOwnershipTransfer" ADD CONSTRAINT "WorkspaceOwnershipTransfer_toUserId_fkey"
  FOREIGN KEY ("toUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "User" ADD CONSTRAINT "User_activeWorkspaceId_fkey"
  FOREIGN KEY ("activeWorkspaceId") REFERENCES "Workspace"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Character" ADD CONSTRAINT "Character_workspaceId_fkey"
  FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "KnowledgePack" ADD CONSTRAINT "KnowledgePack_workspaceId_fkey"
  FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UserApiKey" ADD CONSTRAINT "UserApiKey_workspaceId_fkey"
  FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TelegramBot" ADD CONSTRAINT "TelegramBot_workspaceId_fkey"
  FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
