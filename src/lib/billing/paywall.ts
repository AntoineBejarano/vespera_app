import type { StripeEligiblePlan } from "@/lib/billing/rails";
import {
  type BillableFeature,
  recommendedPlanForFeature,
} from "@/lib/billing/entitlements";
import { logProductEvent } from "@/lib/product-events";

export type PaywallReason =
  | "daily_message_limit"
  | "persona_limit"
  | "knowledge_pack_limit"
  | "production_channel"
  | "feature_locked";

export type PaywallPayload = {
  error: "PAYWALL_REQUIRED";
  reason: PaywallReason;
  feature: BillableFeature;
  plan: StripeEligiblePlan;
  title: string;
  description: string;
  cta: string;
  secondaryCta: string;
  limit?: number;
  remaining?: number;
};

const COPY: Record<
  PaywallReason,
  Omit<PaywallPayload, "error" | "reason" | "feature" | "plan" | "limit" | "remaining">
> = {
  daily_message_limit: {
    title: "Keep the conversation going",
    description:
      "Creator removes the daily message cap so this persona can keep building memory with you.",
    cta: "Upgrade to Creator",
    secondaryCta: "Stay on Starter",
  },
  persona_limit: {
    title: "Your workspace is full",
    description:
      "Remove a persona to free your Starter slot, or use Studio for a larger roster.",
    cta: "Upgrade to Studio",
    secondaryCta: "Keep one persona",
  },
  knowledge_pack_limit: {
    title: "Teach more context",
    description:
      "Studio gives your personas more source packs for deeper, more specific memory and retrieval.",
    cta: "Upgrade to Studio",
    secondaryCta: "Use the free pack",
  },
  production_channel: {
    title: "Take this channel live",
    description:
      "Creator unlocks production headroom for Telegram and API usage beyond a private test.",
    cta: "Upgrade to Creator",
    secondaryCta: "Keep testing",
  },
  feature_locked: {
    title: "Unlock this feature",
    description:
      "Upgrade when you are ready to save time, remove limits, and use Vesperer in production.",
    cta: "Upgrade",
    secondaryCta: "Not now",
  },
};

export function buildPaywall(params: {
  reason: PaywallReason;
  feature: BillableFeature;
  plan?: StripeEligiblePlan;
  limit?: number;
  remaining?: number;
}): PaywallPayload {
  const plan = params.plan ?? recommendedPlanForFeature(params.feature);
  return {
    error: "PAYWALL_REQUIRED",
    reason: params.reason,
    feature: params.feature,
    plan,
    ...COPY[params.reason],
    limit: params.limit,
    remaining: params.remaining,
  };
}

export async function paywallResponse(params: {
  userId?: string | null;
  workspaceId?: string | null;
  reason: PaywallReason;
  feature: BillableFeature;
  plan?: StripeEligiblePlan;
  limit?: number;
  remaining?: number;
  status?: number;
  context?: Record<string, string | number | boolean | null>;
}) {
  const paywall = buildPaywall(params);
  await logProductEvent({
    type: "paywall_viewed",
    userId: params.userId,
    workspaceId: params.workspaceId,
    feature: params.feature,
    plan: paywall.plan,
    context: {
      reason: params.reason,
      limit: params.limit ?? null,
      remaining: params.remaining ?? null,
      ...(params.context ?? {}),
    },
  });

  return Response.json(paywall, { status: params.status ?? 402 });
}

export function isPaywallPayload(value: unknown): value is PaywallPayload {
  return (
    Boolean(value) &&
    typeof value === "object" &&
    (value as { error?: unknown }).error === "PAYWALL_REQUIRED"
  );
}
