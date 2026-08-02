import type { StripeEligiblePlan } from "@/lib/billing/rails";

/** One Stripe Product per plan tier (Checkout line items show Product name). */
export const STRIPE_PLAN_ENV: Record<
  StripeEligiblePlan,
  { priceEnv: string; label: string; maxCharacters: number }
> = {
  creator: {
    priceEnv: "STRIPE_PRICE_CREATOR",
    label: "Creator",
    maxCharacters: 1,
  },
  studio: {
    priceEnv: "STRIPE_PRICE_STUDIO",
    label: "Studio",
    maxCharacters: 3,
  },
};

export function priceIdForPlan(plan: StripeEligiblePlan): string | null {
  const envKey = STRIPE_PLAN_ENV[plan].priceEnv;
  return process.env[envKey]?.trim() || null;
}

export function planFromPriceId(priceId: string): StripeEligiblePlan | null {
  for (const plan of Object.keys(STRIPE_PLAN_ENV) as StripeEligiblePlan[]) {
    if (priceIdForPlan(plan) === priceId) return plan;
  }
  return null;
}
