/**
 * V1 smoke: create a €0 Creator subscription (100% coupon), apply plan like the webhook,
 * verify DB, then cancel and revert to free.
 *
 * Usage: npx tsx scripts/smoke-billing.ts  (loads .env via dotenv / prisma.config)
 */
import "dotenv/config";
import Stripe from "stripe";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { planFromPriceId } from "../src/lib/stripe/catalog";

function priceIdFromSubscription(sub: Stripe.Subscription): string | null {
  const item = sub.items.data[0];
  const price = item?.price;
  if (!price) return null;
  return typeof price === "string" ? price : price.id;
}

async function main() {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  const priceId = process.env.STRIPE_PRICE_CREATOR?.trim();
  const dbUrl = process.env.DATABASE_URL?.trim();
  if (!key || !priceId || !dbUrl) {
    throw new Error("Need STRIPE_SECRET_KEY, STRIPE_PRICE_CREATOR, DATABASE_URL");
  }

  const stripe = new Stripe(key);
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: dbUrl }),
  });

  try {
    const coupons = await stripe.coupons.list({ limit: 30 });
    let coupon = coupons.data.find((c) => c.metadata?.vesperer === "smoke_v1");
    if (!coupon) {
      coupon = await stripe.coupons.create({
        percent_off: 100,
        duration: "once",
        name: "Vesperer V1 smoke (100% once)",
        metadata: { vesperer: "smoke_v1" },
      });
    }

    const user = await prisma.user.findFirst({
      where: { isTelegramPeer: false, email: { not: null } },
      orderBy: { createdAt: "asc" },
    });
    if (!user?.email) throw new Error("No user to smoke-test");

    console.log("smoke_user", user.email, user.id, "was_plan", user.plan);

    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          vespererUserId: user.id,
          surface: "apex_sfw",
          smoke: "v1",
        },
      });
      customerId = customer.id;
      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId: customerId },
      });
    }

    const existing = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 5,
    });
    for (const s of existing.data) {
      await stripe.subscriptions.cancel(s.id, { prorate: false });
      console.log("cancelled_old", s.id);
    }

    const sub = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      discounts: [{ coupon: coupon.id }],
      metadata: {
        vespererUserId: user.id,
        plan: "creator",
        surface: "apex_sfw",
        smoke: "v1",
      },
    });
    console.log("subscription", sub.id, sub.status);

    const priceFromSub = priceIdFromSubscription(sub);
    const plan = priceFromSub ? planFromPriceId(priceFromSub) : null;
    const active =
      sub.status === "active" ||
      sub.status === "trialing" ||
      sub.status === "past_due";

    await prisma.user.update({
      where: { id: user.id },
      data: {
        plan: active && plan ? plan : "free",
        stripeSubscriptionId: active ? sub.id : null,
        stripePriceId: active && priceFromSub ? priceFromSub : null,
      },
    });

    const after = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        plan: true,
        stripeSubscriptionId: true,
        stripePriceId: true,
      },
    });
    console.log("db_after_apply", after);

    if (after?.plan !== "creator" || after.stripeSubscriptionId !== sub.id) {
      throw new Error(
        `Smoke failed: expected creator, got ${JSON.stringify(after)}`,
      );
    }

    await stripe.subscriptions.cancel(sub.id, { prorate: false });
    await prisma.user.update({
      where: { id: user.id },
      data: {
        plan: "free",
        stripeSubscriptionId: null,
        stripePriceId: null,
      },
    });
    const cleaned = await prisma.user.findUnique({
      where: { id: user.id },
      select: { plan: true },
    });
    console.log("cleanup", cleaned);
    console.log("SMOKE_BILLING_OK");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
