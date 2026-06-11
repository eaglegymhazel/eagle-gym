import { NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { supabaseAdmin } from "@/lib/admin";
import { getWebAccountRoleForUser, isAdminRole } from "@/lib/server/webAccountRole";

const BLOCKING_BOOKING_STATUSES = ["active", "confirmed", "current"] as const;

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return jsonError("Supabase is not configured.", 500);
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

    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData?.user) {
      return applyCookies(jsonError("Unauthorized", 401));
    }

    const role = await getWebAccountRoleForUser({
      authUserId: authData.user.id,
    });
    if (!isAdminRole(role)) {
      return applyCookies(jsonError("Forbidden", 403));
    }

    const body = (await request.json().catch(() => null)) as {
      childId?: unknown;
    } | null;
    const childId =
      typeof body?.childId === "string" ? body.childId.trim() : "";

    if (!childId) {
      return applyCookies(jsonError("childId is required.", 400));
    }

    const { data: child, error: childError } = await supabaseAdmin
      .from("Children")
      .select("id,firstName,lastName,isArchived,archivedAt")
      .eq("id", childId)
      .maybeSingle();

    if (childError) {
      return applyCookies(jsonError(childError.message, 500));
    }
    if (!child) {
      return applyCookies(jsonError("Student not found.", 404));
    }
    if (child.isArchived === true) {
      return applyCookies(
        NextResponse.json({
          ok: true,
          archived: true,
          childId,
          archivedAt: child.archivedAt ?? null,
        })
      );
    }

    const { data: activeBookings, error: bookingError } = await supabaseAdmin
      .from("Bookings")
      .select("id")
      .eq("childId", childId)
      .in("status", [...BLOCKING_BOOKING_STATUSES]);

    if (bookingError) {
      return applyCookies(jsonError(bookingError.message, 500));
    }
    if ((activeBookings ?? []).length > 0) {
      return applyCookies(
        jsonError(
          "This student cannot be archived while they have an active or current class booking.",
          409
        )
      );
    }

    const { error: waitlistDeleteError } = await supabaseAdmin
      .from("WaitlistEntries")
      .delete()
      .eq("childId", childId);

    if (waitlistDeleteError) {
      return applyCookies(jsonError(waitlistDeleteError.message, 500));
    }

    const archivedAt = new Date().toISOString();
    const { error: archiveError } = await supabaseAdmin
      .from("Children")
      .update({
        isArchived: true,
        archivedAt,
      })
      .eq("id", childId);

    if (archiveError) {
      return applyCookies(jsonError(archiveError.message, 500));
    }

    return applyCookies(
      NextResponse.json({
        ok: true,
        archived: true,
        childId,
        archivedAt,
      })
    );
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Unknown error", 500);
  }
}
