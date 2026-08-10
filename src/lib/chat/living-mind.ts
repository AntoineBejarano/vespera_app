import "server-only";

import { prisma } from "@/lib/db";
import { resolveSubject } from "@/lib/persona/subject";
import { ensureRelationshipState } from "@/lib/persona/relationship";
import { resolveVoiceForCharacter } from "@/lib/voice/characters";
import {
  hasWorkspacePermission,
  requireWorkspacePermission,
} from "@/lib/workspace/permissions";

export type LivingMindSnapshot = {
  subjectId: string;
  characterId: string;
  relationship: {
    mood: string;
    trust: number;
    familiarity: number;
    openness: number;
    energy: number;
    tone: string;
    summary: string | null;
  };
  memories: Array<{
    id: string;
    type: string;
    content: string;
    updatedAt: string;
  }>;
  intentions: Array<{
    id: string;
    kind: string;
    content: string;
    confidence: number;
    dueHint: string | null;
  }>;
  evidence: Array<{
    id: string;
    role: "user" | "assistant";
    content: string;
    createdAt: string;
  }>;
  summary: string | null;
  agency: {
    channels: string[];
    telegramPeers: number;
    hasApiKey: boolean;
    canChat: boolean;
    voice: "elevenlabs" | "browser";
  };
  updatedAt: string;
};

export async function loadLivingMindSnapshot(params: {
  userId: string;
  workspaceId: string;
  characterId: string;
}): Promise<LivingMindSnapshot> {
  await requireWorkspacePermission(
    params.userId,
    params.workspaceId,
    "chat_history.read",
  );

  const character = await prisma.character.findFirst({
    where: {
      id: params.characterId,
      workspaceId: params.workspaceId,
      archivedAt: null,
    },
    select: {
      id: true,
      name: true,
      slug: true,
      isAdult: true,
      channels: true,
      apiKey: true,
      apiKeyHash: true,
      telegramBots: {
        where: { active: true },
        select: { _count: { select: { peers: true } } },
      },
    },
  });
  if (!character) throw new Error("Persona not found in active workspace");

  const subject = await resolveSubject({
    workspaceId: params.workspaceId,
    webUserId: params.userId,
  });

  const relationship = await ensureRelationshipState(
    subject.id,
    character.id,
    params.userId,
  );

  const [memories, intentions, conversation, canChat] = await Promise.all([
    prisma.memory.findMany({
      where: { subjectId: subject.id, characterId: character.id },
      orderBy: { updatedAt: "desc" },
      take: 8,
      select: {
        id: true,
        type: true,
        content: true,
        updatedAt: true,
      },
    }),
    prisma.openIntention.findMany({
      where: {
        subjectId: subject.id,
        characterId: character.id,
        status: "open",
      },
      orderBy: [{ priority: "desc" }, { updatedAt: "desc" }],
      take: 6,
      select: {
        id: true,
        kind: true,
        content: true,
        confidence: true,
        dueHint: true,
      },
    }),
    prisma.conversation.findFirst({
      where: { userId: params.userId, characterId: character.id },
      orderBy: { updatedAt: "desc" },
      select: {
        updatedAt: true,
        messages: {
          orderBy: { createdAt: "desc" },
          take: 8,
          select: {
            id: true,
            role: true,
            content: true,
            createdAt: true,
          },
        },
        summaries: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { content: true },
        },
      },
    }),
    hasWorkspacePermission(
      params.userId,
      params.workspaceId,
      "playground.run",
    ),
  ]);

  const evidence = [...(conversation?.messages ?? [])]
    .reverse()
    .filter(
      (message): message is typeof message & { role: "user" | "assistant" } =>
        message.role === "user" || message.role === "assistant",
    )
    .map((message) => ({
      ...message,
      createdAt: message.createdAt.toISOString(),
    }));

  const declaredChannels = new Set(
    character.channels.map((channel) => channel.toLowerCase()),
  );
  declaredChannels.add("web");
  if (character.telegramBots.length) declaredChannels.add("telegram");

  const telegramPeers = character.telegramBots.reduce(
    (total, bot) => total + bot._count.peers,
    0,
  );
  const castVoice = resolveVoiceForCharacter(character);

  return {
    subjectId: subject.id,
    characterId: character.id,
    relationship: {
      mood: relationship.mood,
      trust: relationship.trust,
      familiarity: relationship.familiarity,
      openness: relationship.openness,
      energy: relationship.energy,
      tone: relationship.currentTone,
      summary: relationship.summary,
    },
    memories: memories.map((memory) => ({
      ...memory,
      updatedAt: memory.updatedAt.toISOString(),
    })),
    intentions,
    evidence,
    summary:
      conversation?.summaries[0]?.content ?? relationship.summary ?? null,
    agency: {
      channels: [...declaredChannels],
      telegramPeers,
      hasApiKey: Boolean(character.apiKey || character.apiKeyHash),
      canChat,
      voice: castVoice ? "elevenlabs" : "browser",
    },
    updatedAt: (conversation?.updatedAt ?? relationship.updatedAt).toISOString(),
  };
}
