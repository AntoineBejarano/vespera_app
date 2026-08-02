import { getAppUser } from "@/lib/session";
import { getStripe, isStripeConfigured } from "@/lib/stripe/client";
import { assertStripeSurfaceAllowed } from "@/lib/stripe/guard";
import { applySubscriptionToUser } from "@/lib/stripe/sync";
import { prisma } from "@/lib/db";

/**
 * Re-sync the logged-in user's plan from Stripe (smoke / recovery if webhook lagged).
 */
export async function POST() {
  const surface = await assertStripeSurfaceAllowed();
  if (!surface.ok) return surface.response;

  if (!isStripeConfigured()) {
    return Response.json(
      { error: "Stripe not configured", code: "STRIPE_NOT_CONFIGURED" },
      { status: 503 },
    );
  }

  const user = await getAppUser();
  if (!user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  const profile = await prisma.user.findUnique({ where: { id: user.id } });
  if (!profile?.stripeCustomerId && !profile?.stripeSubscriptionId) {
    return Response.json(
      { error: "No Stripe customer/subscription on this account", plan: profile?.plan ?? "free" },
      { status: 400 },
    );
  }

  const stripe = getStripe();
  let subId = profile.stripeSubscriptionId;

  if (!subId && profile.stripeCustomerId) {
    const list = await stripe.subscriptions.list({
      customer: profile.stripeCustomerId,
      status: "all",
      limit: 5,
    });
    const live = list.data.find(
      (s) =>
        s.status === "active" ||
        s.status === "trialing" ||
        s.status === "past_due",
    );
    subId = live?.id ?? list.data[0]?.id ?? null;
  }

  if (!subId) {
    await prisma.user.update({
      where: { id: profile.id },
      data: {
        plan: "free",
        stripeSubscriptionId: null,
        stripePriceId: null,
      },
    });
    return Response.json({ plan: "free", synced: true });
  }

  const sub = await stripe.subscriptions.retrieve(subId);
  await applySubscriptionToUser(profile.id, sub);
  const updated = await prisma.user.findUnique({
    where: { id: profile.id },
    select: {
      plan: true,
      stripeCustomerId: true,
      stripeSubscriptionId: true,
      stripePriceId: true,
    },
  });

  return Response.json({ synced: true, ...updated, stripeStatus: sub.status });
}
