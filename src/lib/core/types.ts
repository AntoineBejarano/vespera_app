import type { AffectSnapshot } from "@/lib/persona/affect";
import type { RelationshipStage } from "@/lib/core/stages";

export const CONTEXT_ENVELOPE_VERSION = "vesperer.context_envelope.v1" as const;

export type ReasoningChannel = "web" | "telegram" | "api" | "voice";

export type ReasoningMode = "native" | "external";

export type { RelationshipStage };

export type ContextEnvelope = {
  version: typeof CONTEXT_ENVELOPE_VERSION;
  persona: {
    id: string;
    name: string;
    layers: {
      soul: string | null;
      style: string | null;
      rules: string | null;
      context: string | null;
    };
    intensity: number;
    constraints: {
      isAdult: boolean;
      channels: string[];
    };
  };
  canonical_user_identity: {
    subjectId: string;
    displayName: string | null;
    channels: {
      web: boolean;
      telegram: boolean;
      api: boolean;
    };
  };
  relationship: {
    affect: AffectSnapshot;
    intentions: string[];
  };
  relationship_state: {
    stage: RelationshipStage;
  };
  channel: ReasoningChannel;
  conversation_id: string;
  conversation_context: {
    recent: { role: "user" | "assistant"; content: string }[];
    summary: string | null;
  };
  relevant_persistent_context: {
    memoryBrief: string[];
    knowledgeBrief: string[];
  };
  current_message: string;
  metadata: {
    workspaceId: string;
    modelId?: string;
  };
};

export type ProposedRelationshipUpdate = {
  stage?: RelationshipStage;
  summary?: string;
};

export type ReasoningResult = {
  text: string;
  status: "ok" | "error" | "empty";
  usage?: { promptTokens?: number; completionTokens?: number };
  metadata?: Record<string, unknown>;
  requested_actions?: unknown[];
  proposed_relationship_update?: ProposedRelationshipUpdate;
  continuation?: unknown;
  error?: string;
};
