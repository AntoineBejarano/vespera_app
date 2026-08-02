import "server-only";
import Stripe from "stripe";

let stripe: Stripe | null = null;

export function isStripeConfigured(): boolean {
  return Boolean(
    process.env.STRIPE_SECRET_KEY?.trim() &&
      process.env.STRIPE_PRICE_CREATOR?.trim() &&
      process.env.STRIPE_PRICE_STUDIO?.trim(),
  );
}

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }
  if (!stripe) {
    stripe = new Stripe(key, {
      // Pin when upgrading; omit apiVersion to use account default if preferred.
      typescript: true,
    });
  }
  return stripe;
}
