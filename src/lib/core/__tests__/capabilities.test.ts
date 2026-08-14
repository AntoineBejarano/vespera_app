import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseCapabilitiesJson } from "@/lib/core/capabilities";

describe("persona.capabilities", () => {
  it("defaults to none — tools are not required", () => {
    assert.deepEqual(parseCapabilitiesJson(null).items, []);
    assert.deepEqual(parseCapabilitiesJson({ items: [] }).items, []);
  });
});
