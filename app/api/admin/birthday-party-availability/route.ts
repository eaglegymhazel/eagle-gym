import { NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { supabaseAdmin } from "@/lib/admin";
import { getBirthdayPartyCalendarSlots } from "@/lib/server/birthdayPartyBookings";
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

function parsePayload(body: unknown) {
  if (!body || typeof body !== "object") return null;
  const payload = body as Record<string, unknown>;
  const slotDate = typeof payload.slotDate === "string" ? payload.slotDate.trim() : "";
  const startTime = typeof payload.startTime === "string" ? payload.startTime.trim() : "";
  const endTime = typeof payload.endTime === "string" ? payload.endTime.trim() : "";
  const reason = typeof payload.reason === "string" ? payload.reason.trim() : "";
  if (!slotDate || !startTime || !endTime) return null;
  return { slotDate, startTime, endTime, reason };
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
    email: authData.user.email ?? null,
  });

  if (!isAdminRole(role)) {
    return { authContext, response: authContext.applyCookies(jsonError("Forbidden", 403)) };
  }

  return { authContext, response: null };
}

async function buildSlotResponse(slotDate: string, startTime: string, endTime: string) {
  const slots = await getBirthdayPartyCalendarSlots();
  return slots.find(
    (slot) => slot.slotDate === slotDate && slot.startTime === startTime && slot.endTime === endTime
  );
}

export async function POST(request: NextRequest) {
  try {
    const adminResult = await ensureAdmin(request);
    if ("error" in adminResult) return adminResult.error;
    const { authContext, response } = adminResult;
    if (response) return response;

    const payload = parsePayload(await request.json().catch(() => null));
    if (!payload) {
      return authContext.applyCookies(jsonError("slotDate, startTime and endTime are required.", 400));
    }

    const { data: bookingRows, error: bookingError } = await supabaseAdmin
      .from("BirthdayPartyBookings")
      .select('id,status,"holdExpiresAt"')
      .eq("slot_date", payload.slotDate)
      .eq("start_time", payload.startTime)
      .eq("end_time", payload.endTime)
      .in("status", ["pending", "paid", "confirmed"]);

    if (bookingError) {
      return authContext.applyCookies(jsonError(bookingError.message, 500));
    }

    const nowIso = new Date().toISOString();
    const hasBlockingBooking = (bookingRows ?? []).some((booking: { status: string; holdExpiresAt: string | null }) => {
      if (booking.status === "paid" || booking.status === "confirmed") return true;
      return booking.status === "pending" && !!booking.holdExpiresAt && booking.holdExpiresAt > nowIso;
    });

    if (hasBlockingBooking) {
      return authContext.applyCookies(
        jsonError("This date already has a booking or an active payment hold.", 409)
      );
    }

    const { error: upsertError } = await supabaseAdmin
      .from("BirthdayPartyBlockedDates")
      .upsert(
        {
          slot_date: payload.slotDate,
          start_time: payload.startTime,
          end_time: payload.endTime,
          reason: payload.reason || null,
        },
        { onConflict: "slot_date,start_time,end_time" }
      );

    if (upsertError) {
      return authContext.applyCookies(jsonError(upsertError.message, 500));
    }

    const slot = await buildSlotResponse(payload.slotDate, payload.startTime, payload.endTime);
    return authContext.applyCookies(NextResponse.json({ ok: true, slot }));
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Unknown error", 500);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const adminResult = await ensureAdmin(request);
    if ("error" in adminResult) return adminResult.error;
    const { authContext, response } = adminResult;
    if (response) return response;

    const payload = parsePayload(await request.json().catch(() => null));
    if (!payload) {
      return authContext.applyCookies(jsonError("slotDate, startTime and endTime are required.", 400));
    }

    const { error: deleteError } = await supabaseAdmin
      .from("BirthdayPartyBlockedDates")
      .delete()
      .eq("slot_date", payload.slotDate)
      .eq("start_time", payload.startTime)
      .eq("end_time", payload.endTime);

    if (deleteError) {
      return authContext.applyCookies(jsonError(deleteError.message, 500));
    }

    const slot = await buildSlotResponse(payload.slotDate, payload.startTime, payload.endTime);
    return authContext.applyCookies(NextResponse.json({ ok: true, slot }));
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Unknown error", 500);
  }
}
