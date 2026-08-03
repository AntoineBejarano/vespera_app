/**
 * Central content policy — server authority for adult / SFW capabilities.
 * Workspace approval authorizes CONFIG only; end-user delivery requires age assurance.
 */

export const CONTENT_POLICY_VERSION = "2026-08-02";

export type PolicyChannel =
  | "web"
  | "telegram"
  | "api"
  | "cli"
  | "voice"
  | "image"
  | "public";

export type PolicyCapability =
  | "chat_sfw"
  | "chat_adult"
  | "image_upload"
  | "image_explicit"
  | "voice_sfw"
  | "voice_adult"
  | "persona_create"
  | "persona_adult_config"
  | "publish_public"
  | "publish_adult";

export type ContentPolicyContext = {
  workspaceAdultEnabled: boolean;
  workspaceRiskStatus?: string | null;
  workspaceApprovalExpired?: boolean;
  workspaceAllowedCapabilities?: string[];
  workspaceAllowedCountries?: string[];
  characterAdult: boolean;
  /** End-user HEAA — false/undefined denies adult delivery */
  subjectAgeVerified: boolean;
  channel: PolicyChannel;
  requestedCapability: PolicyCapability;
  jurisdiction?: string | null;
  policyVersion?: string;
  /** Explicit adult delivery request (chat/voice/image to end user) */
  isDelivery?: boolean;
};

export type PolicyDecision =
  | { allowed: true }
  | { allowed: false; code: string; reason: string };

const ADULT_CAPS = new Set<PolicyCapability>([
  "chat_adult",
  "image_explicit",
  "voice_adult",
  "persona_adult_config",
  "publish_adult",
]);

function isAdultCapability(cap: PolicyCapability) {
  return ADULT_CAPS.has(cap);
}

/**
 * Evaluate whether a capability is allowed.
 * Deny-by-default for any adult capability missing a required link.
 */
export function evaluateContentPolicy(
  ctx: ContentPolicyContext,
): PolicyDecision {
  const adultCap = isAdultCapability(ctx.requestedCapability);
  const delivery = ctx.isDelivery ?? isDeliveryCapability(ctx.requestedCapability);

  if (!adultCap) {
    // SFW path: still block if someone tries publish_adult-style via characterAdult flag
    if (ctx.requestedCapability === "publish_public" && ctx.characterAdult) {
      return {
        allowed: false,
        code: "ADULT_PUBLIC_ON_APEX",
        reason: "Adult personas cannot be published on the public apex surface",
      };
    }
    return { allowed: true };
  }

  // --- Adult capability gates ---

  if (!ctx.workspaceAdultEnabled) {
    return {
      allowed: false,
      code: "WORKSPACE_NOT_APPROVED",
      reason:
        "After Dark partner approval required. Apply via partners@vesperer.com",
    };
  }

  if (
    ctx.workspaceRiskStatus === "revoked" ||
    ctx.workspaceRiskStatus === "expired"
  ) {
    return {
      allowed: false,
      code: "APPROVAL_INACTIVE",
      reason: `Workspace adult approval is ${ctx.workspaceRiskStatus}`,
    };
  }

  if (ctx.workspaceApprovalExpired) {
    return {
      allowed: false,
      code: "APPROVAL_EXPIRED",
      reason: "Workspace adult approval has expired",
    };
  }

  const allowed = ctx.workspaceAllowedCapabilities;
  if (allowed && allowed.length > 0 && !allowed.includes(ctx.requestedCapability)) {
    return {
      allowed: false,
      code: "CAPABILITY_NOT_GRANTED",
      reason: `Capability ${ctx.requestedCapability} not granted to this partner`,
    };
  }

  if (ctx.jurisdiction && ctx.workspaceAllowedCountries?.length) {
    const code = ctx.jurisdiction.toUpperCase();
    if (!ctx.workspaceAllowedCountries.map((c) => c.toUpperCase()).includes(code)) {
      return {
        allowed: false,
        code: "COUNTRY_NOT_ALLOWED",
        reason: `Adult capability not allowed in ${code}`,
      };
    }
  }

  // Config vs delivery: approval alone never authorizes end-user adult delivery
  if (delivery) {
    // Until HEAA is integrated, deny all adult delivery to end users
    if (!ctx.subjectAgeVerified) {
      return {
        allowed: false,
        code: "END_USER_AGE_NOT_ASSURED",
        reason:
          "Adult content delivery requires highly effective age assurance for the end user",
      };
    }
  }

  // persona_adult_config is config-only — allowed when workspace approved
  if (
    ctx.requestedCapability === "persona_adult_config" ||
    (ctx.requestedCapability === "publish_adult" && !delivery)
  ) {
    return { allowed: true };
  }

  // Explicit image_explicit: deny until moderation + HEAA (stub)
  if (ctx.requestedCapability === "image_explicit") {
    if (!ctx.subjectAgeVerified) {
      return {
        allowed: false,
        code: "IMAGE_EXPLICIT_BLOCKED",
        reason: "Explicit image capability blocked until age assurance and moderation",
      };
    }
  }

  if (ctx.characterAdult === false && adultCap && delivery) {
    return {
      allowed: false,
      code: "PERSONA_NOT_ADULT",
      reason: "Persona is not marked adult",
    };
  }

  return { allowed: true };
}

function isDeliveryCapability(cap: PolicyCapability): boolean {
  return (
    cap === "chat_adult" ||
    cap === "voice_adult" ||
    cap === "image_explicit" ||
    cap === "publish_adult"
  );
}

export function assertContentPolicy(ctx: ContentPolicyContext): void {
  const decision = evaluateContentPolicy(ctx);
  if (!decision.allowed) {
    throw new ContentPolicyError(decision.reason, decision.code);
  }
}

export class ContentPolicyError extends Error {
  code: string;
  status = 403;
  constructor(message: string, code: string) {
    super(message);
    this.name = "ContentPolicyError";
    this.code = code;
  }
}

/** Heuristic: message seeks explicit sexual content (for SFW deny). */
export function looksLikeAdultSexualRequest(text: string): boolean {
  return (
    /\b(nude|nudes|naked|sex|fuck|porn|blowjob|handjob|cum|orgasm|hentai)\b/i.test(
      text,
    ) ||
    /\b(desnud[oa]|coger|follar|panocha|polla|tetas|culo)\b/i.test(text) ||
    /\bsend\s+(me\s+)?(nudes?|pics?\s+of\s+you\s+naked)\b/i.test(text)
  );
}

export const EXPLICIT_PHOTO_TAGS = new Set([
  "ass",
  "tits",
  "lingerie",
  "nude",
  "spicy",
  "bed",
]);

/** Max intensity for SFW (non-approved) workspaces — UX hint; runtime policy is authoritative. */
export const SFW_MAX_INTENSITY = 2;

export function clampIntensityForWorkspace(
  intensity: number,
  workspaceAdultEnabled: boolean,
): number {
  const n = Math.max(1, Math.min(5, Math.round(intensity)));
  if (!workspaceAdultEnabled) return Math.min(n, SFW_MAX_INTENSITY);
  return n;
}
