import { NextResponse } from "next/server";
import { getBookingContext } from "@/lib/server/bookingContext";
import { type CompetitionBookingSelection } from "@/lib/competitionBookingSelection";
import {
  getCompetitionBookingDraftById,
  upsertCompetitionBookingDraft,
} from "@/lib/server/competitionBookingDrafts";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const bookingContext = await getBookingContext();
    if (bookingContext.status === "unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (bookingContext.status !== "existing") {
      return NextResponse.json({ error: "Account details not found" }, { status: 400 });
    }

    const body = (await req.json()) as {
      childId?: string;
      selections?: CompetitionBookingSelection[];
    };

    const childId = typeof body.childId === "string" ? body.childId.trim() : "";
    if (!childId) {
      return NextResponse.json({ error: "Missing childId" }, { status: 400 });
    }

    if (!bookingContext.children.some((child) => child.id === childId)) {
      return NextResponse.json({ error: "Child not found" }, { status: 404 });
    }

    const draft = await upsertCompetitionBookingDraft({
      accountId: bookingContext.accountId,
      childId,
      selections: Array.isArray(body.selections) ? body.selections : [],
    });

    return NextResponse.json({
      ok: true,
      draftId: draft.id,
      selections: draft.selections,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not save draft" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const bookingContext = await getBookingContext();
    if (bookingContext.status === "unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (bookingContext.status !== "existing") {
      return NextResponse.json({ error: "Account details not found" }, { status: 400 });
    }

    const body = (await req.json()) as {
      draftId?: string;
      selections?: CompetitionBookingSelection[];
    };

    const draftId = typeof body.draftId === "string" ? body.draftId.trim() : "";
    if (!draftId) {
      return NextResponse.json({ error: "Missing draftId" }, { status: 400 });
    }

    const existingDraft = await getCompetitionBookingDraftById({
      draftId,
      accountId: bookingContext.accountId,
    });

    if (!existingDraft) {
      return NextResponse.json({ error: "Draft not found" }, { status: 404 });
    }

    if (!bookingContext.children.some((child) => child.id === existingDraft.childId)) {
      return NextResponse.json({ error: "Child not found" }, { status: 404 });
    }

    const draft = await upsertCompetitionBookingDraft({
      accountId: bookingContext.accountId,
      childId: existingDraft.childId,
      selections: Array.isArray(body.selections) ? body.selections : [],
    });

    return NextResponse.json({
      ok: true,
      draftId: draft.id,
      selections: draft.selections,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not update draft" },
      { status: 500 }
    );
  }
}
