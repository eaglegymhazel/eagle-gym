import Stripe from "stripe";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/admin";
import { getBookingContext } from "@/lib/server/bookingContext";
import { getCompetitionBookingDraftById } from "@/lib/server/competitionBookingDrafts";
import {
  type CompetitionBookingSelection,
} from "@/lib/competitionBookingSelection";

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

    const stripe = new Stripe(stripeSecretKey, { apiVersion: "2026-01-28.clover" });
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.APP_URL}/booking/success`,
      cancel_url: `${process.env.APP_URL}/booking/cancel`,
      metadata: {
        bookingType: "competition",
        classCount: String(selections.length),
        totalHours: String(totalHours),
        draftId: draftId || "",
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
