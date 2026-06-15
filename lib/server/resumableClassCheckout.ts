import type Stripe from "stripe";
import { supabaseAdmin } from "@/lib/admin";

type BookingType = "recreational" | "competition";

type Selection = {
  classId: string;
  bookedDurationMinutes: number | null;
};

type PendingGroup = {
  id: string;
  stripeCheckoutSessionId: string | null;
};

type PendingItem = {
  bookingGroupId: string;
  classId: string;
  bookedDurationMinutes: number | null;
};

export type ResumableClassCheckout =
  | { status: "none" }
  | { status: "open"; url: string }
  | { status: "processing" };

function selectionKey(selection: Selection): string {
  return `${selection.classId}:${selection.bookedDurationMinutes ?? ""}`;
}

async function cancelPendingGroup(groupId: string): Promise<void> {
  const now = new Date().toISOString();
  const { error: itemUpdateError } = await supabaseAdmin
    .from("ClassBookingGroupItems")
    .update({ status: "cancelled", updated_at: now })
    .eq("bookingGroupId", groupId)
    .eq("status", "pending");
  if (itemUpdateError) {
    throw new Error(itemUpdateError.message);
  }

  const { error: groupUpdateError } = await supabaseAdmin
    .from("ClassBookingGroups")
    .update({ status: "cancelled", updated_at: now })
    .eq("id", groupId)
    .eq("status", "pending");
  if (groupUpdateError) {
    throw new Error(groupUpdateError.message);
  }
}

function hasLegacyCancelUrl(session: Stripe.Checkout.Session): boolean {
  if (!session.cancel_url) return false;
  try {
    return new URL(session.cancel_url).pathname === "/booking/cancel";
  } catch {
    return session.cancel_url.endsWith("/booking/cancel");
  }
}

export async function expireStaleClassCheckouts({
  stripe,
  accountId,
  childId,
  bookingType,
}: {
  stripe: Stripe;
  accountId: string;
  childId: string;
  bookingType: BookingType;
}): Promise<"none" | "processing"> {
  const now = new Date().toISOString();
  const { data: groupData, error: groupError } = await supabaseAdmin
    .from("ClassBookingGroups")
    .select('id,"stripeCheckoutSessionId"')
    .eq("accountId", accountId)
    .eq("childId", childId)
    .eq("bookingType", bookingType)
    .eq("status", "pending")
    .lte("holdExpiresAt", now);

  if (groupError) {
    throw new Error(groupError.message);
  }

  const groups = (groupData ?? []) as PendingGroup[];
  for (const group of groups) {
    if (group.stripeCheckoutSessionId) {
      const session = await stripe.checkout.sessions.retrieve(
        group.stripeCheckoutSessionId
      );
      if (session.status === "open") {
        await stripe.checkout.sessions.expire(group.stripeCheckoutSessionId);
      }
      if (session.status === "complete") {
        return "processing";
      }
    }

    const { error: itemUpdateError } = await supabaseAdmin
      .from("ClassBookingGroupItems")
      .update({ status: "expired", updated_at: now })
      .eq("bookingGroupId", group.id)
      .eq("status", "pending");
    if (itemUpdateError) {
      throw new Error(itemUpdateError.message);
    }

    const { error: groupUpdateError } = await supabaseAdmin
      .from("ClassBookingGroups")
      .update({ status: "expired", updated_at: now })
      .eq("id", group.id)
      .eq("status", "pending");
    if (groupUpdateError) {
      throw new Error(groupUpdateError.message);
    }
  }

  return "none";
}

export async function findResumableClassCheckout({
  stripe,
  accountId,
  childId,
  bookingType,
  selections,
}: {
  stripe: Stripe;
  accountId: string;
  childId: string;
  bookingType: BookingType;
  selections: Selection[];
}): Promise<ResumableClassCheckout> {
  const expectedKeys = selections.map(selectionKey).sort();
  const { data: groupData, error: groupError } = await supabaseAdmin
    .from("ClassBookingGroups")
    .select('id,"stripeCheckoutSessionId"')
    .eq("accountId", accountId)
    .eq("childId", childId)
    .eq("bookingType", bookingType)
    .eq("status", "pending")
    .gt("holdExpiresAt", new Date().toISOString());

  if (groupError) {
    throw new Error(groupError.message);
  }

  const groups = (groupData ?? []) as PendingGroup[];
  if (groups.length === 0) return { status: "none" };

  const { data: itemData, error: itemError } = await supabaseAdmin
    .from("ClassBookingGroupItems")
    .select('"bookingGroupId","classId","bookedDurationMinutes"')
    .in(
      "bookingGroupId",
      groups.map((group) => group.id)
    )
    .eq("status", "pending");

  if (itemError) {
    throw new Error(itemError.message);
  }

  const items = (itemData ?? []) as PendingItem[];
  for (const group of groups) {
    const groupItems = items.filter((item) => item.bookingGroupId === group.id);
    const groupKeys = groupItems.map(selectionKey).sort();
    const isExactMatch =
      groupKeys.length === expectedKeys.length &&
      groupKeys.every((key, index) => key === expectedKeys[index]);
    const requestedClassIds = new Set(
      selections.map((selection) => selection.classId)
    );
    const hasOverlappingClass = groupItems.some((item) =>
      requestedClassIds.has(item.classId)
    );

    if (!isExactMatch && !hasOverlappingClass) continue;
    if (!group.stripeCheckoutSessionId) {
      await cancelPendingGroup(group.id);
      continue;
    }

    const session = await stripe.checkout.sessions.retrieve(
      group.stripeCheckoutSessionId
    );
    if (
      session.status === "open" &&
      (!isExactMatch || hasLegacyCancelUrl(session))
    ) {
      await stripe.checkout.sessions.expire(group.stripeCheckoutSessionId);
      await cancelPendingGroup(group.id);
      continue;
    }
    if (
      session.status === "open" &&
      session.url &&
      session.metadata?.bookingGroupId === group.id
    ) {
      return { status: "open", url: session.url };
    }
    if (session.status === "complete") {
      return { status: "processing" };
    }
  }

  return { status: "none" };
}
