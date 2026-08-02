import type { StripeEligiblePlan } from "@/lib/billing/rails";

/**
 * Product limits + billing surface.
 * Stripe = apex SFW (creator/studio) only.
 * After Dark = adult PSP / Telegram Stars — never Stripe.
 */
export const monetization = {
  enabled: process.env.PREMIUM_ENABLED === "true",
  stripeEnabled:
    process.env.PREMIUM_ENABLED === "true" &&
    Boolean(process.env.STRIPE_SECRET_KEY?.trim()),
  plans: {
    free: {
      id: "free" as const,
      dailyMessages: Number(process.env.DAILY_MESSAGE_LIMIT ?? "40"),
      maxCharacters: 1,
      label: "Starter",
      surface: "apex_sfw" as const,
    },
    creator: {
      id: "creator" as const,
      dailyMessages: 9999,
      maxCharacters: 1,
      label: "Creator",
      surface: "apex_sfw" as const,
      stripe: true as const,
    },
    studio: {
      id: "studio" as const,
      dailyMessages: 9999,
      maxCharacters: 3,
      label: "Studio",
      surface: "apex_sfw" as const,
      stripe: true as const,
    },
    /** @deprecated Prefer studio — kept for existing DB rows */
    premium: {
      id: "premium" as const,
      dailyMessages: 9999,
      maxCharacters: 3,
      label: "Studio",
      surface: "apex_sfw" as const,
      stripe: true as const,
    },
  },
  afterDark: {
    processorNote:
      "Adult billing uses creator-native / adult-friendly rails or Telegram Stars — not Stripe.",
  },
} as const;

export function maxCharactersForPlan(plan: string) {
  if (plan === "studio" || plan === "premium") {
    return monetization.plans.studio.maxCharacters;
  }
  if (plan === "creator") {
    return monetization.plans.creator.maxCharacters;
  }
  return monetization.plans.free.maxCharacters;
}

export function isPaidPlan(plan: string): boolean {
  return (
    plan === "creator" ||
    plan === "studio" ||
    plan === "premium"
  );
}

export function normalizePlanId(plan: string): "free" | StripeEligiblePlan | "premium" {
  if (plan === "creator" || plan === "studio" || plan === "premium") return plan;
  return "free";
}
