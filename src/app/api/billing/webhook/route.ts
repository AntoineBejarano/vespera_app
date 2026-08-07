import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email/send";
import { SITE_URL } from "@/lib/site";
import { getStripe } from "@/lib/stripe/client";
import {
  applySubscriptionToUser,
  findUserIdForStripeCustomer,
} from "@/lib/stripe/sync";
import { logProductEvent } from "@/lib/product-events";
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

function subscriptionIdFromInvoice(invoice: Stripe.Invoice): string | null {
  const nested = invoice.parent?.subscription_details?.subscription;
  if (typeof nested === "string") return nested;
  if (nested && typeof nested === "object" && "id" in nested) {
    return nested.id;
  }
  const legacy = (invoice as { subscription?: string | Stripe.Subscription | null })
    .subscription;
  if (typeof legacy === "string") return legacy;
  if (legacy && typeof legacy === "object") return legacy.id;
  return null;
}

async function userIdFromInvoice(
  invoice: Stripe.Invoice,
): Promise<{ userId: string | null; sub: Stripe.Subscription | null }> {
  const stripe = getStripe();
  const subId = subscriptionIdFromInvoice(invoice);

  let sub: Stripe.Subscription | null = null;
  if (subId) {
    sub = await stripe.subscriptions.retrieve(subId);
    const fromSub = await userIdFromSubscription(sub);
    if (fromSub) return { userId: fromSub, sub };
  }

  const customerId =
    typeof invoice.customer === "string"
      ? invoice.customer
      : invoice.customer?.id;
  if (!customerId) return { userId: null, sub };
  return {
    userId: await findUserIdForStripeCustomer(customerId),
    sub,
  };
}

async function notifyPaymentFailed(userId: string, invoice: Stripe.Invoice) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, plan: true },
  });
  if (!user?.email) return;

  const settingsUrl = `${SITE_URL}/settings`;
  const amount =
    typeof invoice.amount_due === "number"
      ? (invoice.amount_due / 100).toFixed(2)
      : null;
  const currency = (invoice.currency || "eur").toUpperCase();
  const amountLine = amount ? `${amount} ${currency}` : "your renewal";

  await sendEmail({
    to: user.email,
    subject: "Vesperer — payment failed, update your card",
    text: [
      `We could not charge ${amountLine} for your Vesperer ${user.plan} plan.`,
      "",
      "Stripe will retry automatically. To keep access without interruption, update your payment method:",
      settingsUrl,
      "",
      "Open Settings → Manage billing (Customer Portal).",
      "",
      "— Vesperer / Deevly Labs LTD",
    ].join("\n"),
    html: `
      <p>We could not charge <strong>${amountLine}</strong> for your Vesperer <strong>${user.plan}</strong> plan.</p>
      <p>Stripe will retry automatically. To keep access without interruption, update your payment method in Settings → Manage billing.</p>
      <p><a href="${settingsUrl}">Open Settings</a></p>
      <p>— Vesperer / Deevly Labs LTD</p>
    `,
    idempotencyKey: `payment_failed:${invoice.id}`,
    tags: [
      { name: "template", value: "payment_failed" },
      { name: "product", value: "vesperer" },
    ],
  });
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
        await prisma.checkoutIntent.updateMany({
          where: { stripeSessionId: session.id },
          data: { status: "completed", completedAt: new Date() },
        });
        await logProductEvent({
          type: "checkout_completed",
          userId,
          plan: session.metadata?.plan ?? null,
          context: {
            stripeSessionId: session.id,
            reason: session.metadata?.reason ?? null,
            source: session.metadata?.source ?? null,
          },
        });
        break;
      }
      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;
        await prisma.checkoutIntent.updateMany({
          where: { stripeSessionId: session.id, status: "started" },
          data: { status: "canceled", canceledAt: new Date() },
        });
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
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const { userId, sub } = await userIdFromInvoice(invoice);
        if (!userId) {
          console.warn("[stripe_webhook] payment_failed: no user", invoice.id);
          break;
        }
        if (sub) {
          await applySubscriptionToUser(userId, sub);
        }
        console.warn("[stripe_webhook] payment_failed", {
          invoiceId: invoice.id,
          userId,
          attempt: invoice.attempt_count,
          status: sub?.status,
        });
        await notifyPaymentFailed(userId, invoice);
        await logProductEvent({
          type: "payment_failed",
          userId,
          plan: sub?.metadata?.plan ?? null,
          context: {
            invoiceId: invoice.id,
            attempt: invoice.attempt_count,
            status: sub?.status ?? null,
          },
        });
        break;
      }
      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        const { userId, sub } = await userIdFromInvoice(invoice);
        if (!userId || !sub) break;
        await applySubscriptionToUser(userId, sub);
        console.info("[stripe_webhook] invoice.paid", {
          invoiceId: invoice.id,
          userId,
          status: sub.status,
        });
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
