import { prisma } from "@/lib/db";
import { maybeExtractMemories } from "@/lib/memory/extractor";
import { maybeCreateSummary } from "@/lib/memory/summaries";
import { maybeUpdateRelationship } from "@/lib/persona/relationship";
import { maybeSyncIntentions } from "@/lib/persona/intentions";

export type PostTurnParams = {
  conversationId: string;
  upToMessageId: string;
  subjectId: string;
  characterId: string;
  userId?: string | null;
  userMessage: string;
  assistantMessage: string;
  modelId?: string;
};

/**
 * Idempotent async post-turn maintenance.
 * Safe to fire-and-forget after the user-visible reply is sent.
 */
export async function runPostTurnJob(params: PostTurnParams): Promise<void> {
  const claim = await prisma.postTurnJob
    .create({
      data: {
        conversationId: params.conversationId,
        upToMessageId: params.upToMessageId,
        kind: "all",
        status: "running",
      },
    })
    .catch(async () => {
      const existing = await prisma.postTurnJob.findUnique({
        where: {
          conversationId_upToMessageId_kind: {
            conversationId: params.conversationId,
            upToMessageId: params.upToMessageId,
            kind: "all",
          },
        },
      });
      if (existing?.status === "done") return null;
      if (existing?.status === "running") return null;
      return existing;
    });

  if (!claim) return;

  try {
    await maybeCreateSummary({
      conversationId: params.conversationId,
      characterId: params.characterId,
      modelId: params.modelId,
    });
    await maybeExtractMemories({
      subjectId: params.subjectId,
      characterId: params.characterId,
      userId: params.userId,
      userMessage: params.userMessage,
      assistantMessage: params.assistantMessage,
      modelId: params.modelId,
    });
    await maybeUpdateRelationship({
      subjectId: params.subjectId,
      characterId: params.characterId,
      userMessage: params.userMessage,
      assistantMessage: params.assistantMessage,
      modelId: params.modelId,
    });
    await maybeSyncIntentions({
      subjectId: params.subjectId,
      characterId: params.characterId,
      userMessage: params.userMessage,
      assistantMessage: params.assistantMessage,
      sourceMessageId: params.upToMessageId,
      modelId: params.modelId,
    });

    await prisma.postTurnJob.update({
      where: { id: claim.id },
      data: { status: "done", completedAt: new Date() },
    });
  } catch (error) {
    console.error("[post-turn]", error);
    await prisma.postTurnJob
      .update({
        where: { id: claim.id },
        data: {
          status: "error",
          error: error instanceof Error ? error.message : String(error),
          completedAt: new Date(),
        },
      })
      .catch(() => undefined);
  }
}

/** Schedule post-turn work without blocking the response path. */
export function enqueuePostTurn(params: PostTurnParams): void {
  void runPostTurnJob(params);
}
