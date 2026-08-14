import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { evaluateProposedRelationshipUpdate } from "@/lib/core/relationship-policy";

describe("proposed_relationship_update", () => {
  it("does not apply Hermes trusted as a privileged mutation", () => {
    const d = evaluateProposedRelationshipUpdate({
      currentStage: "new_contact",
      proposal: { stage: "trusted" },
    });
    assert.equal(d.accept, false);
    if (!d.accept) assert.match(d.reason, /invalid_transition/);
  });

  it("accepts a legal hop new_contact → active", () => {
    const d = evaluateProposedRelationshipUpdate({
      currentStage: "new_contact",
      proposal: { stage: "active" },
    });
    assert.equal(d.accept, true);
    if (d.accept) assert.equal(d.nextStage, "active");
  });
});
