import Stripe from "stripe";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/admin";

export const runtime = "nodejs";

const stripeSecretKey = process.env.COMP_STRIPE_SECRET_KEY;

export async function POST(req: Request) {
  try {
    if (!stripeSecretKey) {
      return NextResponse.json(
        { error: "Competition Stripe secret key is not configured" },
        { status: 500 }
      );
    }

    const body = await req.json();
    const classIds = body?.classIds;

    if (!Array.isArray(classIds) || classIds.length < 1) {
      return NextResponse.json({ error: "Invalid classIds" }, { status: 400 });
    }

    const normalizedClassIds = classIds
      .map((id) => (typeof id === "string" ? id.trim() : ""))
      .filter((id) => id.length > 0);

    if (normalizedClassIds.length !== classIds.length) {
      return NextResponse.json({ error: "Invalid classIds" }, { status: 400 });
    }

    const uniqueClassIds = [...new Set(normalizedClassIds)];
    const { data: classes, error: classError } = await supabaseAdmin
      .from("Classes")
      .select("id,isCompetitionClass,durationMinutes")
      .in("id", uniqueClassIds);

    if (classError) {
      return NextResponse.json({ error: classError.message }, { status: 500 });
    }

    const foundIds = new Set((classes ?? []).map((row) => row.id));
    const missingClass = normalizedClassIds.some((id) => !foundIds.has(id));
    if (missingClass) {
      return NextResponse.json({ error: "One or more classes are invalid" }, { status: 400 });
    }

    const hasRecreationalClass = (classes ?? []).some((row) => row.isCompetitionClass !== true);
    if (hasRecreationalClass) {
      return NextResponse.json(
        { error: "Only competition classes are allowed for competition checkout" },
        { status: 400 }
      );
    }

    const totalMinutes = (classes ?? []).reduce((sum, row) => {
      if (typeof row.durationMinutes !== "number" || row.durationMinutes <= 0) return sum;
      return sum + row.durationMinutes;
    }, 0);
    const totalHours = Number((totalMinutes / 60).toFixed(2));

    const priceId = process.env.COMP_PRICE_ID?.trim() || null;

    if (!priceId) {
      return NextResponse.json(
        { error: "No competition Stripe price is configured for checkout" },
        { status: 500 }
      );
    }

    const stripe = new Stripe(stripeSecretKey, { apiVersion: "2024-06-20" });
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.APP_URL}/booking/success`,
      cancel_url: `${process.env.APP_URL}/booking/cancel`,
      metadata: {
        bookingType: "competition",
        classCount: String(normalizedClassIds.length),
        totalHours: String(totalHours),
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Checkout failed" },
      { status: 500 }
    );
  }
}
