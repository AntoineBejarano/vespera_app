import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  denyAdultEnvelope,
  isAdultPersonaBlockedFromExternal,
} from "@/lib/core/isolation";
import { resolveReasoningMode } from "@/lib/reasoning/mode";

describe("After Dark isolation", () => {
  it("blocks adult personas from external runtime", () => {
    assert.equal(isAdultPersonaBlockedFromExternal({ isAdult: true }), true);
    const denied = denyAdultEnvelope({ isAdult: true });
    assert.equal(denied?.status, 403);
  });

  it("allows SFW personas", () => {
    assert.equal(isAdultPersonaBlockedFromExternal({ isAdult: false }), false);
    assert.equal(denyAdultEnvelope({ isAdult: false }), null);
  });

  it("forces Native for adult even if mode is external", () => {
    assert.equal(
      resolveReasoningMode({ isAdult: true, reasoningMode: "external" }),
      "native",
    );
    assert.equal(
      resolveReasoningMode({ isAdult: false, reasoningMode: "external" }),
      "external",
    );
  });
});
