export const monetization = {
  enabled: process.env.PREMIUM_ENABLED === "true",
  plans: {
    free: {
      id: "free",
      dailyMessages: Number(process.env.DAILY_MESSAGE_LIMIT ?? "40"),
      /** Starter (free) — aligned with public pricing. */
      maxCharacters: 1,
      label: "Free",
    },
    premium: {
      id: "premium",
      dailyMessages: 9999,
      /** Studio-tier ceiling until granular Creator/Studio billing ships. */
      maxCharacters: 3,
      label: "Premium",
      // Billing checkout not wired yet. Adult-friendly processor / Telegram Stars later.
      paymentNote:
        "Pagos: Telegram Stars o procesador compatible con adult (no Stripe).",
    },
  },
} as const;

export function maxCharactersForPlan(plan: string) {
  if (plan === "premium") return monetization.plans.premium.maxCharacters;
  return monetization.plans.free.maxCharacters;
}
