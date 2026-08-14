-- Core continuity: conversation subject/channel, relationship lifecycle, identity links

ALTER TABLE "Conversation" ADD COLUMN "subjectId" TEXT;
ALTER TABLE "Conversation" ADD COLUMN "channel" TEXT NOT NULL DEFAULT 'web';

CREATE INDEX "Conversation_subjectId_characterId_idx" ON "Conversation"("subjectId", "characterId");
CREATE INDEX "Conversation_characterId_channel_idx" ON "Conversation"("characterId", "channel");

ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "RelationshipSubject"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "RelationshipState" ADD COLUMN "stage" TEXT NOT NULL DEFAULT 'new_contact';

CREATE TABLE "RelationshipStateEvent" (
    "id" TEXT NOT NULL,
    "relationshipStateId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "fromVersion" INTEGER NOT NULL,
    "toVersion" INTEGER NOT NULL,
    "fromStage" TEXT,
    "toStage" TEXT,
    "deltas" JSONB,
    "source" TEXT NOT NULL,
    "accepted" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RelationshipStateEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "RelationshipStateEvent_subjectId_characterId_createdAt_idx" ON "RelationshipStateEvent"("subjectId", "characterId", "createdAt");
CREATE INDEX "RelationshipStateEvent_relationshipStateId_createdAt_idx" ON "RelationshipStateEvent"("relationshipStateId", "createdAt");

ALTER TABLE "RelationshipStateEvent" ADD CONSTRAINT "RelationshipStateEvent_relationshipStateId_fkey" FOREIGN KEY ("relationshipStateId") REFERENCES "RelationshipState"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RelationshipStateEvent" ADD CONSTRAINT "RelationshipStateEvent_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "RelationshipSubject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RelationshipStateEvent" ADD CONSTRAINT "RelationshipStateEvent_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "SubjectIdentityLink" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "evidence" JSONB NOT NULL,
    "verifiedAt" TIMESTAMP(3),
    "mergedFromSubjectId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubjectIdentityLink_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SubjectIdentityLink_workspaceId_kind_value_key" ON "SubjectIdentityLink"("workspaceId", "kind", "value");
CREATE INDEX "SubjectIdentityLink_subjectId_idx" ON "SubjectIdentityLink"("subjectId");
CREATE INDEX "SubjectIdentityLink_workspaceId_idx" ON "SubjectIdentityLink"("workspaceId");

ALTER TABLE "SubjectIdentityLink" ADD CONSTRAINT "SubjectIdentityLink_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "RelationshipSubject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
