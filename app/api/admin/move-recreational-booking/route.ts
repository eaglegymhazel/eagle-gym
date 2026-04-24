import { NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { supabaseAdmin } from "@/lib/admin";
import { getWebAccountRoleForUser, isAdminRole } from "@/lib/server/webAccountRole";

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function createAuthContext(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    return { error: jsonError("Supabase is not configured.", 500) };
  }

  const cookieStore = request.cookies;
  const cookiesToPersist: Array<{
    name: string;
    value: string;
    options?: CookieOptions;
  }> = [];
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

export async function POST(request: NextRequest) {
  try {
    const authContext = createAuthContext(request);
    if ("error" in authContext) return authContext.error;

    const { data: authData, error: authError } = await authContext.supabase.auth.getUser();
    if (authError || !authData?.user) {
      return authContext.applyCookies(jsonError("Unauthorized", 401));
    }

    const role = await getWebAccountRoleForUser({
      authUserId: authData.user.id,
      email: authData.user.email ?? null,
    });
    if (!isAdminRole(role)) {
      return authContext.applyCookies(jsonError("Forbidden", 403));
    }

    const body = (await request.json()) as {
      bookingId?: unknown;
      classId?: unknown;
    };

    const bookingId = typeof body.bookingId === "string" ? body.bookingId.trim() : "";
    const classId = typeof body.classId === "string" ? body.classId.trim() : "";

    if (!bookingId || !classId) {
      return authContext.applyCookies(jsonError("bookingId and classId are required.", 400));
    }

    const { data: booking, error: bookingError } = await supabaseAdmin
      .from("Bookings")
      .select("id,classId,bookingType,status")
      .eq("id", bookingId)
      .maybeSingle();

    if (bookingError) {
      return authContext.applyCookies(jsonError(bookingError.message, 500));
    }
    if (!booking?.id) {
      return authContext.applyCookies(jsonError("Booking not found.", 404));
    }
    if (booking.bookingType !== "recreational" || booking.status !== "active") {
      return authContext.applyCookies(
        jsonError("Only active recreational bookings can be moved.", 400)
      );
    }
    if (booking.classId === classId) {
      return authContext.applyCookies(
        jsonError("This student is already booked into that class.", 400)
      );
    }

    const { data: targetClass, error: classError } = await supabaseAdmin
      .from("Classes")
      .select("id,isCompetitionClass")
      .eq("id", classId)
      .maybeSingle();

    if (classError) {
      return authContext.applyCookies(jsonError(classError.message, 500));
    }
    if (!targetClass?.id) {
      return authContext.applyCookies(jsonError("Target class not found.", 404));
    }
    if (targetClass.isCompetitionClass !== false) {
      return authContext.applyCookies(
        jsonError("Target class must be a recreational class.", 400)
      );
    }

    const { data: movedBooking, error: updateError } = await supabaseAdmin
      .from("Bookings")
      .update({
        classId,
        updatedAt: new Date().toISOString(),
      })
      .eq("id", bookingId)
      .select(
        'id,classId,bookingType,status,created_at,Classes(className,weekday,startTime,endTime,durationMinutes,ageMin:ageMin,ageMax:ageMax,capacity)'
      )
      .maybeSingle();

    if (updateError) {
      return authContext.applyCookies(jsonError(updateError.message, 500));
    }

    return authContext.applyCookies(
      NextResponse.json({
        ok: true,
        booking: movedBooking,
      })
    );
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Unknown error", 500);
  }
}
