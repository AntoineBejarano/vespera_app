import type { ContextEnvelope } from "@/lib/core/types";
import { CONTEXT_ENVELOPE_VERSION } from "@/lib/core/types";
import { parseRelationshipStage } from "@/lib/core/stages";
import type { AffectSnapshot } from "@/lib/persona/affect";
import type { ReasoningChannel } from "@/lib/core/types";

const INTERNAL_KEYS = new Set([
  "vectorId",
  "embedding",
  "prisma",
  "memoryId",
  "rawSql",
]);

export function stripInternalFields<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => stripInternalFields(item)) as T;
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
      if (INTERNAL_KEYS.has(key)) continue;
      out[key] = stripInternalFields(nested);
    }
    return out as T;
  }
  return value;
}

export function buildContextEnvelope(params: {
  character: {
    id: string;
    name: string;
    soulMd: string | null;
    styleMd: string | null;
    rulesMd: string | null;
    contextMd: string | null;
    intensity: number;
    isAdult: boolean;
    channels: string[];
    workspaceId: string;
  };
  subject: {
    id: string;
    displayName: string | null;
    webUserId?: string | null;
    telegramUserId?: string | null;
    externalCustomerId?: string | null;
  };
  affect: AffectSnapshot;
  intentions: string[];
  stage: string;
  channel: ReasoningChannel;
  conversationId: string;
  recent: { role: "user" | "assistant"; content: string }[];
  summary: string | null;
  memoryBrief: string[];
  knowledgeBrief: string[];
  currentMessage: string;
  modelId?: string;
}): ContextEnvelope {
  const envelope: ContextEnvelope = {
    version: CONTEXT_ENVELOPE_VERSION,
    persona: {
      id: params.character.id,
      name: params.character.name,
      layers: {
        soul: params.character.soulMd,
        style: params.character.styleMd,
        rules: params.character.rulesMd,
        context: params.character.contextMd,
      },
      intensity: params.character.intensity,
      constraints: {
        isAdult: params.character.isAdult,
        channels: params.character.channels ?? [],
      },
    },
    canonical_user_identity: {
      subjectId: params.subject.id,
      displayName: params.subject.displayName,
      channels: {
        web: Boolean(params.subject.webUserId),
        telegram: Boolean(params.subject.telegramUserId),
        api: Boolean(params.subject.externalCustomerId),
      },
    },
    relationship: {
      affect: params.affect,
      intentions: params.intentions,
    },
    relationship_state: {
      stage: parseRelationshipStage(params.stage),
    },
    channel: params.channel,
    conversation_id: params.conversationId,
    conversation_context: {
      recent: params.recent,
      summary: params.summary,
    },
    relevant_persistent_context: {
      memoryBrief: params.memoryBrief,
      knowledgeBrief: params.knowledgeBrief,
    },
    current_message: params.currentMessage,
    metadata: {
      workspaceId: params.character.workspaceId,
      modelId: params.modelId,
    },
  };
  return stripInternalFields(envelope);
}
