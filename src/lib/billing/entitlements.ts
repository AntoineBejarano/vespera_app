import { monetization, normalizePlanId } from "@/lib/monetization";
import type { StripeEligiblePlan } from "@/lib/billing/rails";

export type BillableFeature =
  | "daily_messages"
  | "personas"
  | "telegram_channel"
  | "chat_api"
  | "knowledge_packs"
  | "character_photos";

export type PlanEntitlements = {
  plan: "free" | "creator" | "studio";
  dailyMessages: number;
  maxCharacters: number;
  maxKnowledgePacks: number;
  maxPhotosPerCharacter: number;
  productionChannels: boolean;
};

const ENTITLEMENTS: Record<"free" | "creator" | "studio", PlanEntitlements> = {
  free: {
    plan: "free",
    dailyMessages: monetization.plans.free.dailyMessages,
    maxCharacters: monetization.plans.free.maxCharacters,
    maxKnowledgePacks: 1,
    maxPhotosPerCharacter: 3,
    productionChannels: false,
  },
  creator: {
    plan: "creator",
    dailyMessages: monetization.plans.creator.dailyMessages,
    maxCharacters: monetization.plans.creator.maxCharacters,
    maxKnowledgePacks: 3,
    maxPhotosPerCharacter: 12,
    productionChannels: true,
  },
  studio: {
    plan: "studio",
    dailyMessages: monetization.plans.studio.dailyMessages,
    maxCharacters: monetization.plans.studio.maxCharacters,
    maxKnowledgePacks: 10,
    maxPhotosPerCharacter: 40,
    productionChannels: true,
  },
};

export function entitlementsForPlan(plan: string): PlanEntitlements {
  const normalized = normalizePlanId(plan);
  if (normalized === "premium") return ENTITLEMENTS.studio;
  return ENTITLEMENTS[normalized];
}

export function recommendedPlanForFeature(
  feature: BillableFeature,
): StripeEligiblePlan {
  if (feature === "personas" || feature === "knowledge_packs") {
    return "studio";
  }
  return "creator";
}

export function upgradePlanForPersonaLimit(): StripeEligiblePlan {
  return "studio";
}

export function upgradePlanForDailyLimit(): StripeEligiblePlan {
  return "creator";
}
