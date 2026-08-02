import { prisma } from "@/lib/db";
import { getStripe } from "@/lib/stripe/client";
import {
  applySubscriptionToUser,
  findUserIdForStripeCustomer,
} from "@/lib/stripe/sync";
import type Stripe from "stripe";

export const runtime = "nodejs";

async function userIdFromSubscription(
  sub: Stripe.Subscription,
): Promise<string | null> {
  const fromMeta = sub.metadata?.vespererUserId;
  if (fromMeta) return fromMeta;
  const customerId =
    typeof sub.customer === "string" ? sub.customer : sub.customer?.id;
  if (!customerId) return null;
  return findUserIdForStripeCustomer(customerId);
}

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!secret) {
    return Response.json(
      { error: "STRIPE_WEBHOOK_SECRET not configured" },
      { status: 503 },
    );
  }

  const stripe = getStripe();
  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return Response.json({ error: "Missing signature" }, { status: 400 });
  }

  const rawBody = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, secret);
  } catch {
    return Response.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode !== "subscription") break;
        const userId =
          session.metadata?.vespererUserId ?? session.client_reference_id;
        const subId =
          typeof session.subscription === "string"
            ? session.subscription
            : session.subscription?.id;
        if (!userId || !subId) break;
        const sub = await stripe.subscriptions.retrieve(subId);
        if (session.customer && typeof session.customer === "string") {
          await prisma.user.update({
            where: { id: userId },
            data: { stripeCustomerId: session.customer },
          });
        }
        await applySubscriptionToUser(userId, sub);
        break;
      }
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const userId = await userIdFromSubscription(sub);
        if (!userId) break;
        if (event.type === "customer.subscription.deleted") {
          await prisma.user.update({
            where: { id: userId },
            data: {
              plan: "free",
              stripeSubscriptionId: null,
              stripePriceId: null,
            },
          });
        } else {
          await applySubscriptionToUser(userId, sub);
        }
        break;
      }
      default:
        break;
    }
  } catch (err) {
    console.error("[stripe_webhook]", event.type, err);
    return Response.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return Response.json({ received: true });
}
