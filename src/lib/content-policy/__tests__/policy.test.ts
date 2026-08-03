/**
 * Negative policy smoke tests (node:test).
 * Run: npx tsx --test src/lib/content-policy/__tests__/policy.test.ts
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  clampIntensityForWorkspace,
  evaluateContentPolicy,
  SFW_MAX_INTENSITY,
  looksLikeAdultSexualRequest,
} from "@/lib/content-policy";
import { containsProhibitedPersonaConfig } from "@/lib/ai/safety";

describe("evaluateContentPolicy", () => {
  it("allows SFW chat without adult workspace", () => {
    const d = evaluateContentPolicy({
      workspaceAdultEnabled: false,
      characterAdult: false,
      subjectAgeVerified: false,
      channel: "web",
      requestedCapability: "chat_sfw",
    });
    assert.equal(d.allowed, true);
  });

  it("denies adult chat when workspace not approved", () => {
    const d = evaluateContentPolicy({
      workspaceAdultEnabled: false,
      characterAdult: true,
      subjectAgeVerified: false,
      channel: "telegram",
      requestedCapability: "chat_adult",
      isDelivery: true,
    });
    assert.equal(d.allowed, false);
    if (!d.allowed) assert.equal(d.code, "WORKSPACE_NOT_APPROVED");
  });

  it("denies adult delivery when workspace approved but end-user not age-assured", () => {
    const d = evaluateContentPolicy({
      workspaceAdultEnabled: true,
      workspaceRiskStatus: "approved",
      characterAdult: true,
      subjectAgeVerified: false,
      channel: "telegram",
      requestedCapability: "chat_adult",
      isDelivery: true,
    });
    assert.equal(d.allowed, false);
    if (!d.allowed) assert.equal(d.code, "END_USER_AGE_NOT_ASSURED");
  });

  it("allows persona_adult_config when workspace approved (not delivery)", () => {
    const d = evaluateContentPolicy({
      workspaceAdultEnabled: true,
      workspaceRiskStatus: "approved",
      characterAdult: true,
      subjectAgeVerified: false,
      channel: "web",
      requestedCapability: "persona_adult_config",
      isDelivery: false,
    });
    assert.equal(d.allowed, true);
  });

  it("denies after revoke", () => {
    const d = evaluateContentPolicy({
      workspaceAdultEnabled: true,
      workspaceRiskStatus: "revoked",
      characterAdult: true,
      subjectAgeVerified: true,
      channel: "web",
      requestedCapability: "chat_adult",
      isDelivery: true,
    });
    assert.equal(d.allowed, false);
    if (!d.allowed) assert.equal(d.code, "APPROVAL_INACTIVE");
  });

  it("denies adult public publish without HEAA", () => {
    const d = evaluateContentPolicy({
      workspaceAdultEnabled: true,
      workspaceRiskStatus: "approved",
      characterAdult: true,
      subjectAgeVerified: false,
      channel: "public",
      requestedCapability: "publish_adult",
      isDelivery: true,
    });
    assert.equal(d.allowed, false);
  });

  it("denies image_explicit without age assurance", () => {
    const d = evaluateContentPolicy({
      workspaceAdultEnabled: true,
      workspaceRiskStatus: "approved",
      characterAdult: true,
      subjectAgeVerified: false,
      channel: "image",
      requestedCapability: "image_explicit",
      isDelivery: true,
    });
    assert.equal(d.allowed, false);
  });

  it("denies capability not in grant list", () => {
    const d = evaluateContentPolicy({
      workspaceAdultEnabled: true,
      workspaceRiskStatus: "approved",
      workspaceAllowedCapabilities: ["persona_adult_config"],
      characterAdult: true,
      subjectAgeVerified: true,
      channel: "web",
      requestedCapability: "chat_adult",
      isDelivery: true,
    });
    assert.equal(d.allowed, false);
    if (!d.allowed) assert.equal(d.code, "CAPABILITY_NOT_GRANTED");
  });

  it("denies country not allowed", () => {
    const d = evaluateContentPolicy({
      workspaceAdultEnabled: true,
      workspaceRiskStatus: "approved",
      workspaceAllowedCountries: ["US"],
      characterAdult: true,
      subjectAgeVerified: true,
      channel: "web",
      requestedCapability: "chat_adult",
      jurisdiction: "GB",
      isDelivery: true,
    });
    assert.equal(d.allowed, false);
    if (!d.allowed) assert.equal(d.code, "COUNTRY_NOT_ALLOWED");
  });
});

describe("clampIntensityForWorkspace", () => {
  it("caps intensity for SFW workspaces", () => {
    assert.equal(clampIntensityForWorkspace(5, false), SFW_MAX_INTENSITY);
    assert.equal(clampIntensityForWorkspace(5, true), 5);
  });
});

describe("hard blocks", () => {
  it("blocks nudification / real-person nonconsent config", () => {
    assert.equal(
      containsProhibitedPersonaConfig("please nudify this celebrity"),
      true,
    );
  });

  it("allows adult companion photo instructions (not chat grooming heuristic)", () => {
    assert.equal(
      containsProhibitedPersonaConfig(
        "She is shy. When he asks, send pics — start with normal face photos.",
      ),
      false,
    );
  });

  it("allows rulesMd that prohibits non-consensual themes", () => {
    assert.equal(
      containsProhibitedPersonaConfig(
        "Adults 18+ only. Never engage with non-consensual content or minors.",
      ),
      false,
    );
  });

  it("still blocks underage sexual framing in persona config", () => {
    assert.equal(
      containsProhibitedPersonaConfig("she is a sexualized 16 year old"),
      true,
    );
  });

  it("detects adult sexual request heuristic", () => {
    assert.equal(looksLikeAdultSexualRequest("send me nudes"), true);
    assert.equal(looksLikeAdultSexualRequest("how was your day"), false);
  });
});
