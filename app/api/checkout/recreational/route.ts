import Stripe from "stripe";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/admin";
import { getBookingContext } from "@/lib/server/bookingContext";
import { getOrCreateStripeCheckoutCustomer } from "@/lib/server/stripeCheckoutCustomer";
import {
  expireStaleClassCheckouts,
  findResumableClassCheckout,
} from "@/lib/server/resumableClassCheckout";
import {
  DISPLAY_CLASS_STRIPE_PRICE_ID,
  hasMixedDisplayClassSelection,
  isDisplayClass,
} from "@/lib/recreationalClassPricing";

export const runtime = "nodejs";

const stripeSecretKey = process.env.LIVE_REC_STRIPE_SECRET_KEY;
const HOLD_MINUTES = 31;
const PRESCHOOL_MIN_AGE = 1.5;
const PRESCHOOL_MAX_AGE = 3;

type ClassRow = {
  id: string;
  name: string | null;
  weekday: string | number | null;
  startTime: string | null;
  endTime: string | null;
  isCompetitionClass: boolean | null;
  minAge: number | string | null;
  maxAge: number | string | null;
};

function getAppUrl(req: Request): string {
  return process.env.APP_URL?.trim() || new URL(req.url).origin;
}

function toNullableNumber(value: number | string | null): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function isPreschoolClass(row: ClassRow): boolean {
  const minAge = toNullableNumber(row.minAge);
  const maxAge = toNullableNumber(row.maxAge);
  if (minAge == null || maxAge == null) return false;
  return (
    Math.abs(minAge - PRESCHOOL_MIN_AGE) < 0.001 &&
    Math.abs(maxAge - PRESCHOOL_MAX_AGE) < 0.001
  );
}

export async function POST(req: Request) {
  let bookingGroupId = "";

  try {
    if (!stripeSecretKey) {
      return NextResponse.json({ error: "Stripe is not configured" }, { status: 500 });
    }
    const standardPriceId = process.env.LIVE_REC_STRIPE_STANDARD_PRICE_ID?.trim();
    const preschoolPriceId = process.env.LIVE_REC_STRIPE_PRESCHOOL_PRICE_ID?.trim();
    if (!standardPriceId || !preschoolPriceId) {
      return NextResponse.json(
        { error: "Live recreational Stripe prices are not configured" },
        { status: 500 }
      );
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
      .select(
        "id,name:className,weekday,startTime,endTime,isCompetitionClass,minAge:ageMin,maxAge:ageMax"
      )
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

    if (hasMixedDisplayClassSelection(classRows)) {
      return NextResponse.json(
        {
          error:
            "The Display Group class cannot be booked with another recreational class. Please complete these as two separate transactions.",
        },
        { status: 400 }
      );
    }

    const preschoolClassCount = classRows.filter(isPreschoolClass).length;
    const hasPreschoolClass = preschoolClassCount > 0;
    const hasStandardClass = preschoolClassCount < classRows.length;
    if (hasPreschoolClass && hasStandardClass) {
      return NextResponse.json(
        { error: "Preschool classes cannot be booked with other recreational classes" },
        { status: 400 }
      );
    }

    const hasDisplayClass = classRows.some(isDisplayClass);
    const priceId = hasDisplayClass
      ? DISPLAY_CLASS_STRIPE_PRICE_ID
      : hasPreschoolClass
        ? preschoolPriceId
        : standardPriceId;
    const pricingTier = hasDisplayClass
      ? "display"
      : hasPreschoolClass
        ? "preschool"
        : "standard";
    const quantity = uniqueClassIds.length;
    const stripe = new Stripe(stripeSecretKey, { apiVersion: "2026-01-28.clover" });
    const staleCheckoutStatus = await expireStaleClassCheckouts({
      stripe,
      accountId: bookingContext.accountId,
      childId,
      bookingType: "recreational",
    });
    if (staleCheckoutStatus === "processing") {
      return NextResponse.json(
        { error: "Your payment is being processed. Please wait a moment and check your bookings." },
        { status: 409 }
      );
    }
    const resumableCheckout = await findResumableClassCheckout({
      stripe,
      accountId: bookingContext.accountId,
      childId,
      bookingType: "recreational",
      selections: uniqueClassIds.map((classId) => ({
        classId,
        bookedDurationMinutes: null,
      })),
    });
    if (resumableCheckout.status === "open") {
      return NextResponse.json({ url: resumableCheckout.url, resumed: true });
    }
    if (resumableCheckout.status === "processing") {
      return NextResponse.json(
        { error: "Your payment is being processed. Please wait a moment and check your bookings." },
        { status: 409 }
      );
    }

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
    const holdExpiresAt =
      hold && typeof hold.hold_expires_at === "string"
        ? Date.parse(hold.hold_expires_at)
        : Number.NaN;
    if (!Number.isFinite(holdExpiresAt)) {
      throw new Error("Booking hold expiry was not returned");
    }

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
      mode: "subscription",
      customer: stripeCustomerId,
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity }],
      expires_at: Math.floor(holdExpiresAt / 1000),
      success_url: `${appUrl}/booking/success?type=recreational&bookingGroupId=${encodeURIComponent(bookingGroupId)}`,
      cancel_url: `${appUrl}/book/recreational/review?childId=${encodeURIComponent(childId)}&classIds=${encodeURIComponent(uniqueClassIds.join(","))}`,
      metadata: {
        bookingType: "recreational",
        bookingGroupId,
        childId,
        accountId: bookingContext.accountId,
        classCount: String(quantity),
        classIds: uniqueClassIds.join(","),
        pricingTier,
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
