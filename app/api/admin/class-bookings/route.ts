import { NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { getWebAccountRoleForUser, isAdminRole } from "@/lib/server/webAccountRole";

type AuthContext = {
  supabase: ReturnType<typeof createServerClient>;
  serviceRole: ReturnType<typeof createServerClient>;
  applyCookies: (response: NextResponse) => NextResponse;
};

type ClassBookingStudentRow = {
  bookingId: string;
  childId: string;
  classId: string;
  bookingType: string | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  createdAt: string | null;
  childFirstName: string | null;
  childLastName: string | null;
  accountId: string | null;
  accountFirstName: string | null;
  accountLastName: string | null;
  accountEmail: string | null;
  accountTelNo: string | null;
};

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function createAuthContext(request: NextRequest): AuthContext | { error: NextResponse } {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
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
        cookies.forEach((cookie) => {
          cookiesToPersist.push(cookie);
        });
      },
    },
  });

  const serviceRole = createServerClient(supabaseUrl, supabaseServiceRoleKey, {
    cookies: {
      getAll() {
        return [];
      },
      setAll() {},
    },
  });

  return { supabase, serviceRole, applyCookies };
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

export async function GET(request: NextRequest) {
  try {
    const adminResult = await ensureAdmin(request);
    if ("error" in adminResult) return adminResult.error;

    const { authContext, response } = adminResult;
    if (response) return response;

    const classId = request.nextUrl.searchParams.get("classId")?.trim() ?? "";
    if (!classId) {
      return authContext.applyCookies(jsonError("classId is required.", 400));
    }

    const { data, error } = await authContext.serviceRole
      .from("Bookings")
      .select(
        'id,childId,classId,bookingType,"stripeCustomerId","stripeSubscriptionId",created_at,Children!inner(firstName,lastName,accountId),Accounts!Bookings_accountId_fkey(accFirstName,accLastName,email,accTelNo)'
      )
      .eq("classId", classId)
      .eq("status", "active")
      .in("bookingType", ["recreational", "competition"])
      .order("created_at", { ascending: true });

    if (error) {
      return authContext.applyCookies(jsonError(error.message, 500));
    }

    const students: ClassBookingStudentRow[] = ((data ?? []) as Array<Record<string, unknown>>).map((row) => {
      const child = Array.isArray(row.Children) ? row.Children[0] : row.Children;
      const account = Array.isArray(row.Accounts) ? row.Accounts[0] : row.Accounts;

      return {
        bookingId: typeof row.id === "string" ? row.id : "",
        childId: typeof row.childId === "string" ? row.childId : "",
        classId: typeof row.classId === "string" ? row.classId : "",
        bookingType: typeof row.bookingType === "string" ? row.bookingType : null,
        stripeCustomerId:
          typeof row.stripeCustomerId === "string" ? row.stripeCustomerId : null,
        stripeSubscriptionId:
          typeof row.stripeSubscriptionId === "string" ? row.stripeSubscriptionId : null,
        createdAt: typeof row.created_at === "string" ? row.created_at : null,
        childFirstName:
          child && typeof child === "object" && typeof child.firstName === "string"
            ? child.firstName
            : null,
        childLastName:
          child && typeof child === "object" && typeof child.lastName === "string"
            ? child.lastName
            : null,
        accountId:
          child && typeof child === "object" && typeof child.accountId === "string"
            ? child.accountId
            : null,
        accountFirstName:
          account && typeof account === "object" && typeof account.accFirstName === "string"
            ? account.accFirstName
            : null,
        accountLastName:
          account && typeof account === "object" && typeof account.accLastName === "string"
            ? account.accLastName
            : null,
        accountEmail:
          account && typeof account === "object" && typeof account.email === "string"
            ? account.email
            : null,
        accountTelNo:
          account && typeof account === "object" && typeof account.accTelNo === "string"
            ? account.accTelNo
            : null,
      };
    });

    students.sort((a, b) => {
      const aName = `${a.childFirstName ?? ""} ${a.childLastName ?? ""}`.trim();
      const bName = `${b.childFirstName ?? ""} ${b.childLastName ?? ""}`.trim();
      return aName.localeCompare(bName, undefined, { sensitivity: "base" });
    });

    return authContext.applyCookies(NextResponse.json({ ok: true, students }));
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Unknown error", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const adminResult = await ensureAdmin(request);
    if ("error" in adminResult) return adminResult.error;

    const { authContext, response } = adminResult;
    if (response) return response;

    const body = (await request.json()) as {
      bookingId?: unknown;
      confirmedStripeUpdate?: unknown;
    };
    const bookingId = typeof body.bookingId === "string" ? body.bookingId.trim() : "";
    const confirmedStripeUpdate = body.confirmedStripeUpdate === true;

    if (!bookingId) {
      return authContext.applyCookies(jsonError("bookingId is required.", 400));
    }

    if (!confirmedStripeUpdate) {
      return authContext.applyCookies(
        jsonError("Stripe update confirmation is required.", 400)
      );
    }

    const { data: booking, error: bookingError } = await authContext.serviceRole
      .from("Bookings")
      .select('id,status,bookingType')
      .eq("id", bookingId)
      .maybeSingle();

    if (bookingError) {
      return authContext.applyCookies(jsonError(bookingError.message, 500));
    }

    if (!booking) {
      return authContext.applyCookies(jsonError("Booking not found.", 404));
    }

    if (booking.status !== "active") {
      return authContext.applyCookies(jsonError("Only active class bookings can be cancelled.", 400));
    }

    if (booking.bookingType !== "recreational" && booking.bookingType !== "competition") {
      return authContext.applyCookies(jsonError("Only class bookings can be cancelled here.", 400));
    }

    const cancelledAt = new Date().toISOString();
    const { error: updateError } = await authContext.serviceRole
      .from("Bookings")
      .update({
        status: "cancelled",
        cancelledAt,
        cancelReason: "manual removal admin",
        autoRenew: false,
        updatedAt: cancelledAt,
      })
      .eq("id", bookingId);

    if (updateError) {
      return authContext.applyCookies(jsonError(updateError.message, 500));
    }

    return authContext.applyCookies(
      NextResponse.json({ ok: true, bookingId, cancelledAt })
    );
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Unknown error", 500);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const adminResult = await ensureAdmin(request);
    if ("error" in adminResult) return adminResult.error;

    const { authContext, response } = adminResult;
    if (response) return response;

    const body = (await request.json()) as {
      childId?: unknown;
      classId?: unknown;
      confirmedStripeUpdate?: unknown;
    };

    const childId = typeof body.childId === "string" ? body.childId.trim() : "";
    const classId = typeof body.classId === "string" ? body.classId.trim() : "";
    const confirmedStripeUpdate = body.confirmedStripeUpdate === true;

    if (!childId || !classId) {
      return authContext.applyCookies(jsonError("childId and classId are required.", 400));
    }

    if (!confirmedStripeUpdate) {
      return authContext.applyCookies(
        jsonError("Stripe update confirmation is required.", 400)
      );
    }

    const { data: child, error: childError } = await authContext.serviceRole
      .from("Children")
      .select('id,"accountId"')
      .eq("id", childId)
      .maybeSingle();

    if (childError) {
      return authContext.applyCookies(jsonError(childError.message, 500));
    }

    if (!child) {
      return authContext.applyCookies(jsonError("Student not found.", 404));
    }

    const accountId =
      typeof child.accountId === "string" && child.accountId.trim()
        ? child.accountId.trim()
        : "";

    if (!accountId) {
      return authContext.applyCookies(jsonError("Student account could not be resolved.", 400));
    }

    const { data: classRow, error: classError } = await authContext.serviceRole
      .from("Classes")
      .select('id,"isCompetitionClass","durationMinutes"')
      .eq("id", classId)
      .maybeSingle();

    if (classError) {
      return authContext.applyCookies(jsonError(classError.message, 500));
    }

    if (!classRow) {
      return authContext.applyCookies(jsonError("Class not found.", 404));
    }

    const bookingType = classRow.isCompetitionClass === true ? "competition" : "recreational";

    const { data: existingBooking, error: existingBookingError } = await authContext.serviceRole
      .from("Bookings")
      .select("id")
      .eq("childId", childId)
      .eq("classId", classId)
      .eq("bookingType", bookingType)
      .eq("status", "active")
      .maybeSingle();

    if (existingBookingError) {
      return authContext.applyCookies(jsonError(existingBookingError.message, 500));
    }

    if (existingBooking?.id) {
      return authContext.applyCookies(
        jsonError("This student already has an active booking for that class.", 409)
      );
    }

    const nowIso = new Date().toISOString();
    const todayDate = nowIso.slice(0, 10);
    const bookedDurationMinutes =
      typeof classRow.durationMinutes === "number" && classRow.durationMinutes > 0
        ? classRow.durationMinutes
        : null;

    const { data: insertedBooking, error: insertError } = await authContext.serviceRole
      .from("Bookings")
      .insert({
        childId,
        classId,
        accountId,
        bookingType,
        startDate: todayDate,
        status: "active",
        autoRenew: true,
        autoRenewConsent: true,
        bookedDurationMinutes,
        updatedAt: nowIso,
      })
      .select("id,bookingType,startDate")
      .maybeSingle();

    if (insertError) {
      const message =
        insertError.code === "23505"
          ? "This student already has an active booking for that class."
          : insertError.message;
      return authContext.applyCookies(jsonError(message, 409));
    }

    return authContext.applyCookies(
      NextResponse.json({
        ok: true,
        bookingId: insertedBooking?.id ?? null,
        bookingType: insertedBooking?.bookingType ?? bookingType,
        startDate: insertedBooking?.startDate ?? todayDate,
      })
    );
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Unknown error", 500);
  }
}
