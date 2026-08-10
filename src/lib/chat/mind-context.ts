import { prisma } from "@/lib/db";
import { searchMemories } from "@/lib/memory/vector";
import { searchMem0Memories } from "@/lib/memory/mem0";
import { searchCharacterKnowledge } from "@/lib/knowledge/retrieve";
import { getLatestSummary } from "@/lib/memory/summaries";
import {
  ensureRelationshipState,
  toAffectSnapshot,
} from "@/lib/persona/relationship";
import { listOpenIntentions } from "@/lib/persona/intentions";
import { resolveSubject } from "@/lib/persona/subject";
import { normalizeAffect, type AffectSnapshot } from "@/lib/persona/affect";
import type { PersonaBundle } from "@/lib/persona/assemble";

export type MindActivityHit = {
  kind: "memory" | "knowledge" | "affect" | "intention" | "relationship";
  label: string;
  detail?: string;
};

export type LoadedMindContext = {
  subjectId: string;
  persona: PersonaBundle;
  affect: AffectSnapshot;
  memoryBrief: string[];
  knowledgeBrief: string[];
  intentionBrief: string[];
  summary: string | null;
  activity: MindActivityHit[];
  agency: {
    channels: string[];
    hasApiKey: boolean;
    photoCount: number;
    telegramBotCount: number;
  };
};

/**
 * Canonical mind load for every channel (web, Telegram, voice, API).
 * Affect + intentions + memories are always scoped to subjectId.
 */
export async function loadMindContext(params: {
  workspaceId: string;
  character: {
    id: string;
    name: string;
    intensity: number;
    soulMd: string | null;
    styleMd: string | null;
    rulesMd: string | null;
    contextMd: string | null;
    identityJson: unknown;
    limitsJson: unknown;
    channels: string[];
    apiKey: string | null;
    apiKeyHash: string | null;
  };
  query: string;
  conversationId: string;
  identities: {
    webUserId?: string | null;
    telegramUserId?: string | null;
    externalCustomerId?: string | null;
    displayName?: string | null;
  };
}): Promise<LoadedMindContext> {
  const subject = await resolveSubject({
    workspaceId: params.workspaceId,
    webUserId: params.identities.webUserId,
    telegramUserId: params.identities.telegramUserId,
    externalCustomerId: params.identities.externalCustomerId,
    displayName: params.identities.displayName,
  });

  const [
    localMemories,
    mem0Memories,
    knowledgeBrief,
    summary,
    relationship,
    intentions,
    photoCount,
    telegramBotCount,
  ] =
    await Promise.all([
      searchMemories({
        subjectId: subject.id,
        characterId: params.character.id,
        query: params.query,
        userId: params.identities.webUserId,
      }),
      searchMem0Memories({
        subjectId: subject.id,
        characterId: params.character.id,
        query: params.query,
      }),
      searchCharacterKnowledge({
        characterId: params.character.id,
        query: params.query,
      }),
      getLatestSummary(params.conversationId),
      ensureRelationshipState(
        subject.id,
        params.character.id,
        params.identities.webUserId,
      ),
      listOpenIntentions(subject.id, params.character.id),
      prisma.characterPhoto.count({ where: { characterId: params.character.id } }),
      prisma.telegramBot.count({
        where: { characterId: params.character.id, active: true },
      }),
    ]);

  const affect = toAffectSnapshot(relationship);
  const memories = [
    ...localMemories,
    ...mem0Memories.map((memory) => {
      const score =
        typeof memory.score === "number" ? ` ${memory.score.toFixed(2)}` : "";
      return `[mem0${score}] ${memory.content}`;
    }),
  ].slice(0, 10);
  const intentionBrief = intentions.map(
    (i) => `[${i.kind}] ${i.content}${i.dueHint ? ` (due: ${i.dueHint})` : ""}`,
  );

  const activity: MindActivityHit[] = [
    ...localMemories.slice(0, 4).map((m) => ({
      kind: "memory" as const,
      label: "Retrieved memory",
      detail: m.slice(0, 120),
    })),
    ...mem0Memories.slice(0, 2).map((m) => ({
      kind: "memory" as const,
      label: "Mem0 memory",
      detail: m.content.slice(0, 120),
    })),
    ...knowledgeBrief.slice(0, 3).map((k) => ({
      kind: "knowledge" as const,
      label: "Knowledge hit",
      detail: k.slice(0, 120),
    })),
    {
      kind: "relationship" as const,
      label: `Active relationship · ${affect.currentTone}`,
      detail: `trust ${affect.trust.toFixed(2)} · familiarity ${affect.familiarity.toFixed(2)}`,
    },
    ...intentionBrief.slice(0, 3).map((i) => ({
      kind: "intention" as const,
      label: "Open intention",
      detail: i.slice(0, 120),
    })),
  ];

  return {
    subjectId: subject.id,
    persona: {
      name: params.character.name,
      intensity: params.character.intensity,
      soulMd: params.character.soulMd,
      styleMd: params.character.styleMd,
      rulesMd: params.character.rulesMd,
      contextMd: params.character.contextMd,
      identityJson: params.character.identityJson,
      limitsJson: params.character.limitsJson,
    },
    affect: normalizeAffect(affect),
    memoryBrief: memories,
    knowledgeBrief,
    intentionBrief,
    summary: summary?.content ?? null,
    activity,
    agency: {
      channels: params.character.channels ?? [],
      hasApiKey: Boolean(params.character.apiKey || params.character.apiKeyHash),
      photoCount,
      telegramBotCount,
    },
  };
}
