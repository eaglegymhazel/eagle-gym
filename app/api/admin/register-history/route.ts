import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { supabaseAdmin } from "@/lib/admin";

type RegisterRow = {
  id: string;
  classId: string;
  sessionDate: string;
  takenByAccountId: string;
  takenAt: string | null;
  presentCount: number | null;
  absentCount: number | null;
};

type ClassRow = {
  id: string;
  className: string | null;
  startTime: string | null;
  endTime: string | null;
  isCompetitionClass: boolean | null;
  ageMin: number | string | null;
  ageMax: number | string | null;
};

type AccountRow = {
  id: string;
  email: string | null;
  accFirstName: string | null;
  accLastName: string | null;
};

function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00`);
  return !Number.isNaN(parsed.getTime());
}

function takenByLabel(account: AccountRow | undefined): string {
  if (!account) return "Unknown";
  const fullName = `${account.accFirstName ?? ""} ${account.accLastName ?? ""}`.trim();
  if (fullName) return fullName;
  return account.email ?? "Unknown";
}

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
  if (minVal == null && maxVal == null) return "";
  if (minVal != null && maxVal != null) return `${minVal}-${maxVal}yrs`;
  if (minVal != null) return `${minVal}+yrs`;
  return `Up to ${maxVal}yrs`;
}

function startTimeSortValue(value: string | null): number {
  if (!value) return Number.MAX_SAFE_INTEGER;
  const [hh, mm] = value.split(":");
  const hour = Number.parseInt(hh ?? "", 10);
  const minute = Number.parseInt(mm ?? "", 10);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return Number.MAX_SAFE_INTEGER;
  return hour * 60 + minute;
}

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });
    }

    const date = request.nextUrl.searchParams.get("date")?.trim() ?? "";
    if (!isValidDate(date)) {
      return NextResponse.json({ error: "Invalid date" }, { status: 400 });
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

    const { data: registerRows, error: registerError } = await supabaseAdmin
      .from("ClassRegisters")
      .select("id,classId,sessionDate,takenByAccountId,takenAt,presentCount,absentCount")
      .eq("sessionDate", date)
      .order("takenAt", { ascending: false });

    if (registerError) {
      return NextResponse.json({ error: registerError.message }, { status: 500 });
    }

    const registers = (registerRows ?? []) as RegisterRow[];
    const classIds = [...new Set(registers.map((row) => row.classId))];
    const accountIds = [...new Set(registers.map((row) => row.takenByAccountId))];

    let classesById = new Map<string, ClassRow>();
    if (classIds.length > 0) {
      const { data: classRows, error: classError } = await supabaseAdmin
        .from("Classes")
        .select("id,className,startTime,endTime,isCompetitionClass,ageMin,ageMax")
        .in("id", classIds);
      if (classError) {
        return NextResponse.json({ error: classError.message }, { status: 500 });
      }
      classesById = new Map(((classRows ?? []) as ClassRow[]).map((row) => [row.id, row]));
    }

    let accountsById = new Map<string, AccountRow>();
    if (accountIds.length > 0) {
      const { data: accountRows, error: accountError } = await supabaseAdmin
        .from("Accounts")
        .select("id,email,accFirstName,accLastName")
        .in("id", accountIds);
      if (accountError) {
        return NextResponse.json({ error: accountError.message }, { status: 500 });
      }
      accountsById = new Map(((accountRows ?? []) as AccountRow[]).map((row) => [row.id, row]));
    }

    const responseRows = registers.map((row) => {
      const cls = classesById.get(row.classId);
      const account = accountsById.get(row.takenByAccountId);
      return {
        registerId: row.id,
        classId: row.classId,
        className: cls?.className?.trim() || "Unknown class",
        programme: cls?.isCompetitionClass ? "Competition" : "Recreational",
        ageBand: cls?.isCompetitionClass ? "" : toAgeBand(cls?.ageMin ?? null, cls?.ageMax ?? null),
        sessionDate: row.sessionDate,
        startTime: cls?.startTime ?? null,
        endTime: cls?.endTime ?? null,
        presentCount: row.presentCount ?? 0,
        absentCount: row.absentCount ?? 0,
        takenAt: row.takenAt,
        takenByLabel: takenByLabel(account),
      };
    });

    responseRows.sort((a, b) => startTimeSortValue(a.startTime) - startTimeSortValue(b.startTime));

    return NextResponse.json({ registers: responseRows });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
