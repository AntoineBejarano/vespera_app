import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireRuntimeAuth } from "@/lib/core/runtime-auth";
import { resolveIdentity } from "@/lib/core/identity";
import { resumeConversation } from "@/lib/core/conversation";
import { buildContextEnvelope } from "@/lib/core/continuity";
import { loadMindContext } from "@/lib/chat/mind-context";
import { getRecentHistory } from "@/lib/memory/history";
import { resolveModel } from "@/lib/ai/models";
import type { ReasoningChannel } from "@/lib/core/types";

export const maxDuration = 60;

const bodySchema = z.object({
  message: z.string().min(1).max(8000),
  characterId: z.string().optional(),
  channel: z.enum(["web", "telegram", "api", "voice"]).optional(),
  subjectId: z.string().optional(),
  identities: z
    .object({
      webUserId: z.string().optional(),
      telegramUserId: z.string().optional(),
      externalCustomerId: z.string().optional(),
      displayName: z.string().max(80).optional(),
    })
    .optional(),
});

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid data", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const auth = await requireRuntimeAuth(req, parsed.data.characterId);
  if ("error" in auth) return auth.error;

  const character = await prisma.character.findFirst({
    where: { id: auth.character.id, archivedAt: null },
  });
  if (!character) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const channel: ReasoningChannel = parsed.data.channel ?? "api";
  let subject = parsed.data.subjectId
    ? await prisma.relationshipSubject.findFirst({
        where: {
          id: parsed.data.subjectId,
          workspaceId: character.workspaceId,
        },
      })
    : null;

  if (!subject) {
    const ids = parsed.data.identities;
    subject = await resolveIdentity({
      workspaceId: character.workspaceId,
      webUserId: ids?.webUserId ?? (!ids ? auth.userId : undefined),
      telegramUserId: ids?.telegramUserId,
      externalCustomerId: ids?.externalCustomerId,
      displayName: ids?.displayName,
    });
  }

  const conversation = await resumeConversation({
    characterId: character.id,
    subjectId: subject.id,
    userId: subject.webUserId ?? auth.userId,
    channel,
  });
  if (!conversation) {
    return Response.json(
      { error: "Could not resume conversation." },
      { status: 400 },
    );
  }

  const historyUserId = conversation.userId;
  const recent = await getRecentHistory(historyUserId, character.id, 25);
  const mind = await loadMindContext({
    workspaceId: character.workspaceId,
    character,
    query: parsed.data.message,
    conversationId: conversation.id,
    identities: {
      webUserId: subject.webUserId,
      telegramUserId: subject.telegramUserId,
      externalCustomerId: subject.externalCustomerId,
      displayName: subject.displayName,
    },
  });

  const envelope = buildContextEnvelope({
    character: {
      id: character.id,
      name: character.name,
      soulMd: character.soulMd,
      styleMd: character.styleMd,
      rulesMd: character.rulesMd,
      contextMd: character.contextMd,
      intensity: character.intensity,
      isAdult: character.isAdult,
      channels: character.channels,
      workspaceId: character.workspaceId,
    },
    subject: mind.subject,
    affect: mind.affect,
    intentions: mind.intentionBrief,
    stage: mind.stage,
    channel,
    conversationId: conversation.id,
    recent: [
      ...recent
        .filter((m) => m.role === "user" || m.role === "assistant")
        .map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
      { role: "user", content: parsed.data.message },
    ],
    summary: mind.summary,
    memoryBrief: mind.memoryBrief,
    knowledgeBrief: mind.knowledgeBrief,
    currentMessage: parsed.data.message,
    modelId: resolveModel(character.preferredModel),
  });

  return Response.json({ envelope });
}
