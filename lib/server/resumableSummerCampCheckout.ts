import type Stripe from "stripe";
import { supabaseAdmin } from "@/lib/admin";

type PendingGroup = {
  id: string;
  stripeCheckoutSessionId: string | null;
  holdExpiresAt: string | null;
};

type PendingBooking = {
  bookingGroupId: string;
  campDate: string;
};

export type SummerCampCheckoutRecovery =
  | { status: "none" }
  | { status: "open"; url: string }
  | { status: "processing" };

async function closePendingGroup(
  groupId: string,
  status: "cancelled" | "expired"
): Promise<void> {
  const now = new Date().toISOString();
  const { error: bookingError } = await supabaseAdmin
    .from("SummerCampBookings")
    .update({ status, updated_at: now })
    .eq("bookingGroupId", groupId)
    .eq("status", "pending");
  if (bookingError) throw new Error(bookingError.message);

  const { error: groupError } = await supabaseAdmin
    .from("SummerCampBookingGroups")
    .update({ status, updated_at: now })
    .eq("id", groupId)
    .eq("status", "pending");
  if (groupError) throw new Error(groupError.message);
}

export async function recoverSummerCampCheckout({
  stripe,
  accountId,
  childId,
  slug,
  selectedDates,
}: {
  stripe: Stripe;
  accountId: string;
  childId: string;
  slug: string;
  selectedDates: string[];
}): Promise<SummerCampCheckoutRecovery> {
  const now = new Date();
  const expectedDates = selectedDates.slice().sort();
  const expectedDateSet = new Set(expectedDates);
  const { data: groupData, error: groupError } = await supabaseAdmin
    .from("SummerCampBookingGroups")
    .select('id,"stripeCheckoutSessionId","holdExpiresAt"')
    .eq("accountId", accountId)
    .eq("childId", childId)
    .eq("slug", slug)
    .eq("status", "pending");

  if (groupError) throw new Error(groupError.message);

  const groups = (groupData ?? []) as PendingGroup[];
  if (groups.length === 0) return { status: "none" };

  const { data: bookingData, error: bookingError } = await supabaseAdmin
    .from("SummerCampBookings")
    .select('"bookingGroupId","campDate"')
    .in(
      "bookingGroupId",
      groups.map((group) => group.id)
    )
    .eq("status", "pending");

  if (bookingError) throw new Error(bookingError.message);

  const bookings = (bookingData ?? []) as PendingBooking[];
  for (const group of groups) {
    const groupDates = bookings
      .filter((booking) => booking.bookingGroupId === group.id)
      .map((booking) => booking.campDate)
      .sort();
    const isExactMatch =
      groupDates.length === expectedDates.length &&
      groupDates.every((date, index) => date === expectedDates[index]);
    const hasOverlap = groupDates.some((date) => expectedDateSet.has(date));
    const holdExpiresAt = group.holdExpiresAt
      ? Date.parse(group.holdExpiresAt)
      : Number.NaN;
    const holdExpired =
      !Number.isFinite(holdExpiresAt) || holdExpiresAt <= now.getTime();

    if (!holdExpired && !isExactMatch && !hasOverlap) continue;

    if (!group.stripeCheckoutSessionId) {
      await closePendingGroup(group.id, holdExpired ? "expired" : "cancelled");
      continue;
    }

    const session = await stripe.checkout.sessions.retrieve(
      group.stripeCheckoutSessionId
    );
    if (session.status === "complete") {
      return { status: "processing" };
    }

    if (session.status === "open" && !holdExpired && isExactMatch && session.url) {
      return { status: "open", url: session.url };
    }

    if (session.status === "open") {
      await stripe.checkout.sessions.expire(group.stripeCheckoutSessionId);
    }
    await closePendingGroup(group.id, holdExpired ? "expired" : "cancelled");
  }

  return { status: "none" };
}
