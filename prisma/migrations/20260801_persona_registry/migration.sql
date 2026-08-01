-- Persona Registry: versioning, license, declared channels
ALTER TABLE "Character" ADD COLUMN IF NOT EXISTS "versionMajor" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "Character" ADD COLUMN IF NOT EXISTS "versionMinor" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Character" ADD COLUMN IF NOT EXISTS "license" TEXT NOT NULL DEFAULT 'fork_allowed';
ALTER TABLE "Character" ADD COLUMN IF NOT EXISTS "channels" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

CREATE INDEX IF NOT EXISTS "Character_isPublic_license_idx" ON "Character"("isPublic", "license");

CREATE TABLE IF NOT EXISTS "CharacterVersion" (
    "id" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "versionMajor" INTEGER NOT NULL,
    "versionMinor" INTEGER NOT NULL,
    "changelog" TEXT,
    "name" TEXT NOT NULL,
    "tagline" TEXT,
    "openingLine" TEXT,
    "soulMd" TEXT,
    "styleMd" TEXT,
    "rulesMd" TEXT,
    "contextMd" TEXT,
    "metaJson" JSONB,
    "license" TEXT NOT NULL,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CharacterVersion_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "CharacterVersion_characterId_versionMajor_versionMinor_key"
  ON "CharacterVersion"("characterId", "versionMajor", "versionMinor");
CREATE INDEX IF NOT EXISTS "CharacterVersion_characterId_createdAt_idx"
  ON "CharacterVersion"("characterId", "createdAt");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'CharacterVersion_characterId_fkey'
  ) THEN
    ALTER TABLE "CharacterVersion"
      ADD CONSTRAINT "CharacterVersion_characterId_fkey"
      FOREIGN KEY ("characterId") REFERENCES "Character"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
