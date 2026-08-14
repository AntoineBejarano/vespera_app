-- Reasoning runtime: workspace bindings + persona mode. Secrets stay in Railway env.

CREATE TABLE "RuntimeBinding" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'http',
    "baseUrl" TEXT NOT NULL,
    "authSecretRef" TEXT,
    "timeoutMs" INTEGER NOT NULL DEFAULT 30000,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RuntimeBinding_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "RuntimeBinding_workspaceId_idx" ON "RuntimeBinding"("workspaceId");

ALTER TABLE "RuntimeBinding" ADD CONSTRAINT "RuntimeBinding_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Character" ADD COLUMN "reasoningMode" TEXT NOT NULL DEFAULT 'native';
ALTER TABLE "Character" ADD COLUMN "reasoningBindingId" TEXT;
ALTER TABLE "Character" ADD COLUMN "capabilitiesJson" JSONB;

CREATE INDEX "Character_reasoningBindingId_idx" ON "Character"("reasoningBindingId");

ALTER TABLE "Character" ADD CONSTRAINT "Character_reasoningBindingId_fkey" FOREIGN KEY ("reasoningBindingId") REFERENCES "RuntimeBinding"("id") ON DELETE SET NULL ON UPDATE CASCADE;
