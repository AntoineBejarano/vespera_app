import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";

export type ProductEventType =
  | "signup_completed"
  | "first_value_reached"
  | "chat_message"
  | "character_created"
  | "character_imported"
  | "character_forked"
  | "daily_limit_hit"
  | "persona_limit_hit"
  | "paywall_viewed"
  | "checkout_started"
  | "checkout_completed"
  | "checkout_abandoned"
  | "billing_synced"
  | "payment_failed";

export async function logProductEvent(params: {
  type: ProductEventType | string;
  userId?: string | null;
  workspaceId?: string | null;
  feature?: string | null;
  plan?: string | null;
  surface?: string;
  context?: Prisma.InputJsonValue | null;
}) {
  try {
    await prisma.productEvent.create({
      data: {
        type: params.type,
        userId: params.userId ?? null,
        workspaceId: params.workspaceId ?? null,
        feature: params.feature ?? null,
        plan: params.plan ?? null,
        surface: params.surface ?? "apex_sfw",
        contextJson: params.context ?? undefined,
      },
    });
  } catch (error) {
    console.warn("[product_event] skipped", {
      type: params.type,
      userId: params.userId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
