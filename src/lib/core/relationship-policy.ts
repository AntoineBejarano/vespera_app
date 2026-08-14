import { z } from "zod";
import type { ProposedRelationshipUpdate } from "@/lib/core/types";
import {
  isAllowedStageTransition,
  parseRelationshipStage,
  type RelationshipStage,
} from "@/lib/core/stages";

export const proposedRelationshipUpdateSchema = z.object({
  stage: z
    .enum(["new_contact", "active", "trusted", "distant"])
    .optional(),
  summary: z.string().max(280).optional(),
});

export type ProposedUpdateDecision =
  | { accept: true; nextStage: RelationshipStage; summary?: string }
  | { accept: false; reason: string };

export function evaluateProposedRelationshipUpdate(params: {
  currentStage: string;
  proposal: ProposedRelationshipUpdate | null | undefined;
}): ProposedUpdateDecision {
  if (!params.proposal) {
    return { accept: false, reason: "no_proposal" };
  }
  const current = parseRelationshipStage(params.currentStage);
  if (params.proposal.stage) {
    if (!isAllowedStageTransition(current, params.proposal.stage)) {
      return {
        accept: false,
        reason: `invalid_transition:${current}->${params.proposal.stage}`,
      };
    }
    return {
      accept: true,
      nextStage: params.proposal.stage,
      summary: params.proposal.summary,
    };
  }
  if (params.proposal.summary) {
    return { accept: true, nextStage: current, summary: params.proposal.summary };
  }
  return { accept: false, reason: "empty_proposal" };
}
