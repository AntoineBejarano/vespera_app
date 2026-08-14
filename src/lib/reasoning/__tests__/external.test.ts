import { describe, it, mock } from "node:test";
import assert from "node:assert/strict";
import { reasonExternal } from "@/lib/reasoning/external";
import { CONTEXT_ENVELOPE_VERSION } from "@/lib/core/types";
import type { ContextEnvelope } from "@/lib/core/types";
import { normalizeAffect } from "@/lib/persona/affect";

function lauraEnvelope(): ContextEnvelope {
  return {
    version: CONTEXT_ENVELOPE_VERSION,
    persona: {
      id: "char_laura",
      name: "Laura",
      layers: { soul: "Laura", style: "warm", rules: "kind", context: null },
      intensity: 3,
      constraints: { isAdult: false, channels: ["web"] },
    },
    canonical_user_identity: {
      subjectId: "subj_laura_alex",
      displayName: "Alex",
      channels: { web: true, telegram: false, api: false },
    },
    relationship: {
      affect: normalizeAffect({
        mood: "warm",
        trust: 0.4,
        affection: 0.35,
        energy: 0.7,
      }),
      intentions: [],
    },
    relationship_state: { stage: "active" },
    channel: "web",
    conversation_id: "conv_1",
    conversation_context: {
      recent: [{ role: "user", content: "hi" }],
      summary: null,
    },
    relevant_persistent_context: { memoryBrief: [], knowledgeBrief: [] },
    current_message: "hi",
    metadata: { workspaceId: "ws_1" },
  };
}

describe("ExternalReasoningRuntime", () => {
  it("posts the envelope and parses ReasoningResult", async () => {
    process.env.HERMES_RUNTIME_SECRET = "test-secret";
    const originalFetch = globalThis.fetch;
    mock.method(globalThis, "fetch", async (_input: RequestInfo | URL, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body));
      assert.equal(body.persona.name, "Laura");
      assert.equal(body.canonical_user_identity.subjectId, "subj_laura_alex");
      assert.equal(typeof init?.headers, "object");
      return new Response(
        JSON.stringify({
          text: "hey — still me",
          proposed_relationship_update: { stage: "trusted" },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    });

    try {
      const result = await reasonExternal(lauraEnvelope(), {
        id: "bind_1",
        workspaceId: "ws_1",
        name: "mock-hermes",
        kind: "http",
        baseUrl: "http://localhost:3999/reason",
        authSecretRef: "HERMES_RUNTIME_SECRET",
        timeoutMs: 5000,
      });
      assert.equal(result.status, "ok");
      assert.equal(result.text, "hey — still me");
      assert.equal(result.proposed_relationship_update?.stage, "trusted");
    } finally {
      globalThis.fetch = originalFetch;
      delete process.env.HERMES_RUNTIME_SECRET;
    }
  });
});
