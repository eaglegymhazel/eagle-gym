import Stripe from "stripe";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/admin";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-06-20" });

export async function POST(req: Request) {
  try {
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
      .select("id,isCompetitionClass")
      .in("id", uniqueClassIds);

    if (classError) {
      return NextResponse.json({ error: classError.message }, { status: 500 });
    }

    const foundIds = new Set((classes ?? []).map((row) => row.id));
    const missingClass = normalizedClassIds.some((id) => !foundIds.has(id));
    if (missingClass) {
      return NextResponse.json({ error: "One or more classes are invalid" }, { status: 400 });
    }

    const hasCompetitionClass = (classes ?? []).some((row) => row.isCompetitionClass === true);
    if (hasCompetitionClass) {
      return NextResponse.json(
        { error: "Competition classes are not allowed for recreational checkout" },
        { status: 400 }
      );
    }

    const quantity = normalizedClassIds.length;

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: process.env.REC_PRICE_ID!, quantity }],
      success_url: `${process.env.APP_URL}/booking/success`,
      cancel_url: `${process.env.APP_URL}/booking/cancel`,
      metadata: {
        bookingType: "recreational",
        classCount: String(quantity),
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
