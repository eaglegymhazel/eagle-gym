import Stripe from "stripe";
import { NextResponse } from "next/server";
import { getBookingContext } from "@/lib/server/bookingContext";
import { supabaseAdmin } from "@/lib/admin";
import { getOrCreateStripeCheckoutCustomer } from "@/lib/server/stripeCheckoutCustomer";
import {
  SUMMER_CAMP_2026,
  buildSummerCampSelectionByWeek,
  calculateSummerCampTotal,
  getSummerCampDayIds,
  parseSummerCampSelection,
} from "@/lib/summerCamps";
import {
  getSummerCampActiveBookingCountsByDate,
  getSummerCampSessions,
} from "@/lib/server/summerCampBookings";

export const runtime = "nodejs";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

function getAppUrl(req: Request): string {
  return process.env.APP_URL?.trim() || new URL(req.url).origin;
}

function toPence(value: number): number {
  return Math.round(value * 100);
}

function computeAge(dateOfBirth: string | null): number | null {
  if (!dateOfBirth) return null;
  const birthDate = new Date(dateOfBirth);
  if (Number.isNaN(birthDate.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const birthdayPassed =
    today.getMonth() > birthDate.getMonth() ||
    (today.getMonth() === birthDate.getMonth() && today.getDate() >= birthDate.getDate());

  if (!birthdayPassed) {
    age -= 1;
  }

  return age >= 0 ? age : null;
}

export async function POST(req: Request) {
  try {
    if (!stripeSecretKey) {
      return NextResponse.json({ error: "Stripe is not configured" }, { status: 500 });
    }

    const body = await req.json();
    const childId = typeof body?.childId === "string" ? body.childId.trim() : "";
    const selectedDayIds = parseSummerCampSelection(
      Array.isArray(body?.selectedDayIds) ? body.selectedDayIds.join(",") : ""
    );

    if (!childId || selectedDayIds.length === 0) {
      return NextResponse.json({ error: "Invalid summer camp selection" }, { status: 400 });
    }

    const validDayIds = getSummerCampDayIds(SUMMER_CAMP_2026);
    if (selectedDayIds.some((dayId) => !validDayIds.has(dayId))) {
      return NextResponse.json({ error: "One or more selected days are invalid" }, { status: 400 });
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

    const age = computeAge(child.dateOfBirth ?? null);
    if (age == null || age < 4) {
      return NextResponse.json(
        { error: "Summer camp is only available for students aged 4 and over." },
        { status: 400 }
      );
    }

    const selectedByWeek = buildSummerCampSelectionByWeek(SUMMER_CAMP_2026, selectedDayIds);
    const totalAmount = calculateSummerCampTotal(selectedByWeek);
    const totalAmountPence = toPence(totalAmount);
    if (totalAmountPence <= 0) {
      return NextResponse.json({ error: "Invalid summer camp total" }, { status: 400 });
    }

    const sessions = await getSummerCampSessions(SUMMER_CAMP_2026.slug);
    const sessionByDate = new Map(sessions.map((session) => [session.campDate, session]));
    const selectedSessions = selectedDayIds.map((dayId) => sessionByDate.get(dayId) ?? null);

    if (selectedSessions.some((session) => !session)) {
      return NextResponse.json(
        { error: "One or more selected camp dates are not available." },
        { status: 400 }
      );
    }

    const activeCountsByDate = await getSummerCampActiveBookingCountsByDate(
      SUMMER_CAMP_2026.slug,
      selectedDayIds
    );

    for (const campDate of selectedDayIds) {
      const session = sessionByDate.get(campDate);
      if (!session) {
        return NextResponse.json(
          { error: "One or more selected camp dates are not available." },
          { status: 400 }
        );
      }

      const bookedCount = activeCountsByDate.get(campDate) ?? 0;
      if (bookedCount >= session.capacity) {
        return NextResponse.json(
          { error: `Summer camp on ${campDate} is now full.` },
          { status: 409 }
        );
      }
    }

    const holdExpiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    const { data: bookingGroup, error: bookingGroupError } = await supabaseAdmin
      .from("SummerCampBookingGroups")
      .insert({
        accountId: bookingContext.accountId,
        childId,
        slug: SUMMER_CAMP_2026.slug,
        status: "pending",
        totalAmountPence,
        currency: "gbp",
        holdExpiresAt,
      })
      .select("id")
      .single();

    if (bookingGroupError || !bookingGroup?.id) {
      return NextResponse.json(
        { error: bookingGroupError?.message ?? "Unable to create booking group" },
        { status: 500 }
      );
    }

    const bookingRows = selectedDayIds.map((campDate) => ({
      bookingGroupId: bookingGroup.id,
      childId,
      slug: SUMMER_CAMP_2026.slug,
      campDate,
      status: "pending",
    }));

    const { error: insertBookingsError } = await supabaseAdmin
      .from("SummerCampBookings")
      .insert(bookingRows);

    if (insertBookingsError) {
      await supabaseAdmin
        .from("SummerCampBookingGroups")
        .delete()
        .eq("id", bookingGroup.id);

      const message =
        insertBookingsError.code === "23505"
          ? "This student already has a summer camp booking for one of those dates."
          : insertBookingsError.message;

      return NextResponse.json({ error: message }, { status: 409 });
    }

    const stripe = new Stripe(stripeSecretKey, { apiVersion: "2026-01-28.clover" });
    const checkoutEmail = bookingContext.email?.trim() || "";
    if (!checkoutEmail) {
      return NextResponse.json({ error: "Account email not found." }, { status: 400 });
    }

    const { data: existingCustomerRow } = await supabaseAdmin
      .from("Bookings")
      .select('"stripeCustomerId"')
      .eq("accountId", bookingContext.accountId)
      .eq("bookingType", "recreational")
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
    const appUrl = getAppUrl(req);

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer: stripeCustomerId,
      line_items: [
        {
          price_data: {
            currency: "gbp",
            product_data: {
              name: SUMMER_CAMP_2026.title,
              description: `Summer camp booking for ${selectedDayIds.length} selected day${selectedDayIds.length === 1 ? "" : "s"}`,
            },
            unit_amount: totalAmountPence,
          },
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/summer-camps/2026/success`,
      cancel_url: `${appUrl}/summer-camps/2026/summary?childId=${encodeURIComponent(childId)}&days=${encodeURIComponent(selectedDayIds.join(","))}`,
      metadata: {
        bookingType: "summer-camp",
        bookingGroupId: bookingGroup.id,
        childId,
        slug: SUMMER_CAMP_2026.slug,
        selectedDates: selectedDayIds.join(","),
      },
    });

    const paymentIntentId =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id ?? null;

    const { error: updateGroupError } = await supabaseAdmin
      .from("SummerCampBookingGroups")
      .update({
        stripeCheckoutSessionId: session.id,
        stripePaymentIntentId: paymentIntentId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", bookingGroup.id);

    if (updateGroupError) {
      return NextResponse.json({ error: updateGroupError.message }, { status: 500 });
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Checkout failed" },
      { status: 500 }
    );
  }
}
