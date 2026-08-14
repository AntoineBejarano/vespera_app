import type { ContextEnvelope, ReasoningResult } from "@/lib/core/types";

export type NativeReasonInput = {
  modelId: string;
  system: string;
  messages: { role: "user" | "assistant"; content: string }[];
  onFinish?: (text: string) => Promise<void> | void;
};

export type ReasoningRuntimeKind = "native" | "external";

export type RuntimeBindingView = {
  id: string;
  workspaceId: string;
  name: string;
  kind: string;
  baseUrl: string;
  authSecretRef: string | null;
  timeoutMs: number;
};

export type ReasoningRuntime = {
  kind: ReasoningRuntimeKind;
  reason(envelope: ContextEnvelope): Promise<ReasoningResult>;
};
