import { generateText } from "ai";
import { prisma } from "@/lib/db";
import { getOpenRouter } from "@/lib/ai/openrouter";
import { resolveInternalModel } from "@/lib/ai/models";

const SUMMARY_EVERY = 20;

export async function getLatestSummary(conversationId: string) {
  return prisma.summary.findFirst({
    where: { conversationId },
    orderBy: { createdAt: "desc" },
  });
}

export async function maybeCreateSummary(params: {
  conversationId: string;
  characterId: string;
  modelId?: string;
}) {
  const messageCount = await prisma.message.count({
    where: { conversationId: params.conversationId },
  });

  if (messageCount === 0 || messageCount % SUMMARY_EVERY !== 0) return null;

  const messages = await prisma.message.findMany({
    where: { conversationId: params.conversationId },
    orderBy: { createdAt: "desc" },
    take: SUMMARY_EVERY,
  });

  const chronological = [...messages].reverse();
  const transcript = chronological
    .map((m) => `${m.role}: ${m.content}`)
    .join("\n");

  try {
    const openrouter = getOpenRouter();
    const { text } = await generateText({
      model: openrouter(resolveInternalModel()),
      prompt: `Resume esta conversación adulta de forma compacta para continuidad emocional y narrativa.
Incluye hechos, tono relacional, hilos abiertos y preferencias. Máximo 180 palabras.

${transcript}`,
    });

    return prisma.summary.create({
      data: {
        conversationId: params.conversationId,
        characterId: params.characterId,
        content: text,
        upToMessageId: chronological.at(-1)?.id,
      },
    });
  } catch (error) {
    console.error("[summary]", error);
    return null;
  }
}
