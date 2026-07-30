export const monetization = {
  enabled: process.env.PREMIUM_ENABLED === "true",
  plans: {
    free: {
      id: "free",
      dailyMessages: Number(process.env.DAILY_MESSAGE_LIMIT ?? "40"),
      maxCharacters: 20,
      label: "Free",
    },
    premium: {
      id: "premium",
      dailyMessages: 9999,
      maxCharacters: 50,
      label: "Premium",
      // Stripe no es viable para adulto; usar Telegram Stars o procesador adult-friendly.
      paymentNote:
        "Pagos: Telegram Stars o procesador compatible con adult (no Stripe).",
    },
  },
} as const;

export function maxCharactersForPlan(plan: string) {
  if (plan === "premium") return monetization.plans.premium.maxCharacters;
  return monetization.plans.free.maxCharacters;
}
