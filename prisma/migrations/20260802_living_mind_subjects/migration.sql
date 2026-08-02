-- Living Mind: RelationshipSubject, Affect dims, OpenIntention, Memory.subjectId

-- 1. RelationshipSubject
CREATE TABLE "RelationshipSubject" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "displayName" TEXT,
    "webUserId" TEXT,
    "telegramUserId" TEXT,
    "phoneNumberHash" TEXT,
    "externalCustomerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RelationshipSubject_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "RelationshipSubject_workspaceId_idx" ON "RelationshipSubject"("workspaceId");
CREATE INDEX "RelationshipSubject_webUserId_idx" ON "RelationshipSubject"("webUserId");
CREATE INDEX "RelationshipSubject_telegramUserId_idx" ON "RelationshipSubject"("telegramUserId");
CREATE INDEX "RelationshipSubject_externalCustomerId_idx" ON "RelationshipSubject"("externalCustomerId");

CREATE UNIQUE INDEX "RelationshipSubject_workspaceId_webUserId_key" ON "RelationshipSubject"("workspaceId", "webUserId");
CREATE UNIQUE INDEX "RelationshipSubject_workspaceId_telegramUserId_key" ON "RelationshipSubject"("workspaceId", "telegramUserId");
CREATE UNIQUE INDEX "RelationshipSubject_workspaceId_externalCustomerId_key" ON "RelationshipSubject"("workspaceId", "externalCustomerId");

ALTER TABLE "RelationshipSubject" ADD CONSTRAINT "RelationshipSubject_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RelationshipSubject" ADD CONSTRAINT "RelationshipSubject_webUserId_fkey" FOREIGN KEY ("webUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 2. Backfill subjects from existing relationship + memory user×workspace pairs
INSERT INTO "RelationshipSubject" ("id", "workspaceId", "webUserId", "displayName", "telegramUserId", "createdAt", "updatedAt")
SELECT
  'subj_' || md5(x."workspaceId" || ':' || x."userId"),
  x."workspaceId",
  x."userId",
  COALESCE(u.name, u."telegramFirstName", u.email, 'Subject'),
  CASE WHEN u."isTelegramPeer" THEN u."telegramId" ELSE NULL END,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM (
  SELECT DISTINCT rs."userId", c."workspaceId"
  FROM "RelationshipState" rs
  INNER JOIN "Character" c ON c.id = rs."characterId"
  WHERE rs."userId" IS NOT NULL
  UNION
  SELECT DISTINCT m."userId", c."workspaceId"
  FROM "Memory" m
  INNER JOIN "Character" c ON c.id = m."characterId"
  WHERE m."userId" IS NOT NULL
) x
INNER JOIN "User" u ON u.id = x."userId"
ON CONFLICT DO NOTHING;

-- Subjects for users who only appear as telegram peers without RS/Memory yet (no-op if empty)
-- (covered when they chat; backfill above handles existing data)

-- 3. RelationshipState: add subjectId + affect fields
ALTER TABLE "RelationshipState" ADD COLUMN "subjectId" TEXT;
ALTER TABLE "RelationshipState" ADD COLUMN "familiarity" DOUBLE PRECISION NOT NULL DEFAULT 0.2;
ALTER TABLE "RelationshipState" ADD COLUMN "openness" DOUBLE PRECISION NOT NULL DEFAULT 0.4;
ALTER TABLE "RelationshipState" ADD COLUMN "playfulness" DOUBLE PRECISION NOT NULL DEFAULT 0.4;
ALTER TABLE "RelationshipState" ADD COLUMN "currentTone" TEXT NOT NULL DEFAULT 'neutral';
ALTER TABLE "RelationshipState" ADD COLUMN "affectJson" JSONB;
ALTER TABLE "RelationshipState" ADD COLUMN "version" INTEGER NOT NULL DEFAULT 0;

UPDATE "RelationshipState" rs
SET "subjectId" = 'subj_' || md5(c."workspaceId" || ':' || rs."userId")
FROM "Character" c
WHERE c.id = rs."characterId";

-- Any orphan rows: create placeholder subjects under first workspace of character
-- (should be none after backfill)

ALTER TABLE "RelationshipState" ALTER COLUMN "subjectId" SET NOT NULL;
ALTER TABLE "RelationshipState" ALTER COLUMN "userId" DROP NOT NULL;

DROP INDEX IF EXISTS "RelationshipState_userId_characterId_key";
CREATE UNIQUE INDEX "RelationshipState_subjectId_characterId_key" ON "RelationshipState"("subjectId", "characterId");
CREATE INDEX "RelationshipState_subjectId_idx" ON "RelationshipState"("subjectId");

ALTER TABLE "RelationshipState" ADD CONSTRAINT "RelationshipState_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "RelationshipSubject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 4. Memory: add subjectId
ALTER TABLE "Memory" ADD COLUMN "subjectId" TEXT;

UPDATE "Memory" m
SET "subjectId" = 'subj_' || md5(c."workspaceId" || ':' || m."userId")
FROM "Character" c
WHERE c.id = m."characterId" AND m."userId" IS NOT NULL;

-- Drop memories that somehow lack userId (should be none)
DELETE FROM "Memory" WHERE "subjectId" IS NULL;

ALTER TABLE "Memory" ALTER COLUMN "subjectId" SET NOT NULL;
ALTER TABLE "Memory" ALTER COLUMN "userId" DROP NOT NULL;

CREATE INDEX "Memory_subjectId_characterId_idx" ON "Memory"("subjectId", "characterId");
ALTER TABLE "Memory" ADD CONSTRAINT "Memory_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "RelationshipSubject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 5. OpenIntention
CREATE TABLE "OpenIntention" (
    "id" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "dueHint" TEXT,
    "dueAt" TIMESTAMP(3),
    "sourceMessageId" TEXT,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.7,
    "dedupeKey" TEXT NOT NULL,
    "lastConfirmedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OpenIntention_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "OpenIntention_characterId_subjectId_dedupeKey_key" ON "OpenIntention"("characterId", "subjectId", "dedupeKey");
CREATE INDEX "OpenIntention_subjectId_characterId_status_idx" ON "OpenIntention"("subjectId", "characterId", "status");
CREATE INDEX "OpenIntention_characterId_status_priority_idx" ON "OpenIntention"("characterId", "status", "priority");

ALTER TABLE "OpenIntention" ADD CONSTRAINT "OpenIntention_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "RelationshipSubject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OpenIntention" ADD CONSTRAINT "OpenIntention_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 6. PostTurnJob idempotency ledger
CREATE TABLE "PostTurnJob" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "upToMessageId" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'all',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "PostTurnJob_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PostTurnJob_conversationId_upToMessageId_kind_key" ON "PostTurnJob"("conversationId", "upToMessageId", "kind");
CREATE INDEX "PostTurnJob_status_createdAt_idx" ON "PostTurnJob"("status", "createdAt");
