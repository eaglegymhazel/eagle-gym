import { revalidatePath, revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { supabaseAdmin } from "@/lib/admin";
import {
  getAdminCalendarEventFilterOptions,
  getAdminCalendarEventsPage,
} from "@/lib/server/adminCalendarEvents";
import { getWebAccountRoleForUser, isAdminRole } from "@/lib/server/webAccountRole";

type CalendarEventProgramme = "recreational" | "competition";

type AuthContext = {
  supabase: ReturnType<typeof createServerClient>;
  applyCookies: (response: NextResponse) => NextResponse;
};

const MONTH_LABELS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

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

function getTableName(programme: CalendarEventProgramme) {
  return programme === "competition" ? "calendar_events_competition" : "calendar_events";
}

function parseProgramme(value: unknown): CalendarEventProgramme | null {
  return value === "recreational" || value === "competition" ? value : null;
}

function parseEventDate(value: unknown, options?: { allowPast?: boolean }) {
  const eventDate = typeof value === "string" ? value.trim() : "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(eventDate)) return null;

  const parsed = new Date(`${eventDate}T12:00:00Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== eventDate) {
    return null;
  }

  const today = new Date();
  const todayKey = [
    String(today.getFullYear()).padStart(4, "0"),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");
  if (!options?.allowPast && eventDate < todayKey) return null;

  const month = parsed.getUTCMonth() + 1;
  return {
    event_date: eventDate,
    year: parsed.getUTCFullYear(),
    month,
    month_name: MONTH_LABELS[month - 1],
    day: parsed.getUTCDate(),
  };
}

function parseMutationPayload(body: unknown, options?: { allowPast?: boolean }) {
  if (!body || typeof body !== "object") return null;
  const payload = body as Record<string, unknown>;
  const programme = parseProgramme(payload.programme);
  const dateFields = parseEventDate(payload.eventDate, options);
  const event = typeof payload.event === "string" ? payload.event.trim() : "";

  if (!programme || !dateFields || !event) return null;

  return {
    programme,
    row: {
      ...dateFields,
      event,
      source_file: "admin",
    },
  };
}

function parseDeletePayload(body: unknown) {
  if (!body || typeof body !== "object") return null;
  const payload = body as Record<string, unknown>;
  const programme = parseProgramme(payload.programme);
  const id =
    typeof payload.id === "number"
      ? payload.id
      : typeof payload.id === "string"
        ? Number.parseInt(payload.id, 10)
        : Number.NaN;

  if (!programme || !Number.isInteger(id) || id <= 0) return null;
  return { programme, id };
}

function revalidateCalendar(programme: CalendarEventProgramme) {
  if (programme === "competition") {
    revalidateTag("calendar-events-competition-catalog", { expire: 0 });
    revalidatePath("/competition-events-calendar");
  } else {
    revalidateTag("calendar-events-catalog", { expire: 0 });
    revalidatePath("/recreational-events-calendar");
    revalidatePath("/events");
  }
}

const RETURNING_SELECT =
  "id,eventDate:event_date,year,month,monthName:month_name,day,event,sourceFile:source_file,createdAt:created_at";

export async function GET(request: NextRequest) {
  try {
    const adminResult = await ensureAdmin(request);
    if ("error" in adminResult) return adminResult.error;
    const { authContext, response } = adminResult;
    if (response) return response;

    const offset = Number.parseInt(request.nextUrl.searchParams.get("offset") ?? "0", 10);
    const limit = Number.parseInt(request.nextUrl.searchParams.get("limit") ?? "20", 10);
    const programme = parseProgramme(request.nextUrl.searchParams.get("programme"));
    const year = Number.parseInt(request.nextUrl.searchParams.get("year") ?? "", 10);
    const month = Number.parseInt(request.nextUrl.searchParams.get("month") ?? "", 10);
    const page = await getAdminCalendarEventsPage({
      offset: Number.isFinite(offset) ? offset : 0,
      limit: Number.isFinite(limit) ? limit : 20,
      programme: programme ?? undefined,
      year: Number.isInteger(year) ? year : undefined,
      month: Number.isInteger(month) && month >= 1 && month <= 12 ? month : undefined,
    });
    const filterOptions = await getAdminCalendarEventFilterOptions();

    return authContext.applyCookies(NextResponse.json({ ok: true, ...page, filterOptions }));
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

    const payload = parseMutationPayload(await request.json().catch(() => null));
    if (!payload) {
      return authContext.applyCookies(jsonError("Programme, valid event date and event title are required.", 400));
    }

    const { data, error } = await supabaseAdmin
      .from(getTableName(payload.programme))
      .insert(payload.row)
      .select(RETURNING_SELECT)
      .single();

    if (error) {
      return authContext.applyCookies(jsonError(error.message, 500));
    }

    revalidateCalendar(payload.programme);
    return authContext.applyCookies(
      NextResponse.json({ ok: true, event: { ...data, programme: payload.programme } })
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

    const body = await request.json().catch(() => null);
    const payload = parseMutationPayload(body, { allowPast: true });
    const deletePayload = parseDeletePayload(body);
    if (!payload || !deletePayload || payload.programme !== deletePayload.programme) {
      return authContext.applyCookies(jsonError("Id, programme, valid event date and event title are required.", 400));
    }

    const { data, error } = await supabaseAdmin
      .from(getTableName(payload.programme))
      .update(payload.row)
      .eq("id", deletePayload.id)
      .select(RETURNING_SELECT)
      .single();

    if (error) {
      return authContext.applyCookies(jsonError(error.message, 500));
    }

    revalidateCalendar(payload.programme);
    return authContext.applyCookies(
      NextResponse.json({ ok: true, event: { ...data, programme: payload.programme } })
    );
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

    const payload = parseDeletePayload(await request.json().catch(() => null));
    if (!payload) {
      return authContext.applyCookies(jsonError("Id and programme are required.", 400));
    }

    const { error } = await supabaseAdmin
      .from(getTableName(payload.programme))
      .delete()
      .eq("id", payload.id);

    if (error) {
      return authContext.applyCookies(jsonError(error.message, 500));
    }

    revalidateCalendar(payload.programme);
    return authContext.applyCookies(NextResponse.json({ ok: true }));
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Unknown error", 500);
  }
}
