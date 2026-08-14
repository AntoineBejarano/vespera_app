import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { decideIdentityClaim } from "@/lib/core/identity-policy";

describe("identity linking policy", () => {
  it("fills an empty slot without evidence", () => {
    const d = decideIdentityClaim({
      kind: "telegramUserId",
      ownedByOtherSubject: false,
      evidence: null,
    });
    assert.equal(d.action, "fill");
  });

  it("rejects taking another subject's identity without evidence", () => {
    const d = decideIdentityClaim({
      kind: "telegramUserId",
      ownedByOtherSubject: true,
      evidence: { guess: true },
    });
    assert.equal(d.action, "reject");
    if (d.action === "reject") assert.equal(d.code, "NO_EVIDENCE");
  });

  it("allows a verified link when evidence is present", () => {
    const d = decideIdentityClaim({
      kind: "telegramUserId",
      ownedByOtherSubject: true,
      evidence: { type: "telegram_account_link" },
    });
    assert.equal(d.action, "fill");
  });
});
