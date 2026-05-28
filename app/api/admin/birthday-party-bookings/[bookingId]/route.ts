import { NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { supabaseAdmin } from "@/lib/admin";
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
