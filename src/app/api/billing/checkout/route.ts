import { PRICE_IDS, STRIPE_ENABLED, getStripe } from "@/lib/stripe";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

interface Body {
  tier?: string;
}

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const tier = body.tier;
  if (tier !== "premium" && tier !== "family") {
    return NextResponse.json({ error: "Invalid tier" }, { status: 400 });
  }

  const priceId = PRICE_IDS[tier];

  // Demo mode: no Stripe config or no price configured — let the client fall
  // back to the existing mock upgrade flow.
  if (!STRIPE_ENABLED || !priceId) {
    return NextResponse.json({ demo: true });
  }

  // Derive the origin from the request so success/cancel URLs are absolute.
  const origin =
    req.headers.get("origin") ??
    new URL(req.url).origin;

  try {
    const session = await getStripe().checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/billing?status=success`,
      cancel_url: `${origin}/billing?status=cancelled`,
    });
    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Checkout failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
