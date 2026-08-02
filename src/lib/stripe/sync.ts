import "server-only";
import type Stripe from "stripe";
import { prisma } from "@/lib/db";
import { planFromPriceId } from "@/lib/stripe/catalog";

function priceIdFromSubscription(sub: Stripe.Subscription): string | null {
  const item = sub.items.data[0];
  const price = item?.price;
  if (!price) return null;
  return typeof price === "string" ? price : price.id;
}

export async function applySubscriptionToUser(
  userId: string,
  sub: Stripe.Subscription,
) {
  const priceId = priceIdFromSubscription(sub);
  const plan = priceId ? planFromPriceId(priceId) : null;
  const active =
    sub.status === "active" ||
    sub.status === "trialing" ||
    sub.status === "past_due";

  await prisma.user.update({
    where: { id: userId },
    data: {
      plan: active && plan ? plan : "free",
      stripeSubscriptionId: active ? sub.id : null,
      stripePriceId: active && priceId ? priceId : null,
    },
  });
}

export async function findUserIdForStripeCustomer(
  customerId: string,
): Promise<string | null> {
  const user = await prisma.user.findFirst({
    where: { stripeCustomerId: customerId },
    select: { id: true },
  });
  return user?.id ?? null;
}

export async function ensureStripeCustomerId(params: {
  userId: string;
  email: string | null;
  existingCustomerId: string | null;
  createCustomer: (email: string | undefined) => Promise<string>;
}): Promise<string> {
  if (params.existingCustomerId) return params.existingCustomerId;
  const customerId = await params.createCustomer(
    params.email ?? undefined,
  );
  await prisma.user.update({
    where: { id: params.userId },
    data: { stripeCustomerId: customerId },
  });
  return customerId;
}
