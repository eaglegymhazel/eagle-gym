import { NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { supabaseAdmin } from "@/lib/admin";
import {
  getBirthdayPartyCalendarSlots,
  parseBirthdayPartySlotId,
} from "@/lib/server/birthdayPartyBookings";
import { getWebAccountRoleForUser, isAdminRole } from "@/lib/server/webAccountRole";

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

type AuthContext = {
  supabase: ReturnType<typeof createServerClient>;
  applyCookies: (response: NextResponse) => NextResponse;
};

function createAuthContext(request: NextRequest): AuthContext | { error: NextResponse } {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    return { error: jsonError("Supabase is not configured.", 500) };
  }

  const cookieStore = request.cookies;
  const cookiesToPersist: Array<{ name: string; value: string; options?: CookieOptions }> = [];
  const applyCookies = (response: NextResponse) => {
    cookiesToPersist.forEach(({ name, value, options }) => {
      response.cookies.set(name, value, options);
    });
    return response;
  };

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookies: Array<{ name: string; value: string; options?: CookieOptions }>) {
        cookies.forEach((cookie) => cookiesToPersist.push(cookie));
      },
    },
  });

  return { supabase, applyCookies };
}

async function ensureAdmin(
  request: NextRequest
): Promise<{ authContext: AuthContext; response: NextResponse | null } | { error: NextResponse }> {
  const authContext = createAuthContext(request);
  if ("error" in authContext) return { error: authContext.error };

  const { data: authData, error: authError } = await authContext.supabase.auth.getUser();
  if (authError || !authData?.user) {
    return { authContext, response: authContext.applyCookies(jsonError("Unauthorized", 401)) };
  }

  const role = await getWebAccountRoleForUser({
    authUserId: authData.user.id,
  });

  if (!isAdminRole(role)) {
    return { authContext, response: authContext.applyCookies(jsonError("Forbidden", 403)) };
  }

  return { authContext, response: null };
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ bookingId: string }> }
) {
  try {
    const adminResult = await ensureAdmin(request);
    if ("error" in adminResult) return adminResult.error;
    const { authContext, response } = adminResult;
    if (response) return response;

    const { bookingId } = await context.params;
    const normalizedBookingId = bookingId?.trim() ?? "";
    if (!normalizedBookingId) {
      return authContext.applyCookies(jsonError("Booking ID is required.", 400));
    }

    const body = (await request.json().catch(() => null)) as {
      slotId?: unknown;
    } | null;
    const slotId = typeof body?.slotId === "string" ? body.slotId.trim() : "";
    const targetSlot = parseBirthdayPartySlotId(slotId);

    if (!targetSlot) {
      return authContext.applyCookies(jsonError("A valid birthday party slot is required.", 400));
    }

    const { data: booking, error: bookingError } = await supabaseAdmin
      .from("BirthdayPartyBookings")
      .select("id,slot_date,start_time,end_time,status")
      .eq("id", normalizedBookingId)
      .maybeSingle();

    if (bookingError) {
      return authContext.applyCookies(jsonError(bookingError.message, 500));
    }
    if (!booking) {
      return authContext.applyCookies(jsonError("Birthday party booking not found.", 404));
    }
    if (!["pending", "paid", "confirmed"].includes(booking.status)) {
      return authContext.applyCookies(
        jsonError("Only active birthday party bookings can be moved.", 409)
      );
    }

    const isSameSlot =
      booking.slot_date === targetSlot.slotDate &&
      booking.start_time === targetSlot.startTime &&
      booking.end_time === targetSlot.endTime;
    if (isSameSlot) {
      return authContext.applyCookies(jsonError("Please choose a different party date.", 400));
    }

    const calendarSlots = await getBirthdayPartyCalendarSlots();
    const availableTarget = calendarSlots.find(
      (slot) =>
        slot.slotDate === targetSlot.slotDate &&
        slot.startTime === targetSlot.startTime &&
        slot.endTime === targetSlot.endTime &&
        slot.isAvailable
    );

    if (!availableTarget) {
      return authContext.applyCookies(
        jsonError("The selected birthday party date is no longer available.", 409)
      );
    }

    const { data: conflictingBookings, error: conflictError } = await supabaseAdmin
      .from("BirthdayPartyBookings")
      .select('id,status,"holdExpiresAt"')
      .eq("slot_date", targetSlot.slotDate)
      .eq("start_time", targetSlot.startTime)
      .eq("end_time", targetSlot.endTime)
      .neq("id", normalizedBookingId)
      .in("status", ["pending", "paid", "confirmed"]);

    if (conflictError) {
      return authContext.applyCookies(jsonError(conflictError.message, 500));
    }

    const nowIso = new Date().toISOString();
    const hasConflict = (conflictingBookings ?? []).some((conflict) => {
      if (conflict.status === "paid" || conflict.status === "confirmed") return true;
      return (
        conflict.status === "pending" &&
        typeof conflict.holdExpiresAt === "string" &&
        conflict.holdExpiresAt > nowIso
      );
    });

    if (hasConflict) {
      return authContext.applyCookies(
        jsonError("The selected birthday party date has just been taken.", 409)
      );
    }

    const { data: updatedBooking, error: updateError } = await supabaseAdmin
      .from("BirthdayPartyBookings")
      .update({
        slot_date: targetSlot.slotDate,
        start_time: targetSlot.startTime,
        end_time: targetSlot.endTime,
        updated_at: nowIso,
      })
      .eq("id", normalizedBookingId)
      .select("id,slot_date,start_time,end_time")
      .maybeSingle();

    if (updateError) {
      return authContext.applyCookies(jsonError(updateError.message, 500));
    }
    if (!updatedBooking) {
      return authContext.applyCookies(jsonError("Birthday party booking not found.", 404));
    }

    return authContext.applyCookies(
      NextResponse.json({
        ok: true,
        bookingId: updatedBooking.id,
        slotDate: updatedBooking.slot_date,
        startTime: updatedBooking.start_time,
        endTime: updatedBooking.end_time,
      })
    );
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Unknown error", 500);
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ bookingId: string }> }
) {
  try {
    const adminResult = await ensureAdmin(request);
    if ("error" in adminResult) return adminResult.error;
    const { authContext, response } = adminResult;
    if (response) return response;

    const { bookingId } = await context.params;
    const normalizedBookingId = bookingId?.trim() ?? "";
    if (!normalizedBookingId) {
      return authContext.applyCookies(jsonError("Booking ID is required.", 400));
    }

    const { data: deletedBooking, error: deleteError } = await supabaseAdmin
      .from("BirthdayPartyBookings")
      .delete()
      .eq("id", normalizedBookingId)
      .select("id,slot_date,start_time,end_time")
      .maybeSingle();

    if (deleteError) {
      return authContext.applyCookies(jsonError(deleteError.message, 500));
    }

    if (!deletedBooking) {
      return authContext.applyCookies(jsonError("Birthday party booking not found.", 404));
    }

    return authContext.applyCookies(
      NextResponse.json({
        ok: true,
        bookingId: deletedBooking.id,
        slotDate: deletedBooking.slot_date,
        startTime: deletedBooking.start_time,
        endTime: deletedBooking.end_time,
      })
    );
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Unknown error", 500);
  }
}
