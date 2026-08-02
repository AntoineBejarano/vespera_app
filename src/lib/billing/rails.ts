/**
 * Payment-rail split for Stripe Restricted Businesses compliance.
 *
 * A subdomain alone is NOT enough. Stripe evaluates the merchant account and
 * what you charge for — not DNS. Adult AI companionship / erotic content is
 * Prohibited (incl. AI-generated mature content). See:
 * https://stripe.com/legal/restricted-businesses
 *
 * Rules enforced in code:
 * - Stripe Checkout / Portal / webhooks: SFW apex products only
 * - After Dark (xxx host): never create Stripe sessions
 * - Adult monetization: adult-friendly PSP and/or Telegram Stars (not wired here)
 */

export type BillingSurface = "apex_sfw" | "after_dark";

export const BILLING_RAILS = {
  apex_sfw: {
    processor: "stripe" as const,
    description:
      "Creator / Studio / Business SaaS on vesperer.com — AI persona infrastructure for creators, educators, and businesses (non-adult).",
    legal: ["/legal/billing", "/legal/refunds", "/legal/terms"],
  },
  after_dark: {
    processor: "adult_psp_or_stars" as const,
    description:
      "After Dark 18+ on xxx.vesperer.com — adult companions. Not billed via Stripe.",
    legal: [
      "/legal/adult-content",
      "/legal/acceptable-use",
      "/legal/terms",
      "/legal/billing",
    ],
  },
} as const;

/** Plans that may be sold through Stripe (apex SFW only). */
export const STRIPE_ELIGIBLE_PLANS = ["creator", "studio"] as const;
export type StripeEligiblePlan = (typeof STRIPE_ELIGIBLE_PLANS)[number];

export function isStripeEligiblePlan(
  plan: string,
): plan is StripeEligiblePlan {
  return (STRIPE_ELIGIBLE_PLANS as readonly string[]).includes(plan);
}
