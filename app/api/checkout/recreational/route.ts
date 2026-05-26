import Stripe from "stripe";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/admin";
import { getBookingContext } from "@/lib/server/bookingContext";

export const runtime = "nodejs";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const HOLD_MINUTES = 15;

type ClassRow = {
  id: string;
  isCompetitionClass: boolean | null;
};

export async function POST(req: Request) {
  let bookingGroupId = "";

  try {
    if (!stripeSecretKey) {
      return NextResponse.json({ error: "Stripe is not configured" }, { status: 500 });
    }
    if (!process.env.REC_PRICE_ID) {
      return NextResponse.json({ error: "Recreational Stripe price is not configured" }, { status: 500 });
    }

    const body = await req.json();
    const childId = typeof body?.childId === "string" ? body.childId.trim() : "";
    const classIds = body?.classIds;

    if (!childId || !Array.isArray(classIds) || classIds.length < 1) {
      return NextResponse.json({ error: "Invalid classIds" }, { status: 400 });
    }

    const normalizedClassIds = classIds
      .map((id) => (typeof id === "string" ? id.trim() : ""))
      .filter((id) => id.length > 0);

    if (normalizedClassIds.length !== classIds.length) {
      return NextResponse.json({ error: "Invalid classIds" }, { status: 400 });
    }

    const bookingContext = await getBookingContext();
    if (bookingContext.status === "unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (bookingContext.status !== "existing") {
      return NextResponse.json({ error: "Account details not found" }, { status: 400 });
    }

    const child = bookingContext.children.find((item) => item.id === childId);
    if (!child?.id) {
      return NextResponse.json({ error: "Child not found" }, { status: 404 });
    }

    const uniqueClassIds = [...new Set(normalizedClassIds)];
    const { data: classes, error: classError } = await supabaseAdmin
      .from("Classes")
      .select("id,isCompetitionClass")
      .in("id", uniqueClassIds);

    if (classError) {
      return NextResponse.json({ error: classError.message }, { status: 500 });
    }

    const classRows = (classes ?? []) as ClassRow[];
    const foundIds = new Set(classRows.map((row) => row.id));
    const missingClass = normalizedClassIds.some((id) => !foundIds.has(id));
    if (missingClass) {
      return NextResponse.json({ error: "One or more classes are invalid" }, { status: 400 });
    }

    const hasCompetitionClass = classRows.some((row) => row.isCompetitionClass === true);
    if (hasCompetitionClass) {
      return NextResponse.json(
        { error: "Competition classes are not allowed for recreational checkout" },
        { status: 400 }
      );
    }

    const quantity = normalizedClassIds.length;
    const { data: holdRows, error: holdError } = await supabaseAdmin.rpc(
      "create_recreational_class_booking_hold",
      {
        p_account_id: bookingContext.accountId,
        p_child_id: childId,
        p_class_ids: uniqueClassIds,
        p_hold_minutes: HOLD_MINUTES,
      }
    );

    if (holdError) {
      return NextResponse.json(
        { error: holdError.message },
        { status: 409 }
      );
    }

    const hold = Array.isArray(holdRows) ? holdRows[0] : null;
    bookingGroupId =
      hold && typeof hold.booking_group_id === "string"
        ? hold.booking_group_id
        : "";

    if (!bookingGroupId) {
      return NextResponse.json({ error: "Unable to create booking hold" }, { status: 500 });
    }

    const stripe = new Stripe(stripeSecretKey, { apiVersion: "2026-01-28.clover" });
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: process.env.REC_PRICE_ID!, quantity }],
      success_url: `${process.env.APP_URL}/booking/success?type=recreational&bookingGroupId=${encodeURIComponent(bookingGroupId)}`,
      cancel_url: `${process.env.APP_URL}/booking/cancel`,
      metadata: {
        bookingType: "recreational",
        bookingGroupId,
        childId,
        accountId: bookingContext.accountId,
        classCount: String(quantity),
        classIds: uniqueClassIds.join(","),
      },
    });

    const { error: updateGroupError } = await supabaseAdmin
      .from("ClassBookingGroups")
      .update({
        stripeCheckoutSessionId: session.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", bookingGroupId);

    if (updateGroupError) {
      return NextResponse.json({ error: updateGroupError.message }, { status: 500 });
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    if (bookingGroupId) {
      await supabaseAdmin
        .from("ClassBookingGroupItems")
        .update({ status: "cancelled", updated_at: new Date().toISOString() })
        .eq("bookingGroupId", bookingGroupId)
        .eq("status", "pending");

      await supabaseAdmin
        .from("ClassBookingGroups")
        .update({ status: "failed", updated_at: new Date().toISOString() })
        .eq("id", bookingGroupId)
        .eq("status", "pending");
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Checkout failed" },
      { status: 500 }
    );
  }
}
