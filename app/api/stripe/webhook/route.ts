import Stripe from "stripe";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/admin";
import { sendBirthdayPartyConfirmationEmail } from "@/lib/server/bookingEmails";

export const runtime = "nodejs";

const stripeKey = process.env.STRIPE_SECRET_KEY || process.env.COMP_STRIPE_SECRET_KEY;
const stripe = new Stripe(stripeKey!, {
  apiVersion: "2026-01-28.clover",
});

export async function POST(req: Request) {
  if (!stripeKey) {
    console.error("[stripe-webhook] Stripe is not configured");
    return NextResponse.json({ error: "Stripe is not configured" }, { status: 500 });
  }

  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    console.error("[stripe-webhook] Missing stripe-signature header");
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
  }

  const buf = Buffer.from(await req.arrayBuffer());

  const webhookSecrets = [
    process.env.STRIPE_WEBHOOK_SECRET,
    process.env.COMP_STRIPE_WEBHOOK_SECRET,
  ].filter((value): value is string => typeof value === "string" && value.trim().length > 0);

  if (webhookSecrets.length === 0) {
    console.error("[stripe-webhook] No webhook secret configured");
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
    console.error("[stripe-webhook] Signature verification failed");
    return NextResponse.json({ error: "Signature verification failed" }, { status: 400 });
  }

  console.log("[stripe-webhook] Received event", {
    type: event.type,
    id: event.id,
  });

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const bookingType = typeof session.metadata?.bookingType === "string"
      ? session.metadata.bookingType
      : "";

    console.log("[stripe-webhook] checkout.session.completed", {
      sessionId: session.id,
      bookingType,
      metadata: session.metadata ?? {},
    });

    if (bookingType === "summer-camp") {
      const bookingGroupId =
        typeof session.metadata?.bookingGroupId === "string"
          ? session.metadata.bookingGroupId.trim()
          : "";
      const paymentIntentId =
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent?.id ?? null;

      if (bookingGroupId) {
        const paidAt = new Date().toISOString();

        const { error: updateGroupError } = await supabaseAdmin
          .from("SummerCampBookingGroups")
          .update({
            status: "paid",
            stripeCheckoutSessionId: session.id,
            stripePaymentIntentId: paymentIntentId,
            paid_at: paidAt,
            updated_at: paidAt,
          })
          .eq("id", bookingGroupId);

        if (updateGroupError) {
          console.error("[stripe-webhook] Failed to update SummerCampBookingGroups", {
            bookingGroupId,
            error: updateGroupError.message,
          });
          return NextResponse.json({ error: updateGroupError.message }, { status: 500 });
        }

        const { error: updateBookingsError } = await supabaseAdmin
          .from("SummerCampBookings")
          .update({
            status: "active",
            updated_at: paidAt,
          })
          .eq("bookingGroupId", bookingGroupId)
          .eq("status", "pending");

        if (updateBookingsError) {
          console.error("[stripe-webhook] Failed to update SummerCampBookings", {
            bookingGroupId,
            error: updateBookingsError.message,
          });
          return NextResponse.json({ error: updateBookingsError.message }, { status: 500 });
        }

        console.log("[stripe-webhook] Summer camp booking activated", {
          bookingGroupId,
          paymentIntentId,
        });
      } else {
        console.warn("[stripe-webhook] Missing summer-camp bookingGroupId in metadata", {
          sessionId: session.id,
        });
      }
    } else if (bookingType === "birthday-party") {
      const birthdayPartyBookingId =
        typeof session.metadata?.birthdayPartyBookingId === "string"
          ? session.metadata.birthdayPartyBookingId.trim()
          : "";
      const paymentIntentId =
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent?.id ?? null;

      if (!birthdayPartyBookingId) {
        console.warn("[stripe-webhook] Missing birthday-party booking id in metadata", {
          sessionId: session.id,
        });
      } else {
        const { data: existingBirthdayBooking, error: existingBirthdayBookingError } = await supabaseAdmin
          .from("BirthdayPartyBookings")
          .select('id,status,"stripeCheckoutSessionId"')
          .eq("id", birthdayPartyBookingId);

        if (existingBirthdayBookingError) {
          console.error("[stripe-webhook] Failed to update BirthdayPartyBookings", {
            birthdayPartyBookingId,
            error: existingBirthdayBookingError.message,
          });
          return NextResponse.json({ error: existingBirthdayBookingError.message }, { status: 500 });
        }

        const birthdayBookingRow = Array.isArray(existingBirthdayBooking)
          ? existingBirthdayBooking[0]
          : existingBirthdayBooking;

        if (!birthdayBookingRow) {
          console.warn("[stripe-webhook] Birthday party booking not found", {
            birthdayPartyBookingId,
          });
          return NextResponse.json({ ok: true });
        }

        const alreadyConfirmed =
          birthdayBookingRow.status === "confirmed" &&
          birthdayBookingRow.stripeCheckoutSessionId === session.id;

        if (!alreadyConfirmed) {
          const paidAt = new Date().toISOString();
          const { error: updateBirthdayBookingError } = await supabaseAdmin
            .from("BirthdayPartyBookings")
            .update({
              status: "confirmed",
              stripeCheckoutSessionId: session.id,
              stripePaymentIntentId: paymentIntentId,
              paid_at: paidAt,
              updated_at: paidAt,
            })
            .eq("id", birthdayPartyBookingId);

          if (updateBirthdayBookingError) {
            console.error("[stripe-webhook] Failed to update BirthdayPartyBookings", {
              birthdayPartyBookingId,
              error: updateBirthdayBookingError.message,
            });
            return NextResponse.json({ error: updateBirthdayBookingError.message }, { status: 500 });
          }
        }

        if (!alreadyConfirmed) {
          const { data: bookingForEmail, error: bookingForEmailError } = await supabaseAdmin
            .from("BirthdayPartyBookings")
            .select(
              'id,"accountId",slot_date,start_time,end_time,"totalAmountPence","birthdayChildFirstName","birthdayChildLastName","birthdayChildDateOfBirth"'
            )
            .eq("id", birthdayPartyBookingId)
            .maybeSingle();

          if (!bookingForEmailError && bookingForEmail) {
            const { data: accountRow, error: accountError } = await supabaseAdmin
              .from("Accounts")
              .select("accFirstName,accLastName,email")
              .eq("id", bookingForEmail.accountId)
              .maybeSingle();

            if (!accountError && accountRow?.email) {
              const accountName =
                `${accountRow.accFirstName?.trim() ?? ""} ${accountRow.accLastName?.trim() ?? ""}`.trim() ||
                "there";
              const birthdayChildName =
                `${bookingForEmail.birthdayChildFirstName?.trim() ?? ""} ${bookingForEmail.birthdayChildLastName?.trim() ?? ""}`.trim();

              const emailResult = await sendBirthdayPartyConfirmationEmail({
                toEmail: accountRow.email,
                accountName,
                birthdayChildName,
                birthdayChildDateOfBirth: bookingForEmail.birthdayChildDateOfBirth,
                slotDate: bookingForEmail.slot_date,
                startTime: bookingForEmail.start_time,
                endTime: bookingForEmail.end_time,
                totalAmountPence: bookingForEmail.totalAmountPence,
              });

              if (!emailResult.ok) {
                console.error("[stripe-webhook] Failed to send birthday confirmation email", {
                  birthdayPartyBookingId,
                  error: emailResult.error,
                });
              }
            }
          }
        }
      }
    } else {
      const subscriptionId =
        typeof session.subscription === "string"
          ? session.subscription
          : session.subscription?.id;

      console.log("[stripe-webhook] Non-summer-camp checkout completed", {
        subscriptionId,
        sessionId: session.id,
      });

      const { error: insertTestError } = await supabaseAdmin.from("StripeTestSubs").insert([
        {
          subscriptionId,
          checkoutSessionId: session.id,
        },
      ]);

      if (insertTestError) {
        console.error("[stripe-webhook] Failed to insert StripeTestSubs row", {
          error: insertTestError.message,
        });
        return NextResponse.json({ error: insertTestError.message }, { status: 500 });
      }
    }
  }

  return NextResponse.json({ ok: true });
}
