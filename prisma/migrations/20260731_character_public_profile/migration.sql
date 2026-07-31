-- Public character profiles + forks
ALTER TABLE "Character" ADD COLUMN IF NOT EXISTS "slug" TEXT;
ALTER TABLE "Character" ADD COLUMN IF NOT EXISTS "isPublic" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Character" ADD COLUMN IF NOT EXISTS "tagline" TEXT;
ALTER TABLE "Character" ADD COLUMN IF NOT EXISTS "openingLine" TEXT;
ALTER TABLE "Character" ADD COLUMN IF NOT EXISTS "categories" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Character" ADD COLUMN IF NOT EXISTS "allowFork" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Character" ADD COLUMN IF NOT EXISTS "isAdult" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Character" ADD COLUMN IF NOT EXISTS "forkedFromId" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "Character_slug_key" ON "Character"("slug");
CREATE INDEX IF NOT EXISTS "Character_isPublic_updatedAt_idx" ON "Character"("isPublic", "updatedAt");
CREATE INDEX IF NOT EXISTS "Character_isPublic_isAdult_idx" ON "Character"("isPublic", "isAdult");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Character_forkedFromId_fkey'
  ) THEN
    ALTER TABLE "Character"
      ADD CONSTRAINT "Character_forkedFromId_fkey"
      FOREIGN KEY ("forkedFromId") REFERENCES "Character"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
