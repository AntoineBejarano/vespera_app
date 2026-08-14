import { prisma } from "@/lib/db";
import { appendHistory } from "@/lib/memory/history";
import { enqueuePostTurn } from "@/lib/chat/post-turn";
import { applyProposedRelationshipUpdate } from "@/lib/core/relationship";
import type { ProposedRelationshipUpdate } from "@/lib/core/types";

export type RecordInteractionInput = {
  conversationId: string;
  characterId: string;
  subjectId: string;
  userId: string;
  userMessage: string;
  assistantMessage: string;
  modelId?: string;
  proposed_relationship_update?: ProposedRelationshipUpdate | null;
  skipPostTurn?: boolean;
};

/**
 * Persist the turn and keep continuity inside Vesperer.
 * Does not dump model text into long-term memory — post-turn extractor decides.
 */
export async function recordInteraction(params: RecordInteractionInput) {
  const persistContent = params.assistantMessage.trim();
  if (!persistContent) return { assistantMessageId: null as string | null };

  const msg = await prisma.message.create({
    data: {
      conversationId: params.conversationId,
      role: "assistant",
      content: persistContent,
    },
  });
  await appendHistory(params.userId, params.characterId, {
    role: "assistant",
    content: persistContent,
  });
  await prisma.conversation.update({
    where: { id: params.conversationId },
    data: { updatedAt: new Date() },
  });

  if (!params.skipPostTurn) {
    enqueuePostTurn({
      conversationId: params.conversationId,
      upToMessageId: msg.id,
      subjectId: params.subjectId,
      characterId: params.characterId,
      userId: params.userId,
      userMessage: params.userMessage,
      assistantMessage: persistContent,
      modelId: params.modelId,
    });
  }

  if (params.proposed_relationship_update) {
    await applyProposedRelationshipUpdate({
      subjectId: params.subjectId,
      characterId: params.characterId,
      proposal: params.proposed_relationship_update,
      source: "proposed_runtime",
    });
  }

  return { assistantMessageId: msg.id };
}
