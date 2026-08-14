import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildContextEnvelope } from "@/lib/core/continuity";
import { resolveReasoningMode } from "@/lib/reasoning/mode";
import { evaluateProposedRelationshipUpdate } from "@/lib/core/relationship-policy";
import { parseCapabilitiesJson } from "@/lib/core/capabilities";
import { normalizeAffect } from "@/lib/persona/affect";

const laura = {
  id: "char_laura",
  name: "Laura",
  soulMd: "Laura",
  styleMd: "warm",
  rulesMd: "kind",
  contextMd: null,
  intensity: 3,
  isAdult: false,
  channels: ["web", "telegram"],
  workspaceId: "ws_1",
};

const subject = {
  id: "subj_laura_alex",
  displayName: "Alex",
  webUserId: "user_1",
  telegramUserId: "tg_9",
  externalCustomerId: null as string | null,
};

function envelopeFor(channel: "web" | "api") {
  return buildContextEnvelope({
    character: laura,
    subject,
    affect: normalizeAffect({
      mood: "warm",
      trust: 0.5,
      affection: 0.45,
      energy: 0.6,
    }),
    intentions: [],
    stage: "active",
    channel,
    conversationId: "conv_shared",
    recent: [],
    summary: "We were talking yesterday.",
    memoryBrief: ["Alex likes espresso"],
    knowledgeBrief: [],
    currentMessage: "still there?",
  });
}

describe("Laura continuity across runtimes", () => {
  it("Native default does not change who Laura is", () => {
    assert.equal(
      resolveReasoningMode({ isAdult: false, reasoningMode: "native" }),
      "native",
    );
    const native = envelopeFor("web");
    assert.equal(native.persona.id, "char_laura");
    assert.equal(native.canonical_user_identity.subjectId, "subj_laura_alex");
  });

  it("External uses the same Laura identity and relationship", () => {
    const native = envelopeFor("web");
    const external = envelopeFor("api");
    assert.equal(native.persona.id, external.persona.id);
    assert.equal(
      native.canonical_user_identity.subjectId,
      external.canonical_user_identity.subjectId,
    );
    assert.equal(
      native.relationship_state.stage,
      external.relationship_state.stage,
    );
    assert.equal(resolveReasoningMode({ reasoningMode: "external" }), "external");
  });

  it("capabilities are optional and unused by reasoning", () => {
    const caps = parseCapabilitiesJson(undefined);
    assert.deepEqual(caps.items, []);
    const withCaps = parseCapabilitiesJson({
      items: [{ id: "save5hours", kind: "workflow", enabled: true }],
    });
    assert.equal(withCaps.items[0]?.id, "save5hours");
    const proposal = evaluateProposedRelationshipUpdate({
      currentStage: "active",
      proposal: { stage: "trusted" },
    });
    assert.equal(proposal.accept, true);
  });
});
