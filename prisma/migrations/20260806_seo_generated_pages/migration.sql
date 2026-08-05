CREATE TABLE IF NOT EXISTS "SeoGeneratedPage" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "h1" TEXT NOT NULL,
    "metaDescription" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "audience" TEXT,
    "useCase" TEXT NOT NULL,
    "intent" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "topicFingerprint" TEXT NOT NULL,
    "contentJson" JSONB NOT NULL,
    "qaJson" JSONB,
    "score" INTEGER NOT NULL DEFAULT 0,
    "model" TEXT NOT NULL,
    "reviewerModel" TEXT,
    "costCents" INTEGER NOT NULL DEFAULT 0,
    "publishedAt" TIMESTAMP(3),
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SeoGeneratedPage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "SeoGenerationRun" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'running',
    "settingsJson" JSONB NOT NULL,
    "pagesAttempted" INTEGER NOT NULL DEFAULT 0,
    "pagesCreated" INTEGER NOT NULL DEFAULT 0,
    "pagesPublished" INTEGER NOT NULL DEFAULT 0,
    "costCents" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SeoGenerationRun_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "SeoGeneratedPage_slug_key" ON "SeoGeneratedPage"("slug");
CREATE UNIQUE INDEX IF NOT EXISTS "SeoGeneratedPage_topicFingerprint_key" ON "SeoGeneratedPage"("topicFingerprint");
CREATE INDEX IF NOT EXISTS "SeoGeneratedPage_status_publishedAt_idx" ON "SeoGeneratedPage"("status", "publishedAt");
CREATE INDEX IF NOT EXISTS "SeoGeneratedPage_category_status_idx" ON "SeoGeneratedPage"("category", "status");
CREATE INDEX IF NOT EXISTS "SeoGeneratedPage_generatedAt_idx" ON "SeoGeneratedPage"("generatedAt");
CREATE INDEX IF NOT EXISTS "SeoGenerationRun_status_startedAt_idx" ON "SeoGenerationRun"("status", "startedAt");
CREATE INDEX IF NOT EXISTS "SeoGenerationRun_source_startedAt_idx" ON "SeoGenerationRun"("source", "startedAt");
