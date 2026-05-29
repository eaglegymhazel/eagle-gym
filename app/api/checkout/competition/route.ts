import Stripe from "stripe";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/admin";
import { getBookingContext } from "@/lib/server/bookingContext";
import { getCompetitionBookingDraftById } from "@/lib/server/competitionBookingDrafts";
import { getOrCreateStripeCheckoutCustomer } from "@/lib/server/stripeCheckoutCustomer";
import {
  type CompetitionBookingSelection,
} from "@/lib/competitionBookingSelection";

export const runtime = "nodejs";

const stripeSecretKey = process.env.COMP_STRIPE_SECRET_KEY;
const HOLD_MINUTES = 15;

export async function POST(req: Request) {
  let bookingGroupId = "";

  try {
    if (!stripeSecretKey) {
      return NextResponse.json(
        { error: "Competition Stripe secret key is not configured" },
        { status: 500 }
      );
    }

    const body = await req.json();
    const draftId =
      typeof body?.draftId === "string" ? body.draftId.trim() : "";
    const rawSelections = Array.isArray(body?.selections)
      ? (body.selections as CompetitionBookingSelection[])
      : [];

    const bookingContext = await getBookingContext();
    if (bookingContext.status === "unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (bookingContext.status !== "existing") {
      return NextResponse.json({ error: "Account details not found" }, { status: 400 });
    }

    let selections: CompetitionBookingSelection[] = rawSelections;
    let draftRecord:
      | Awaited<ReturnType<typeof getCompetitionBookingDraftById>>
      | null = null;

    if (draftId) {
      draftRecord = await getCompetitionBookingDraftById({
        draftId,
        accountId: bookingContext.accountId,
      });

      if (!draftRecord) {
        return NextResponse.json({ error: "Draft not found" }, { status: 404 });
      }

      selections = draftRecord.selections;
    }

    if (!Array.isArray(selections) || selections.length < 1) {
      return NextResponse.json({ error: "Invalid selections" }, { status: 400 });
    }

    if (
      draftRecord &&
      !bookingContext.children.some((child) => child.id === draftRecord?.childId)
    ) {
      return NextResponse.json({ error: "Child not found" }, { status: 404 });
    }

    if (!draftRecord?.childId) {
      return NextResponse.json(
        { error: "Competition checkout requires a saved booking draft" },
        { status: 400 }
      );
    }

    const normalizedClassIds = selections
      .map((selection) => (typeof selection.classId === "string" ? selection.classId.trim() : ""))
      .filter((id) => id.length > 0);

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

    const classById = new Map((classes ?? []).map((row) => [row.id, row]));
    let invalidSelectionCount = 0;
    const totalMinutes = selections.reduce((sum, selection) => {
      const row = classById.get(selection.classId);
      if (!row) {
        invalidSelectionCount += 1;
        return sum;
      }
      const classDuration =
        typeof row.durationMinutes === "number" && row.durationMinutes > 0
          ? row.durationMinutes
          : null;
      const bookedDuration =
        typeof selection.bookedDurationMinutes === "number" &&
        selection.bookedDurationMinutes > 0
          ? selection.bookedDurationMinutes
          : null;

      if (classDuration == null || bookedDuration == null) {
        invalidSelectionCount += 1;
        return sum;
      }
      const allowedDurations =
        classDuration === 180 ? [120, 180] : [classDuration];
      if (!allowedDurations.includes(bookedDuration)) {
        invalidSelectionCount += 1;
        return sum;
      }
      return sum + bookedDuration;
    }, 0);

    if (invalidSelectionCount > 0 || totalMinutes <= 0) {
      return NextResponse.json(
        { error: "One or more competition selections are invalid" },
        { status: 400 }
      );
    }

    const totalHours = Number((totalMinutes / 60).toFixed(2));
    const priceId = process.env.COMP_PRICE_ID?.trim() || null;

    if (!priceId) {
      return NextResponse.json(
        { error: "No competition Stripe price is configured for checkout" },
        { status: 500 }
      );
    }

    const { data: holdRows, error: holdError } = await supabaseAdmin.rpc(
      "create_competition_class_booking_hold",
      {
        p_account_id: bookingContext.accountId,
        p_child_id: draftRecord.childId,
        p_selections: selections,
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

    const checkoutEmail = bookingContext.email?.trim() || "";
    if (!checkoutEmail) {
      return NextResponse.json({ error: "Account email not found." }, { status: 400 });
    }

    const stripe = new Stripe(stripeSecretKey, { apiVersion: "2026-01-28.clover" });
    const { data: existingCustomerRow } = await supabaseAdmin
      .from("Bookings")
      .select('"stripeCustomerId"')
      .eq("accountId", bookingContext.accountId)
      .eq("bookingType", "competition")
      .not("stripeCustomerId", "is", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const stripeCustomerId = await getOrCreateStripeCheckoutCustomer({
      stripe,
      email: checkoutEmail,
      accountId: bookingContext.accountId,
      existingCustomerId:
        existingCustomerRow &&
        typeof existingCustomerRow.stripeCustomerId === "string"
          ? existingCustomerRow.stripeCustomerId
          : null,
    });

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: stripeCustomerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.APP_URL}/booking/success?type=competition&bookingGroupId=${encodeURIComponent(bookingGroupId)}`,
      cancel_url: `${process.env.APP_URL}/booking/cancel`,
      metadata: {
        bookingType: "competition",
        bookingGroupId,
        childId: draftRecord.childId,
        accountId: bookingContext.accountId,
        classCount: String(selections.length),
        totalHours: String(totalHours),
        draftId: draftId || "",
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
