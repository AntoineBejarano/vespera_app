import { prisma } from "@/lib/db";
import type { ReasoningChannel } from "@/lib/core/types";
import { getRecentHistory } from "@/lib/memory/history";
import { getLatestSummary } from "@/lib/memory/summaries";

export async function ensureConversation(
  userId: string,
  characterId: string,
  extras?: { subjectId?: string | null; channel?: ReasoningChannel },
) {
  const existing = await prisma.conversation.findFirst({
    where: { userId, characterId },
    orderBy: { updatedAt: "desc" },
  });
  if (existing) {
    if (
      extras?.subjectId &&
      (!existing.subjectId || existing.channel !== extras.channel)
    ) {
      return prisma.conversation.update({
        where: { id: existing.id },
        data: {
          subjectId: existing.subjectId ?? extras.subjectId,
          channel: extras.channel ?? existing.channel,
        },
      });
    }
    return existing;
  }
  return prisma.conversation.create({
    data: {
      userId,
      characterId,
      title: "Conversation",
      subjectId: extras?.subjectId ?? undefined,
      channel: extras?.channel ?? "web",
    },
  });
}

export async function resumeConversation(params: {
  characterId: string;
  subjectId: string;
  userId?: string | null;
  channel?: ReasoningChannel;
}) {
  const bySubject = await prisma.conversation.findFirst({
    where: { characterId: params.characterId, subjectId: params.subjectId },
    orderBy: { updatedAt: "desc" },
  });
  if (bySubject) return bySubject;

  if (params.userId) {
    return ensureConversation(params.userId, params.characterId, {
      subjectId: params.subjectId,
      channel: params.channel,
    });
  }

  return null;
}

export async function getConversationContext(params: {
  conversationId: string;
  userId: string;
  characterId: string;
  limit?: number;
}) {
  const [recent, summary] = await Promise.all([
    getRecentHistory(params.userId, params.characterId, params.limit ?? 25),
    getLatestSummary(params.conversationId),
  ]);
  return {
    recent: recent
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    summary: summary?.content ?? null,
  };
}
