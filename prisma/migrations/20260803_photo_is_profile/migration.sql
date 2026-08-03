-- AlterTable
ALTER TABLE "CharacterPhoto" ADD COLUMN "isProfile" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "CharacterPhoto_characterId_isProfile_idx" ON "CharacterPhoto"("characterId", "isProfile");
