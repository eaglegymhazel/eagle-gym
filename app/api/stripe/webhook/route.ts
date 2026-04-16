import Stripe from "stripe";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/admin";

export const runtime = "nodejs";

const stripeKey = process.env.STRIPE_SECRET_KEY || process.env.COMP_STRIPE_SECRET_KEY;
const stripe = new Stripe(stripeKey!, {
  apiVersion: "2026-01-28.clover",
});

export async function POST(req: Request) {
  if (!stripeKey) {
    return NextResponse.json({ error: "Stripe is not configured" }, { status: 500 });
  }

  const sig = req.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });

  const buf = Buffer.from(await req.arrayBuffer());

  const webhookSecrets = [
    process.env.STRIPE_WEBHOOK_SECRET,
    process.env.COMP_STRIPE_WEBHOOK_SECRET,
  ].filter((value): value is string => typeof value === "string" && value.trim().length > 0);

  if (webhookSecrets.length === 0) {
    return NextResponse.json({ error: "No webhook secret configured" }, { status: 500 });
  }

  let event: Stripe.Event;
  let verified = false;
  event = null as unknown as Stripe.Event;
  for (const secret of webhookSecrets) {
    try {
      event = stripe.webhooks.constructEvent(buf, sig, secret);
      verified = true;
      break;
    } catch {
      // Try next configured secret.
    }
  }

  if (!verified) {
    return NextResponse.json({ error: "Signature verification failed" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const subscriptionId =
      typeof session.subscription === "string"
        ? session.subscription
        : session.subscription?.id;

    console.log("REAL subscriptionId:", subscriptionId);

    await supabaseAdmin.from("StripeTestSubs").insert([
      {
        subscriptionId,
        checkoutSessionId: session.id,
      },
    ]);
  }

  return NextResponse.json({ ok: true });
}
