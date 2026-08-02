import { headers } from "next/headers";
import { SITE_URL } from "@/lib/site";
import { getAppUser } from "@/lib/session";
import { getStripe, isStripeConfigured } from "@/lib/stripe/client";
import { assertStripeSurfaceAllowed } from "@/lib/stripe/guard";
import { prisma } from "@/lib/db";

export async function POST() {
  const surface = await assertStripeSurfaceAllowed();
  if (!surface.ok) return surface.response;

  if (!isStripeConfigured()) {
    return Response.json(
      { error: "Stripe billing is not configured", code: "STRIPE_NOT_CONFIGURED" },
      { status: 503 },
    );
  }

  const user = await getAppUser();
  if (!user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  const profile = await prisma.user.findUnique({ where: { id: user.id } });
  if (!profile?.stripeCustomerId) {
    return Response.json(
      { error: "No billing customer yet. Start a paid plan first." },
      { status: 400 },
    );
  }

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  const origin =
    host && !isAfterDarkish(host) ? `${proto}://${host}` : SITE_URL;

  const stripe = getStripe();
  const session = await stripe.billingPortal.sessions.create({
    customer: profile.stripeCustomerId,
    return_url: `${origin}/settings`,
  });

  return Response.json({ url: session.url });
}

function isAfterDarkish(host: string): boolean {
  const h = host.split(":")[0]?.toLowerCase() ?? "";
  return h.startsWith("xxx.") || h === "xxx.localhost";
}
