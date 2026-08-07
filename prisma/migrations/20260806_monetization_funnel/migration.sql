-- Persisted funnel analytics, notification dedupe, and checkout attribution.

CREATE TABLE IF NOT EXISTS "ProductEvent" (
  "id" TEXT NOT NULL,
  "userId" TEXT,
  "workspaceId" TEXT,
  "type" TEXT NOT NULL,
  "feature" TEXT,
  "surface" TEXT NOT NULL DEFAULT 'apex_sfw',
  "plan" TEXT,
  "contextJson" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ProductEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ProductEvent_userId_createdAt_idx"
  ON "ProductEvent"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "ProductEvent_workspaceId_createdAt_idx"
  ON "ProductEvent"("workspaceId", "createdAt");
CREATE INDEX IF NOT EXISTS "ProductEvent_type_createdAt_idx"
  ON "ProductEvent"("type", "createdAt");
CREATE INDEX IF NOT EXISTS "ProductEvent_feature_createdAt_idx"
  ON "ProductEvent"("feature", "createdAt");

CREATE TABLE IF NOT EXISTS "NotificationPreference" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "channel" TEXT NOT NULL,
  "topic" TEXT NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "NotificationPreference_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "NotificationPreference_userId_channel_topic_key"
  ON "NotificationPreference"("userId", "channel", "topic");
CREATE INDEX IF NOT EXISTS "NotificationPreference_userId_channel_idx"
  ON "NotificationPreference"("userId", "channel");

CREATE TABLE IF NOT EXISTS "NotificationDelivery" (
  "id" TEXT NOT NULL,
  "userId" TEXT,
  "channel" TEXT NOT NULL,
  "topic" TEXT NOT NULL,
  "templateId" TEXT,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "dedupeKey" TEXT NOT NULL,
  "error" TEXT,
  "metaJson" JSONB,
  "sentAt" TIMESTAMP(3),
  "skippedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "NotificationDelivery_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "NotificationDelivery_dedupeKey_key"
  ON "NotificationDelivery"("dedupeKey");
CREATE INDEX IF NOT EXISTS "NotificationDelivery_userId_createdAt_idx"
  ON "NotificationDelivery"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "NotificationDelivery_topic_status_idx"
  ON "NotificationDelivery"("topic", "status");
CREATE INDEX IF NOT EXISTS "NotificationDelivery_status_createdAt_idx"
  ON "NotificationDelivery"("status", "createdAt");

CREATE TABLE IF NOT EXISTS "CheckoutIntent" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "workspaceId" TEXT,
  "plan" TEXT NOT NULL,
  "reason" TEXT,
  "source" TEXT,
  "status" TEXT NOT NULL DEFAULT 'started',
  "stripeSessionId" TEXT,
  "checkoutUrl" TEXT,
  "metaJson" JSONB,
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP(3),
  "canceledAt" TIMESTAMP(3),
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "CheckoutIntent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "CheckoutIntent_stripeSessionId_key"
  ON "CheckoutIntent"("stripeSessionId");
CREATE INDEX IF NOT EXISTS "CheckoutIntent_userId_startedAt_idx"
  ON "CheckoutIntent"("userId", "startedAt");
CREATE INDEX IF NOT EXISTS "CheckoutIntent_status_startedAt_idx"
  ON "CheckoutIntent"("status", "startedAt");
CREATE INDEX IF NOT EXISTS "CheckoutIntent_reason_startedAt_idx"
  ON "CheckoutIntent"("reason", "startedAt");
