import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { supabaseAdmin } from "@/lib/admin";
import type { RegisterClassTemplate } from "@/components/admin/sessionBuild";

type ClassRow = {
  id: string;
  className: string | null;
  weekday: string | number | null;
  startTime: string | null;
  endTime: string | null;
  durationMinutes: number | null;
  ageMin: number | string | null;
  ageMax: number | string | null;
  isCompetitionClass: boolean | null;
};

type BookingRow = {
  classId: string;
  status: string | null;
};

function toNullableNumber(value: number | string | null): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function toAgeBand(min: number | string | null, max: number | string | null): string {
  const minVal = toNullableNumber(min);
  const maxVal = toNullableNumber(max);
  if (minVal == null && maxVal == null) return "All ages";
  if (minVal != null && maxVal != null) return `${minVal}-${maxVal}yrs`;
  if (minVal != null) return `${minVal}+yrs`;
  return `Up to ${maxVal}yrs`;
}

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });
    }

    const cookieStore = request.cookies;
    const cookiesToPersist: Array<{
      name: string;
      value: string;
      options?: Parameters<typeof cookieStore.set>[2];
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
        setAll(cookies) {
          cookies.forEach((cookie) => cookiesToPersist.push(cookie));
        },
      },
    });

    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData?.user) {
      return applyCookies(NextResponse.json({ error: "Unauthorized" }, { status: 401 }));
    }

    const { data: classesData, error: classesError } = await supabaseAdmin
      .from("Classes")
      .select(
        "id,className,weekday,startTime,endTime,durationMinutes,ageMin,ageMax,isCompetitionClass"
      )
      .order("className", { ascending: true });

    if (classesError) {
      return NextResponse.json({ error: classesError.message }, { status: 500 });
    }

    const classes = (classesData ?? []) as ClassRow[];
    const classIds = classes.map((row) => row.id);

    let bookings: BookingRow[] = [];
    if (classIds.length > 0) {
      const { data: bookingData, error: bookingError } = await supabaseAdmin
        .from("Bookings")
        .select("classId,status")
        .in("classId", classIds);

      if (bookingError) {
        return NextResponse.json({ error: bookingError.message }, { status: 500 });
      }

      bookings = (bookingData ?? []) as BookingRow[];
    }

    const enrolledStatuses = new Set(["active", "confirmed", "current"]);
    const enrolledCountByClassId = new Map<string, number>();

    bookings.forEach((booking) => {
      const status = (booking.status ?? "").toLowerCase().trim();
      if (!enrolledStatuses.has(status)) return;
      const current = enrolledCountByClassId.get(booking.classId) ?? 0;
      enrolledCountByClassId.set(booking.classId, current + 1);
    });

    const templates: RegisterClassTemplate[] = classes.map((row) => ({
      id: row.id,
      className: row.className?.trim() || "Unnamed class",
      programme: row.isCompetitionClass ? "Competition" : "Recreational",
      ageBand: toAgeBand(row.ageMin, row.ageMax),
      weekday: row.weekday,
      startTime: row.startTime,
      endTime: row.endTime,
      durationMinutes: row.durationMinutes,
      enrolledCount: enrolledCountByClassId.get(row.id) ?? 0,
    }));

    return NextResponse.json({ classes: templates });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
