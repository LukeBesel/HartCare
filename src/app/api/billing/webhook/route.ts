import { getStripe } from "@/lib/stripe";
import { NextResponse } from "next/server";
import type Stripe from "stripe";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  // Read the raw body (required for signature verification).
  const rawBody = await req.text();
  const sig = req.headers.get("stripe-signature");

  // Not configured — acknowledge without processing so the app keeps working
  // in demo mode.
  if (!secret) {
    return NextResponse.json({ skipped: true });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(rawBody, sig ?? "", secret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed":
      console.log("[stripe] checkout.session.completed", event.id);
      // TODO: update subscriptions table (household)
      break;
    case "customer.subscription.updated":
      console.log("[stripe] customer.subscription.updated", event.id);
      // TODO: update subscriptions table (household)
      break;
    case "customer.subscription.deleted":
      console.log("[stripe] customer.subscription.deleted", event.id);
      // TODO: update subscriptions table (household)
      break;
    default:
      console.log("[stripe] unhandled event", event.type);
      break;
  }

  return NextResponse.json({ received: true });
}
