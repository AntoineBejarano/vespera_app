import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildContextEnvelope, stripInternalFields } from "@/lib/core/continuity";
import { CONTEXT_ENVELOPE_VERSION } from "@/lib/core/types";
import { normalizeAffect } from "@/lib/persona/affect";

describe("ContextEnvelope", () => {
  it("has a stable public shape without internal memory ids", () => {
    const envelope = buildContextEnvelope({
      character: {
        id: "char_laura",
        name: "Laura",
        soulMd: "I am Laura.",
        styleMd: "Warm.",
        rulesMd: "Be kind.",
        contextMd: null,
        intensity: 3,
        isAdult: false,
        channels: ["web"],
        workspaceId: "ws_1",
      },
      subject: {
        id: "subj_1",
        displayName: "Alex",
        webUserId: "user_1",
        telegramUserId: null,
        externalCustomerId: null,
      },
      affect: normalizeAffect({
        mood: "warm",
        trust: 0.4,
        affection: 0.35,
        energy: 0.7,
      }),
      intentions: ["follow up on the launch"],
      stage: "active",
      channel: "web",
      conversationId: "conv_1",
      recent: [{ role: "user", content: "hey" }],
      summary: null,
      memoryBrief: ["likes morning coffee"],
      knowledgeBrief: [],
      currentMessage: "hey",
      modelId: "test-model",
    });

    assert.equal(envelope.version, CONTEXT_ENVELOPE_VERSION);
    assert.equal(envelope.persona.name, "Laura");
    assert.equal(envelope.canonical_user_identity.subjectId, "subj_1");
    assert.equal(envelope.relationship_state.stage, "active");
    assert.equal("vectorId" in envelope, false);
    assert.equal("memoryId" in envelope.relevant_persistent_context, false);

    const dirty = stripInternalFields({
      memoryBrief: ["x"],
      vectorId: "secret",
      nested: { embedding: [0.1], ok: true },
    });
    assert.equal("vectorId" in dirty, false);
    assert.equal("embedding" in (dirty as { nested: object }).nested, false);
  });
});
