import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  isValidAuthSecretRef,
  resolveAuthSecret,
} from "@/lib/reasoning/secrets";

describe("authSecretRef", () => {
  it("rejects invalid env names", () => {
    assert.equal(isValidAuthSecretRef("not-valid"), false);
    assert.equal(isValidAuthSecretRef("../SECRET"), false);
    assert.equal(isValidAuthSecretRef("HERMES_RUNTIME_SECRET"), true);
  });

  it("does not read a missing secret", () => {
    const r = resolveAuthSecret("MISSING_RUNTIME_SECRET_XYZ");
    assert.equal(r.ok, false);
  });
});
