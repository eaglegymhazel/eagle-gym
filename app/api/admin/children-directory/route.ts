import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { supabaseAdmin } from "@/lib/admin";

type ChildRow = {
  id: string;
  accountId: string | number | null;
  firstName: string | null;
  lastName: string | null;
  dateOfBirth: string | null;
};

type AccountRow = {
  id: string | number;
  email: string | null;
};

type BookingJoinRow = {
  childId: string;
  Classes:
    | {
        className: string | null;
        weekday: string | null;
        startTime: string | null;
      }
    | Array<{
        className: string | null;
        weekday: string | null;
        startTime: string | null;
      }>
    | null;
};

const QUERY_PAGE_SIZE = 1000;
const IN_CLAUSE_CHUNK_SIZE = 250;

function chunkArray<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

function computeAge(dateOfBirth: string | null): number {
  if (!dateOfBirth) return 0;
  const birthDate = new Date(dateOfBirth);
  if (Number.isNaN(birthDate.getTime())) return 0;

  const now = new Date();
  let age = now.getFullYear() - birthDate.getFullYear();
  const birthdayPassed =
    now.getMonth() > birthDate.getMonth() ||
    (now.getMonth() === birthDate.getMonth() && now.getDate() >= birthDate.getDate());
  if (!birthdayPassed) age -= 1;
  return Math.max(0, age);
}

function shortWeekday(weekday: string | null): string {
  if (!weekday) return "TBD";
  const map: Record<string, string> = {
    monday: "Mon",
    tuesday: "Tue",
    wednesday: "Wed",
    thursday: "Thu",
    friday: "Fri",
    saturday: "Sat",
    sunday: "Sun",
  };
  return map[weekday.toLowerCase()] ?? weekday.slice(0, 3);
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

    const children: ChildRow[] = [];
    for (let from = 0; ; from += QUERY_PAGE_SIZE) {
      const to = from + QUERY_PAGE_SIZE - 1;
      const { data: childRows, error: childError } = await supabaseAdmin
        .from("Children")
        .select("id,accountId,firstName,lastName,dateOfBirth")
        .order("created_at", { ascending: false })
        .range(from, to);

      if (childError) {
        return NextResponse.json({ error: childError.message }, { status: 500 });
      }

      const page = (childRows ?? []) as ChildRow[];
      children.push(...page);
      if (page.length < QUERY_PAGE_SIZE) break;
    }

    const childIds = children.map((row) => row.id);
    const accountIds = [
      ...new Set(
        children
          .map((row) => row.accountId)
          .filter((value): value is string | number => value !== null && value !== undefined)
      ),
    ];

    const accountEmailById = new Map<string, string>();
    if (accountIds.length > 0) {
      const accountChunks = chunkArray(accountIds, IN_CLAUSE_CHUNK_SIZE);
      for (const chunk of accountChunks) {
        const { data: accountRows, error: accountError } = await supabaseAdmin
          .from("Accounts")
          .select("id,email")
          .in("id", chunk);

        if (accountError) {
          return NextResponse.json({ error: accountError.message }, { status: 500 });
        }

        (accountRows as AccountRow[] | null)?.forEach((row) => {
          accountEmailById.set(String(row.id), row.email ?? "");
        });
      }
    }

    const bookingRows: BookingJoinRow[] = [];
    if (childIds.length > 0) {
      const childChunks = chunkArray(childIds, IN_CLAUSE_CHUNK_SIZE);
      for (const chunk of childChunks) {
        const { data: bookingsData, error: bookingError } = await supabaseAdmin
          .from("Bookings")
          .select("childId,Classes(className,weekday,startTime)")
          .in("childId", chunk)
          .eq("status", "active");

        if (bookingError) {
          return NextResponse.json({ error: bookingError.message }, { status: 500 });
        }

        bookingRows.push(...((bookingsData ?? []) as BookingJoinRow[]));
      }
    }

    const bookingMap = new Map<
      string,
      Array<{ className: string | null; weekday: string | null; startTime: string | null }>
    >();

    bookingRows.forEach((row) => {
      const cls = Array.isArray(row.Classes) ? row.Classes[0] : row.Classes;
      if (!cls) return;
      const existing = bookingMap.get(row.childId) ?? [];
      existing.push({
        className: cls.className ?? null,
        weekday: cls.weekday ?? null,
        startTime: cls.startTime ?? null,
      });
      bookingMap.set(row.childId, existing);
    });

    const directory = children.map((child) => {
      const firstName = child.firstName?.trim() || "Unknown";
      const lastName = child.lastName?.trim() || "Child";
      const bookings = bookingMap.get(child.id) ?? [];
      const uniqueClasses = [...new Set(bookings.map((row) => row.className).filter(Boolean))];
      const primaryBooking = bookings[0] ?? null;
      const lastAttended = primaryBooking
        ? `${shortWeekday(primaryBooking.weekday)} ${primaryBooking.startTime ?? "TBD"}`
        : "No recent classes";

      return {
        id: child.id,
        firstName,
        lastName,
        age: computeAge(child.dateOfBirth),
        dateOfBirth: child.dateOfBirth ?? "",
        accountEmail:
          child.accountId !== null && child.accountId !== undefined
            ? accountEmailById.get(String(child.accountId)) ?? ""
            : "",
        group: uniqueClasses[0] ?? "Unassigned",
        attendingClasses: uniqueClasses,
        lastAttended,
        lastAttendedClass: primaryBooking?.className ?? "",
        status: bookings.length > 0 ? ("Active" as const) : ("Inactive" as const),
      };
    });

    directory.sort((a, b) => {
      const firstNameCompare = a.firstName.localeCompare(b.firstName, undefined, {
        sensitivity: "base",
      });
      if (firstNameCompare !== 0) return firstNameCompare;
      return a.lastName.localeCompare(b.lastName, undefined, {
        sensitivity: "base",
      });
    });

    return NextResponse.json({ children: directory });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
