import Stripe from "stripe";
import { NextResponse } from "next/server";
import { getBookingContext } from "@/lib/server/bookingContext";
import { supabaseAdmin } from "@/lib/admin";
import {
  parseBirthdayPartySize,
  isBirthdayChildOldEnough,
} from "@/lib/birthdayPartyBookingValidation";
import {
  parseBirthdayPartySlotId,
  calculateBirthdayPartyPrice,
  getBirthdayPartyAccountSummary,
  getBirthdayPartyHoldExpiresAt,
  getBirthdayPartySlot,
  hasBirthdayPartyBookingLeadTime,
} from "@/lib/server/birthdayPartyBookings";
import { getOrCreateStripeCheckoutCustomer } from "@/lib/server/stripeCheckoutCustomer";

export const runtime = "nodejs";

const stripeSecretKey = process.env.LIVE_REC_STRIPE_SECRET_KEY;
const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, { apiVersion: "2026-01-28.clover" })
  : null;

type CheckoutBody = {
  slotId?: unknown;
  partySize?: unknown;
  birthdayChildFirstName?: unknown;
  birthdayChildLastName?: unknown;
  birthdayChildDateOfBirth?: unknown;
  healthNotes?: unknown;
  specialRequirements?: unknown;
  additionalNotes?: unknown;
};

type ExistingBirthdayBookingRow = {
  id: string;
  accountId: string;
  slot_date: string;
  start_time: string;
  end_time: string;
  status: string;
  holdExpiresAt: string | null;
};

function normalizeText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function getAppUrl(req: Request): string {
  return process.env.APP_URL?.trim() || new URL(req.url).origin;
}

function isPendingHoldActive(booking: ExistingBirthdayBookingRow, nowIso: string): boolean {
  return booking.status === "pending" && !!booking.holdExpiresAt && booking.holdExpiresAt > nowIso;
}

function isBlockingBooking(booking: ExistingBirthdayBookingRow, nowIso: string): boolean {
  if (booking.status === "confirmed" || booking.status === "paid") return true;
  return isPendingHoldActive(booking, nowIso);
}

export async function POST(req: Request) {
  let bookingId = "";

  try {
    if (!stripe || !stripeSecretKey) {
      return NextResponse.json({ error: "Stripe is not configured" }, { status: 500 });
    }

    const bookingContext = await getBookingContext();
    if (bookingContext.status === "unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (bookingContext.status !== "existing") {
      return NextResponse.json({ error: "Account details not found" }, { status: 400 });
    }

    const body = (await req.json()) as CheckoutBody;
    const slotId = normalizeText(body.slotId);
    const partySize = parseBirthdayPartySize(body.partySize);
    const parsedSlot = parseBirthdayPartySlotId(slotId);
    const birthdayChildFirstName = normalizeText(body.birthdayChildFirstName);
    const birthdayChildLastName = normalizeText(body.birthdayChildLastName);
    const birthdayChildDateOfBirth = normalizeText(body.birthdayChildDateOfBirth);
    const healthNotes = normalizeText(body.healthNotes);
    const specialRequirements = normalizeText(body.specialRequirements);
    const additionalNotes = normalizeText(body.additionalNotes);

    if (!slotId || !parsedSlot || partySize === null) {
      return NextResponse.json({ error: "Invalid birthday party details" }, { status: 400 });
    }

    if (!hasBirthdayPartyBookingLeadTime(parsedSlot.slotDate)) {
      return NextResponse.json(
        { error: "Birthday parties must be booked at least 6 days in advance." },
        { status: 409 }
      );
    }

    if (!birthdayChildFirstName || !birthdayChildLastName || !birthdayChildDateOfBirth) {
      return NextResponse.json(
        { error: "Please provide the birthday child's full name and date of birth" },
        { status: 400 }
      );
    }

    if (Number.isNaN(Date.parse(`${birthdayChildDateOfBirth}T12:00:00Z`))) {
      return NextResponse.json({ error: "Invalid date of birth" }, { status: 400 });
    }

    if (!isBirthdayChildOldEnough(birthdayChildDateOfBirth)) {
      return NextResponse.json(
        {
          error: "The birthday child must be at least 4 years old on the booking date.",
        },
        { status: 400 }
      );
    }

    const [slot, accountSummary] = await Promise.all([
      getBirthdayPartySlot(parsedSlot.slotDate, parsedSlot.startTime, parsedSlot.endTime),
      getBirthdayPartyAccountSummary(bookingContext.accountId),
    ]);

    if (!slot || slot.isBlocked) {
      return NextResponse.json({ error: "This birthday party slot is no longer available" }, { status: 409 });
    }

    const { data: existingRows, error: existingError } = await supabaseAdmin
      .from("BirthdayPartyBookings")
      .select('id,"accountId",slot_date,start_time,end_time,status,"holdExpiresAt"')
      .eq("slot_date", parsedSlot.slotDate)
      .eq("start_time", parsedSlot.startTime)
      .eq("end_time", parsedSlot.endTime)
      .in("status", ["pending", "paid", "confirmed"]);

    if (existingError) {
      return NextResponse.json({ error: existingError.message }, { status: 500 });
    }

    const existingBookings = (existingRows ?? []) as ExistingBirthdayBookingRow[];
    const nowIso = new Date().toISOString();
    const blockingBooking = existingBookings.find((booking) => {
      if (booking.accountId === bookingContext.accountId && isPendingHoldActive(booking, nowIso)) {
        return false;
      }

      return isBlockingBooking(booking, nowIso);
    });

    if (blockingBooking) {
      return NextResponse.json(
        { error: "This birthday party slot has just been taken. Please choose another date." },
        { status: 409 }
      );
    }

    const price = calculateBirthdayPartyPrice(partySize);
    const holdExpiresAt = getBirthdayPartyHoldExpiresAt();
    const activeOwnPending = existingBookings.find(
      (booking) => booking.accountId === bookingContext.accountId && isPendingHoldActive(booking, nowIso)
    );

    bookingId = activeOwnPending?.id ?? "";

    if (activeOwnPending) {
      const { error: updateError } = await supabaseAdmin
        .from("BirthdayPartyBookings")
        .update({
          status: "pending",
          partySize: price.partySize,
          basePricePence: price.basePricePence,
          extraChildrenCount: price.extraChildrenCount,
          extraChildrenPricePence: price.extraChildrenPricePence,
          totalAmountPence: price.totalAmountPence,
          birthdayChildFirstName,
          birthdayChildLastName,
          birthdayChildDateOfBirth,
          healthNotes: healthNotes || null,
          specialRequirements: specialRequirements || null,
          additionalNotes: additionalNotes || null,
          holdExpiresAt,
          updated_at: nowIso,
        })
        .eq("id", activeOwnPending.id);

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }
    } else {
      const { data: insertedBooking, error: insertError } = await supabaseAdmin
        .from("BirthdayPartyBookings")
        .insert({
          accountId: bookingContext.accountId,
          slot_date: parsedSlot.slotDate,
          start_time: parsedSlot.startTime,
          end_time: parsedSlot.endTime,
          status: "pending",
          partySize: price.partySize,
          basePricePence: price.basePricePence,
          extraChildrenCount: price.extraChildrenCount,
          extraChildrenPricePence: price.extraChildrenPricePence,
          totalAmountPence: price.totalAmountPence,
          currency: "gbp",
          birthdayChildFirstName,
          birthdayChildLastName,
          birthdayChildDateOfBirth,
          healthNotes: healthNotes || null,
          specialRequirements: specialRequirements || null,
          additionalNotes: additionalNotes || null,
          holdExpiresAt,
        })
        .select("id")
        .single();

      if (insertError || !insertedBooking) {
        return NextResponse.json({ error: insertError?.message ?? "Unable to create booking hold" }, { status: 500 });
      }

      bookingId = insertedBooking.id;
    }

    const appUrl = getAppUrl(req);
    const checkoutEmail = bookingContext.email?.trim() || accountSummary?.email?.trim() || "";
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
      fullName: accountSummary?.fullName ?? null,
      existingCustomerId:
        existingCustomerRow &&
        typeof existingCustomerRow.stripeCustomerId === "string"
          ? existingCustomerRow.stripeCustomerId
          : null,
    });

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      expires_at: Math.floor(Date.parse(holdExpiresAt) / 1000),
      success_url: `${appUrl}/birthday-party/book/success?bookingId=${encodeURIComponent(bookingId)}`,
      cancel_url: `${appUrl}/birthday-party/book/review?slotId=${encodeURIComponent(slotId)}&partySize=${encodeURIComponent(String(price.partySize))}`,
      customer: stripeCustomerId,
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "gbp",
            product_data: {
              name: "Birthday Party Booking",
              description: `${slot.slotDate} ${slot.startTime}-${slot.endTime}`,
            },
            unit_amount: price.totalAmountPence,
          },
          quantity: 1,
        },
      ],
      metadata: {
        bookingType: "birthday-party",
        birthdayPartyBookingId: bookingId,
        slotId,
        slotDate: parsedSlot.slotDate,
        startTime: parsedSlot.startTime,
        endTime: parsedSlot.endTime,
      },
    });

    const { error: checkoutUpdateError } = await supabaseAdmin
      .from("BirthdayPartyBookings")
      .update({
        stripeCheckoutSessionId: session.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", bookingId);

    if (checkoutUpdateError) {
      await supabaseAdmin
        .from("BirthdayPartyBookings")
        .update({
          status: "failed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", bookingId);

      return NextResponse.json({ error: checkoutUpdateError.message }, { status: 500 });
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    if (bookingId) {
      await supabaseAdmin
        .from("BirthdayPartyBookings")
        .update({
          status: "failed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", bookingId)
        .eq("status", "pending");
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Checkout failed" },
      { status: 500 }
    );
  }
}
