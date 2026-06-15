import Stripe from "stripe";

export const STRIPE_ENABLED = !!process.env.STRIPE_SECRET_KEY;

export function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!);
}

export const PRICE_IDS: Record<string, string | undefined> = {
  premium: process.env.STRIPE_PRICE_PREMIUM,
  family: process.env.STRIPE_PRICE_FAMILY,
};
