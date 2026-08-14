import { prisma } from "@/lib/db";
import {
  ensureRelationshipState,
  toAffectSnapshot,
} from "@/lib/persona/relationship";
import { listOpenIntentions } from "@/lib/persona/intentions";
import { evaluateProposedRelationshipUpdate } from "@/lib/core/relationship-policy";
import type { ProposedRelationshipUpdate } from "@/lib/core/types";
import { parseRelationshipStage } from "@/lib/core/stages";

export { ensureRelationshipState, toAffectSnapshot };

export async function getRelationship(params: {
  subjectId: string;
  characterId: string;
  bridgeUserId?: string | null;
}) {
  const row = await ensureRelationshipState(
    params.subjectId,
    params.characterId,
    params.bridgeUserId,
  );
  const intentions = await listOpenIntentions(params.subjectId, params.characterId);
  return {
    affect: toAffectSnapshot(row),
    stage: parseRelationshipStage(row.stage),
    intentions,
    version: row.version,
    relationshipStateId: row.id,
  };
}

export async function applyProposedRelationshipUpdate(params: {
  subjectId: string;
  characterId: string;
  proposal: ProposedRelationshipUpdate | null | undefined;
  source?: "proposed_runtime" | "explicit";
}): Promise<{ accepted: boolean; reason?: string }> {
  const current = await ensureRelationshipState(
    params.subjectId,
    params.characterId,
  );
  const decision = evaluateProposedRelationshipUpdate({
    currentStage: current.stage,
    proposal: params.proposal,
  });

  if (!decision.accept) {
    await prisma.relationshipStateEvent.create({
      data: {
        relationshipStateId: current.id,
        subjectId: params.subjectId,
        characterId: params.characterId,
        fromVersion: current.version,
        toVersion: current.version,
        fromStage: current.stage,
        toStage: params.proposal?.stage ?? current.stage,
        deltas: params.proposal ? { ...params.proposal } : undefined,
        source: params.source ?? "proposed_runtime",
        accepted: false,
      },
    });
    return { accepted: false, reason: decision.reason };
  }

  const updated = await prisma.relationshipState.update({
    where: { id: current.id },
    data: {
      stage: decision.nextStage,
      summary: decision.summary ?? current.summary,
      version: { increment: 1 },
    },
  });

  await prisma.relationshipStateEvent.create({
    data: {
      relationshipStateId: current.id,
      subjectId: params.subjectId,
      characterId: params.characterId,
      fromVersion: current.version,
      toVersion: updated.version,
      fromStage: current.stage,
      toStage: decision.nextStage,
      deltas: params.proposal ? { ...params.proposal } : undefined,
      source: params.source ?? "proposed_runtime",
      accepted: true,
    },
  });

  return { accepted: true };
}
