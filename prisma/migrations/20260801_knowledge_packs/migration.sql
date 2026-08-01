-- Knowledge Packs: provenance in Postgres, chunk text in Upstash Vector

CREATE TABLE IF NOT EXISTS "KnowledgePack" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "slug" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "language" TEXT NOT NULL DEFAULT 'en',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "seedKey" TEXT,
    "documentCount" INTEGER NOT NULL DEFAULT 0,
    "chunkCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "KnowledgePack_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "KnowledgeSource" (
    "id" TEXT NOT NULL,
    "knowledgePackId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "canonicalUrl" TEXT,
    "datasetRevision" TEXT,
    "license" TEXT,
    "language" TEXT NOT NULL DEFAULT 'en',
    "checksum" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "configJson" JSONB NOT NULL,
    "provenanceJson" JSONB,
    "objectKey" TEXT,
    "documentCount" INTEGER NOT NULL DEFAULT 0,
    "chunkCount" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "lastIngestedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "KnowledgeSource_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "KnowledgeIngestJob" (
    "id" TEXT NOT NULL,
    "knowledgePackId" TEXT NOT NULL,
    "sourceId" TEXT,
    "kind" TEXT NOT NULL DEFAULT 'ingest',
    "status" TEXT NOT NULL DEFAULT 'queued',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "documentsDone" INTEGER NOT NULL DEFAULT 0,
    "documentsTotal" INTEGER NOT NULL DEFAULT 0,
    "chunksDone" INTEGER NOT NULL DEFAULT 0,
    "attempt" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "cursorJson" JSONB,
    "error" TEXT,
    "logJson" JSONB,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "KnowledgeIngestJob_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "CharacterKnowledgePack" (
    "id" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "knowledgePackId" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CharacterKnowledgePack_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "KnowledgePack_userId_slug_key" ON "KnowledgePack"("userId", "slug");
CREATE INDEX IF NOT EXISTS "KnowledgePack_userId_idx" ON "KnowledgePack"("userId");
CREATE INDEX IF NOT EXISTS "KnowledgePack_userId_active_idx" ON "KnowledgePack"("userId", "active");

CREATE UNIQUE INDEX IF NOT EXISTS "KnowledgeSource_knowledgePackId_provider_externalId_key"
  ON "KnowledgeSource"("knowledgePackId", "provider", "externalId");
CREATE INDEX IF NOT EXISTS "KnowledgeSource_knowledgePackId_idx" ON "KnowledgeSource"("knowledgePackId");
CREATE INDEX IF NOT EXISTS "KnowledgeSource_knowledgePackId_status_idx" ON "KnowledgeSource"("knowledgePackId", "status");
CREATE INDEX IF NOT EXISTS "KnowledgeSource_provider_externalId_idx" ON "KnowledgeSource"("provider", "externalId");
CREATE INDEX IF NOT EXISTS "KnowledgeSource_checksum_idx" ON "KnowledgeSource"("checksum");

CREATE INDEX IF NOT EXISTS "KnowledgeIngestJob_status_createdAt_idx" ON "KnowledgeIngestJob"("status", "createdAt");
CREATE INDEX IF NOT EXISTS "KnowledgeIngestJob_knowledgePackId_status_idx" ON "KnowledgeIngestJob"("knowledgePackId", "status");
CREATE INDEX IF NOT EXISTS "KnowledgeIngestJob_sourceId_idx" ON "KnowledgeIngestJob"("sourceId");

CREATE UNIQUE INDEX IF NOT EXISTS "CharacterKnowledgePack_characterId_knowledgePackId_key"
  ON "CharacterKnowledgePack"("characterId", "knowledgePackId");
CREATE INDEX IF NOT EXISTS "CharacterKnowledgePack_characterId_idx" ON "CharacterKnowledgePack"("characterId");
CREATE INDEX IF NOT EXISTS "CharacterKnowledgePack_knowledgePackId_idx" ON "CharacterKnowledgePack"("knowledgePackId");

DO $$ BEGIN
  ALTER TABLE "KnowledgePack" ADD CONSTRAINT "KnowledgePack_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "KnowledgeSource" ADD CONSTRAINT "KnowledgeSource_knowledgePackId_fkey"
    FOREIGN KEY ("knowledgePackId") REFERENCES "KnowledgePack"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "KnowledgeIngestJob" ADD CONSTRAINT "KnowledgeIngestJob_knowledgePackId_fkey"
    FOREIGN KEY ("knowledgePackId") REFERENCES "KnowledgePack"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "KnowledgeIngestJob" ADD CONSTRAINT "KnowledgeIngestJob_sourceId_fkey"
    FOREIGN KEY ("sourceId") REFERENCES "KnowledgeSource"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "CharacterKnowledgePack" ADD CONSTRAINT "CharacterKnowledgePack_characterId_fkey"
    FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "CharacterKnowledgePack" ADD CONSTRAINT "CharacterKnowledgePack_knowledgePackId_fkey"
    FOREIGN KEY ("knowledgePackId") REFERENCES "KnowledgePack"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
