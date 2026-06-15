import Stripe from "stripe";
import {
  DISPLAY_CLASS_MONTHLY_PRICE,
  isDisplayClass,
} from "@/lib/recreationalClassPricing";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/admin";
import {
  sendBirthdayPartyConfirmationEmail,
  sendCompetitionClassBookingConfirmationEmail,
  sendRecreationalClassBookingConfirmationEmail,
  sendSummerCampBookingConfirmationEmail,
  type RecreationalClassEmailItem,
  type SummerCampEmailItem,
} from "@/lib/server/bookingEmails";

export const runtime = "nodejs";

const stripeKey =
  process.env.LIVE_REC_STRIPE_SECRET_KEY ||
  process.env.LIVE_COMP_STRIPE_SECRET_KEY ||
  process.env.TEST_REC_STRIPE_SECRET_KEY ||
  process.env.TEST_COMP_STRIPE_SECRET_KEY;
const stripe = new Stripe(stripeKey!, {
  apiVersion: "2026-01-28.clover",
});

type ClassBookingGroupRow = {
  id: string;
  accountId: string;
  childId: string;
  bookingType: string;
  status: string;
};

type ClassBookingGroupItemRow = {
  id: string;
  bookingGroupId: string;
  classId: string;
  childId: string;
  bookingType: string;
  bookedDurationMinutes: number | null;
  status: string;
};

type AccountEmailRow = {
  accFirstName: string | null;
  accLastName: string | null;
  email: string | null;
};

type ChildEmailRow = {
  firstName: string | null;
  lastName: string | null;
};

type RecreationalClassEmailRow = {
  id: string;
  name: string | null;
  weekday: string | number | null;
  startTime: string | null;
  endTime: string | null;
  durationMinutes: number | null;
  price: number | string | null;
};

type SummerCampBookingGroupRow = {
  id: string;
  accountId: string;
  childId: string;
  slug: string;
  status: string;
  totalAmountPence: number | null;
  stripeCheckoutSessionId: string | null;
};

type SummerCampBookingRow = {
  id: string;
  childId: string;
  campDate: string;
  status: string;
};

type SummerCampSessionEmailRow = {
  campDate: string;
  title: string | null;
  startTime: string | null;
  endTime: string | null;
};

const WEEKDAY_ORDER = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

function isDuplicateClassBookingError(
  error: { code?: string; message?: string },
  bookingType: "recreational" | "competition"
): boolean {
  const constraint =
    bookingType === "competition"
      ? "uniq_active_comp_booking"
      : "uniq_active_rec_booking";
  return error.code === "23505" && (error.message ?? "").includes(constraint);
}

function normalizeWeekday(input: string | number | null): string {
  if (input == null) return "Day TBC";
  if (typeof input === "number") {
    if (input >= 1 && input <= 7) return WEEKDAY_ORDER[input - 1];
    if (input >= 0 && input <= 6) {
      const sundayFirst = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ] as const;
      return sundayFirst[input];
    }
    return "Day TBC";
  }

  const trimmed = input.trim();
  if (!trimmed) return "Day TBC";
  if (/^\d+$/.test(trimmed)) return normalizeWeekday(Number.parseInt(trimmed, 10));

  const lookup: Record<string, string> = {
    mon: "Monday",
    monday: "Monday",
    tue: "Tuesday",
    tues: "Tuesday",
    tuesday: "Tuesday",
    wed: "Wednesday",
    wednesday: "Wednesday",
    thu: "Thursday",
    thur: "Thursday",
    thurs: "Thursday",
    thursday: "Thursday",
    fri: "Friday",
    friday: "Friday",
    sat: "Saturday",
    saturday: "Saturday",
    sun: "Sunday",
    sunday: "Sunday",
  };

  return lookup[trimmed.toLowerCase()] ?? trimmed;
}

function toNullableNumber(value: number | string | null): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

async function sendClassBookingConfirmationEmail({
  group,
  items,
  bookingType,
}: {
  group: ClassBookingGroupRow;
  items: ClassBookingGroupItemRow[];
  bookingType: "recreational" | "competition";
}) {
  const classIds = items.map((item) => item.classId);
  const [{ data: accountData, error: accountError }, { data: childData, error: childError }, { data: classData, error: classError }] =
    await Promise.all([
      supabaseAdmin
        .from("Accounts")
        .select("accFirstName,accLastName,email")
        .eq("id", group.accountId)
        .maybeSingle(),
      supabaseAdmin
        .from("Children")
        .select("firstName,lastName")
        .eq("id", group.childId)
        .maybeSingle(),
      classIds.length > 0
        ? supabaseAdmin
            .from("Classes")
            .select("id,name:className,weekday,startTime,endTime,durationMinutes,price")
            .in("id", classIds)
        : Promise.resolve({ data: [], error: null }),
    ]);

  if (accountError || childError || classError) {
    console.error("[stripe-webhook] Failed to load class booking confirmation email data", {
      bookingGroupId: group.id,
      bookingType,
      accountError: accountError?.message,
      childError: childError?.message,
      classError: classError?.message,
    });
    return;
  }

  const account = accountData as AccountEmailRow | null;
  if (!account?.email) {
    console.warn("[stripe-webhook] Class booking confirmation email skipped; account has no email", {
      bookingGroupId: group.id,
      bookingType,
      accountId: group.accountId,
    });
    return;
  }

  const child = childData as ChildEmailRow | null;
  const classesById = new Map(
    ((classData ?? []) as RecreationalClassEmailRow[]).map((item) => [item.id, item])
  );
  const emailClasses: RecreationalClassEmailItem[] = items.map((item) => {
    const classRow = classesById.get(item.classId);
    return {
      name: classRow?.name?.trim() || "Recreational class",
      weekday: normalizeWeekday(classRow?.weekday ?? null),
      startTime: classRow?.startTime ?? null,
      endTime: classRow?.endTime ?? null,
      durationMinutes: item.bookedDurationMinutes ?? classRow?.durationMinutes ?? null,
      monthlyPrice:
        bookingType !== "recreational"
          ? null
          : classRow && isDisplayClass(classRow)
            ? DISPLAY_CLASS_MONTHLY_PRICE
            : toNullableNumber(classRow?.price ?? null),
    };
  });
  let monthlyTotal: number | null = null;
  if (bookingType === "recreational") {
    const monthlyPrices = emailClasses.map((item) => item.monthlyPrice);
    monthlyTotal = monthlyPrices.every((price) => price != null)
      ? monthlyPrices.reduce((sum, price) => sum + (price ?? 0), 0)
      : null;
  }
  const accountName =
    `${account.accFirstName?.trim() ?? ""} ${account.accLastName?.trim() ?? ""}`.trim() ||
    "there";
  const childName =
    `${child?.firstName?.trim() ?? ""} ${child?.lastName?.trim() ?? ""}`.trim() ||
    "Selected child";

  const emailInput = {
    toEmail: account.email,
    accountName,
    childName,
    classes: emailClasses,
    monthlyTotal,
  };
  const result =
    bookingType === "competition"
      ? await sendCompetitionClassBookingConfirmationEmail(emailInput)
      : await sendRecreationalClassBookingConfirmationEmail(emailInput);

  if (!result.ok) {
    console.error("[stripe-webhook] Failed to send class booking confirmation email", {
      bookingGroupId: group.id,
      bookingType,
      error: result.error,
    });
  }
}

async function sendSummerCampConfirmationEmail(group: SummerCampBookingGroupRow) {
  const [{ data: accountData, error: accountError }, { data: childData, error: childError }, { data: bookingData, error: bookingError }, { data: sessionData, error: sessionError }] =
    await Promise.all([
      supabaseAdmin
        .from("Accounts")
        .select("accFirstName,accLastName,email")
        .eq("id", group.accountId)
        .maybeSingle(),
      supabaseAdmin
        .from("Children")
        .select("firstName,lastName")
        .eq("id", group.childId)
        .maybeSingle(),
      supabaseAdmin
        .from("SummerCampBookings")
        .select('id,"childId","campDate",status')
        .eq("bookingGroupId", group.id)
        .in("status", ["pending", "active"]),
      supabaseAdmin
        .from("SummerCampSessions")
        .select('campDate:"campDate",title,startTime:"startTime",endTime:"endTime"')
        .eq("slug", group.slug),
    ]);

  if (accountError || childError || bookingError || sessionError) {
    console.error("[stripe-webhook] Failed to load summer camp confirmation email data", {
      bookingGroupId: group.id,
      accountError: accountError?.message,
      childError: childError?.message,
      bookingError: bookingError?.message,
      sessionError: sessionError?.message,
    });
    return;
  }

  const account = accountData as AccountEmailRow | null;
  if (!account?.email) {
    console.warn("[stripe-webhook] Summer camp confirmation email skipped; account has no email", {
      bookingGroupId: group.id,
      accountId: group.accountId,
    });
    return;
  }

  const child = childData as ChildEmailRow | null;
  const bookings = (bookingData ?? []) as SummerCampBookingRow[];
  const sessionByDate = new Map(
    ((sessionData ?? []) as SummerCampSessionEmailRow[]).map((item) => [item.campDate, item])
  );
  const dates: SummerCampEmailItem[] = bookings
    .slice()
    .sort((a, b) => a.campDate.localeCompare(b.campDate))
    .map((item) => {
      const session = sessionByDate.get(item.campDate);
      return {
        label: formatDateLabel(item.campDate),
        startTime: session?.startTime ?? null,
        endTime: session?.endTime ?? null,
      };
    });

  const accountName =
    `${account.accFirstName?.trim() ?? ""} ${account.accLastName?.trim() ?? ""}`.trim() ||
    "there";
  const childName =
    `${child?.firstName?.trim() ?? ""} ${child?.lastName?.trim() ?? ""}`.trim() ||
    "Selected child";
  const campTitle =
    ((sessionData ?? []) as SummerCampSessionEmailRow[])[0]?.title?.trim() || "Summer Camp 2026";

  const result = await sendSummerCampBookingConfirmationEmail({
    toEmail: account.email,
    accountName,
    childName,
    campTitle,
    dates,
    totalAmountPence: group.totalAmountPence,
  });

  if (!result.ok) {
    console.error("[stripe-webhook] Failed to send summer camp confirmation email", {
      bookingGroupId: group.id,
      error: result.error,
    });
  }
}

function formatDateLabel(value: string): string {
  const date = new Date(`${value}T12:00:00Z`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

async function finalizeClassBooking(
  session: Stripe.Checkout.Session,
  bookingType: "recreational" | "competition"
) {
  const bookingGroupId =
    typeof session.metadata?.bookingGroupId === "string"
      ? session.metadata.bookingGroupId.trim()
      : "";
  const subscriptionId =
    typeof session.subscription === "string"
      ? session.subscription
      : session.subscription?.id ?? null;
  const customerId =
    typeof session.customer === "string"
      ? session.customer
      : session.customer?.id ?? null;

  if (!bookingGroupId) {
    console.warn("[stripe-webhook] Missing class bookingGroupId in metadata", {
      sessionId: session.id,
      bookingType,
    });
    return;
  }

  const { data: groupData, error: groupError } = await supabaseAdmin
    .from("ClassBookingGroups")
    .select('id,"accountId","childId","bookingType",status')
    .eq("id", bookingGroupId)
    .maybeSingle();

  if (groupError) {
    throw new Error(groupError.message);
  }

  const group = groupData as ClassBookingGroupRow | null;
  if (!group) {
    console.warn("[stripe-webhook] Class booking group not found", {
      bookingGroupId,
      sessionId: session.id,
      bookingType,
    });
    return;
  }

  if (group.bookingType !== bookingType) {
    console.warn("[stripe-webhook] Booking group type mismatch", {
      bookingGroupId,
      bookingType: group.bookingType,
      expectedBookingType: bookingType,
      sessionId: session.id,
    });
    return;
  }

  if (group.status === "paid") {
    return;
  }

  const { data: itemData, error: itemError } = await supabaseAdmin
    .from("ClassBookingGroupItems")
    .select('id,"bookingGroupId","classId","childId","bookingType","bookedDurationMinutes",status')
    .eq("bookingGroupId", bookingGroupId)
    .eq("status", "pending");

  if (itemError) {
    throw new Error(itemError.message);
  }

  const items = (itemData ?? []) as ClassBookingGroupItemRow[];
  if (items.length === 0) {
    console.warn("[stripe-webhook] No pending class booking items found", {
      bookingGroupId,
      sessionId: session.id,
      bookingType,
    });
    return;
  }

  const classIds = items.map((item) => item.classId);
  const { data: existingRows, error: existingError } = await supabaseAdmin
    .from("Bookings")
    .select("classId")
    .eq("childId", group.childId)
    .eq("bookingType", bookingType)
    .eq("status", "active")
    .in("classId", classIds);

  if (existingError) {
    throw new Error(existingError.message);
  }

  const existingClassIds = new Set(
    (existingRows ?? [])
      .map((row) => row.classId)
      .filter((classId): classId is string => typeof classId === "string")
  );
  const paidAt = new Date().toISOString();
  const startDate = paidAt.slice(0, 10);
  const rowsToInsert = items
    .filter((item) => !existingClassIds.has(item.classId))
    .map((item) => ({
      childId: group.childId,
      classId: item.classId,
      accountId: group.accountId,
      startDate,
      status: "active",
      autoRenew: true,
      stripeSubscriptionId: subscriptionId,
      stripeCustomerId: customerId,
      billingGroupId: bookingGroupId,
      bookingType,
      autoRenewConsent: true,
      updatedAt: paidAt,
      bookedDurationMinutes: item.bookedDurationMinutes,
    }));
  let shouldSendConfirmationEmail = rowsToInsert.length > 0;

  if (rowsToInsert.length > 0) {
    const { error: insertError } = await supabaseAdmin
      .from("Bookings")
      .insert(rowsToInsert);

    if (insertError) {
      if (isDuplicateClassBookingError(insertError, bookingType)) {
        console.warn("[stripe-webhook] Class booking already exists; treating duplicate event as finalized", {
          bookingGroupId,
          bookingType,
          sessionId: session.id,
        });
        shouldSendConfirmationEmail = false;
      } else {
        throw new Error(insertError.message);
      }
    }
  }

  const { error: itemUpdateError } = await supabaseAdmin
    .from("ClassBookingGroupItems")
    .update({ status: "finalized", updated_at: paidAt })
    .eq("bookingGroupId", bookingGroupId)
    .eq("status", "pending");

  if (itemUpdateError) {
    throw new Error(itemUpdateError.message);
  }

  const { error: groupUpdateError } = await supabaseAdmin
    .from("ClassBookingGroups")
    .update({
      status: "paid",
      stripeCheckoutSessionId: session.id,
      stripeSubscriptionId: subscriptionId,
      stripeCustomerId: customerId,
      paidAt,
      updated_at: paidAt,
    })
    .eq("id", bookingGroupId);

  if (groupUpdateError) {
    throw new Error(groupUpdateError.message);
  }

  if (shouldSendConfirmationEmail) {
    await sendClassBookingConfirmationEmail({ group, items, bookingType });
  }

  console.log("[stripe-webhook] Class booking finalized", {
    bookingGroupId,
    bookingType,
    insertedBookings: rowsToInsert.length,
    subscriptionId,
  });
}

async function cancelBookingsForSubscription(subscription: Stripe.Subscription) {
  const subscriptionId = subscription.id?.trim();
  if (!subscriptionId) {
    console.warn("[stripe-webhook] Subscription cancellation event has no subscription id");
    return;
  }

  const cancelledAt = new Date().toISOString();
  const { data: cancelledBookings, error: cancellationError } = await supabaseAdmin
    .from("Bookings")
    .update({
      status: "cancelled",
      cancelledAt,
      cancelReason: "stripe subscription cancelled",
      autoRenew: false,
      updatedAt: cancelledAt,
    })
    .eq("stripeSubscriptionId", subscriptionId)
    .eq("status", "active")
    .select("id");

  if (cancellationError) {
    throw new Error(cancellationError.message);
  }

  console.log("[stripe-webhook] Subscription bookings cancelled", {
    subscriptionId,
    cancelledBookings: cancelledBookings?.length ?? 0,
  });
}

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
    process.env.TEST_REC_STRIPE_WEBHOOK_SECRET,
    process.env.TEST_COMP_STRIPE_WEBHOOK_SECRET,
    process.env.LIVE_REC_STRIPE_WEBHOOK_SECRET,
    process.env.LIVE_COMP_STRIPE_WEBHOOK_SECRET,
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

  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object as Stripe.Subscription;

    try {
      await cancelBookingsForSubscription(subscription);
    } catch (error) {
      console.error("[stripe-webhook] Failed to cancel subscription bookings", {
        subscriptionId: subscription.id,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return NextResponse.json(
        {
          error:
            error instanceof Error
              ? error.message
              : "Unable to cancel subscription bookings",
        },
        { status: 500 }
      );
    }
  } else if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const bookingType = typeof session.metadata?.bookingType === "string"
      ? session.metadata.bookingType
      : "";

    console.log("[stripe-webhook] checkout.session.completed", {
      sessionId: session.id,
      bookingType,
      metadata: session.metadata ?? {},
    });

    if (bookingType === "recreational" || bookingType === "competition") {
      try {
        await finalizeClassBooking(session, bookingType);
      } catch (error) {
        console.error("[stripe-webhook] Failed to finalize class booking", {
          sessionId: session.id,
          bookingType,
          error: error instanceof Error ? error.message : "Unknown error",
        });
        return NextResponse.json(
          { error: error instanceof Error ? error.message : "Unable to finalize class booking" },
          { status: 500 }
        );
      }
    } else if (bookingType === "summer-camp") {
      const bookingGroupId =
        typeof session.metadata?.bookingGroupId === "string"
          ? session.metadata.bookingGroupId.trim()
          : "";
      const paymentIntentId =
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent?.id ?? null;

      if (bookingGroupId) {
        const { data: groupData, error: groupError } = await supabaseAdmin
          .from("SummerCampBookingGroups")
          .select('id,"accountId","childId",slug,status,"totalAmountPence","stripeCheckoutSessionId"')
          .eq("id", bookingGroupId)
          .maybeSingle();

        if (groupError) {
          console.error("[stripe-webhook] Failed to load SummerCampBookingGroups", {
            bookingGroupId,
            error: groupError.message,
          });
          return NextResponse.json({ error: groupError.message }, { status: 500 });
        }

        const group = groupData as SummerCampBookingGroupRow | null;
        if (!group) {
          console.warn("[stripe-webhook] Summer camp booking group not found", {
            bookingGroupId,
            sessionId: session.id,
          });
          return NextResponse.json({ ok: true });
        }

        const alreadyPaid =
          group.status === "paid" &&
          group.stripeCheckoutSessionId === session.id;

        if (alreadyPaid) {
          return NextResponse.json({ ok: true });
        }

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

        await sendSummerCampConfirmationEmail({
          ...group,
          status: "paid",
          stripeCheckoutSessionId: session.id,
        });

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
      console.warn("[stripe-webhook] Unsupported checkout.session.completed bookingType", {
        sessionId: session.id,
        bookingType,
      });
    }
  }

  return NextResponse.json({ ok: true });
}
