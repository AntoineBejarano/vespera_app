-- Per-persona OpenRouter model (falls back to User.preferredModel when null)
ALTER TABLE "Character" ADD COLUMN "preferredModel" TEXT;
