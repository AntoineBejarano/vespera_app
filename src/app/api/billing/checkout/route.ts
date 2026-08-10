import { headers } from "next/headers";
import { z } from "zod";
import { isStripeEligiblePlan } from "@/lib/billing/rails";
import { SITE_URL } from "@/lib/site";
import { getAppUser } from "@/lib/session";
import { getStripe, isStripeConfigured } from "@/lib/stripe/client";
import { priceIdForPlan } from "@/lib/stripe/catalog";
import { assertStripeSurfaceAllowed } from "@/lib/stripe/guard";
import { ensureStripeCustomerId } from "@/lib/stripe/sync";
import { prisma } from "@/lib/db";
import { logProductEvent } from "@/lib/product-events";
import { safeNextPath } from "@/lib/legal/access-cookie";
import { STUDIO_TRIAL_DAYS } from "@/lib/billing/trial";

const bodySchema = z.object({
  plan: z.enum(["creator", "studio"]),
  reason: z.string().max(80).optional(),
  source: z.string().max(80).optional(),
  feature: z.string().max(80).optional(),
  returnTo: z.string().max(500).optional(),
  startTrial: z.boolean().optional(),
});

function randomSuffix(len = 8): string {
  const alphabet = "abcdefghijklmnopqrstuvwxyz";
  let out = "";
  for (let i = 0; i < len; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)]!;
  }
  return out;
}

function billingReturnUrl(
  origin: string,
  path: string,
  result: "success" | "canceled",
  includeSessionId = false,
) {
  const url = new URL(path, origin);
  url.searchParams.set("billing", result);
  if (includeSessionId) {
    url.searchParams.set("session_id", "CHECKOUT_SESSION_ID_PLACEHOLDER");
  }
  return url
    .toString()
    .replace("CHECKOUT_SESSION_ID_PLACEHOLDER", "{CHECKOUT_SESSION_ID}");
}

export async function POST(req: Request) {
  const surface = await assertStripeSurfaceAllowed();
  if (!surface.ok) return surface.response;

  if (!isStripeConfigured()) {
    return Response.json(
      {
        error:
          "Stripe billing is not configured yet. Set STRIPE_SECRET_KEY and price IDs.",
        code: "STRIPE_NOT_CONFIGURED",
      },
      { status: 503 },
    );
  }

  const user = await getAppUser();
  if (!user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }
  if (user.isTelegramPeer) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success || !isStripeEligiblePlan(parsed.data.plan)) {
    return Response.json({ error: "Invalid plan" }, { status: 400 });
  }

  const priceId = priceIdForPlan(parsed.data.plan);
  if (!priceId) {
    return Response.json({ error: "Price not configured" }, { status: 503 });
  }

  const stripe = getStripe();
  const profile = await prisma.user.findUnique({ where: { id: user.id } });
  if (!profile) {
    return Response.json({ error: "User not found" }, { status: 404 });
  }

  const customerId = await ensureStripeCustomerId({
    userId: profile.id,
    email: profile.email,
    existingCustomerId: profile.stripeCustomerId,
    createCustomer: async (email) => {
      const customer = await stripe.customers.create({
        email: email ?? undefined,
        metadata: {
          vespererUserId: profile.id,
          surface: "apex_sfw",
        },
      });
      return customer.id;
    },
  });

  const startTrial = parsed.data.startTrial === true;
  if (
    startTrial &&
    (parsed.data.plan !== "studio" || parsed.data.reason !== "persona_limit")
  ) {
    return Response.json({ error: "Trial not available" }, { status: 400 });
  }
  if (startTrial) {
    const previousSubscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "all",
      limit: 1,
    });
    if (previousSubscriptions.data.length > 0) {
      return Response.json(
        {
          error: "This account has already used its Studio trial.",
          code: "TRIAL_NOT_ELIGIBLE",
        },
        { status: 409 },
      );
    }
  }

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  const origin =
    host && !host.includes("xxx.")
      ? `${proto}://${host}`
      : SITE_URL;
  const returnTo = safeNextPath(parsed.data.returnTo) ?? null;
  const successUrl = returnTo
    ? billingReturnUrl(origin, returnTo, "success", true)
    : `${origin}/settings?billing=success`;
  const cancelUrl = returnTo
    ? billingReturnUrl(origin, returnTo, "canceled")
    : `${origin}/#pricing`;

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    payment_method_types: ["card"],
    payment_method_collection: "always",
    allow_promotion_codes: true,
    success_url: successUrl,
    cancel_url: cancelUrl,
    client_reference_id: profile.id,
    metadata: {
      vespererUserId: profile.id,
      plan: parsed.data.plan,
      surface: "apex_sfw",
      reason: parsed.data.reason ?? "manual",
      source: parsed.data.source ?? "unknown",
      trial: startTrial ? `${STUDIO_TRIAL_DAYS}-day` : "none",
      integration: `apex-sfw-checkout-${randomSuffix()}`,
    },
    subscription_data: {
      metadata: {
        vespererUserId: profile.id,
        plan: parsed.data.plan,
        surface: "apex_sfw",
        trial: startTrial ? `${STUDIO_TRIAL_DAYS}-day` : "none",
      },
      ...(startTrial
        ? {
            trial_period_days: STUDIO_TRIAL_DAYS,
            trial_settings: {
              end_behavior: { missing_payment_method: "cancel" as const },
            },
          }
        : {}),
    },
  });

  if (!session.url) {
    return Response.json(
      { error: "Could not create checkout session" },
      { status: 500 },
    );
  }

  try {
    await prisma.checkoutIntent.create({
      data: {
        userId: profile.id,
        workspaceId: profile.activeWorkspaceId,
        plan: parsed.data.plan,
        reason: parsed.data.reason ?? null,
        source: parsed.data.source ?? null,
        stripeSessionId: session.id,
        checkoutUrl: session.url,
        metaJson: {
          feature: parsed.data.feature ?? null,
          priceId,
          surface: "apex_sfw",
          startTrial,
          trialDays: startTrial ? STUDIO_TRIAL_DAYS : null,
          returnTo,
        },
      },
    });
  } catch (error) {
    console.warn("[checkout_intent] skipped", {
      userId: profile.id,
      sessionId: session.id,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  await logProductEvent({
    type: "checkout_started",
    userId: profile.id,
    workspaceId: profile.activeWorkspaceId,
    feature: parsed.data.feature,
    plan: parsed.data.plan,
    context: {
      reason: parsed.data.reason ?? "manual",
      source: parsed.data.source ?? "unknown",
      stripeSessionId: session.id,
      startTrial,
      trialDays: startTrial ? STUDIO_TRIAL_DAYS : null,
    },
  });

  return Response.json({ url: session.url });
}
