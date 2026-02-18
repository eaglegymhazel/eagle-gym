import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import RecreationalClassesClient, {
  type WeekdayGroup,
} from "./RecreationalClassesClient";

type SearchParams = {
  childId?: string;
  classIds?: string;
};

type BootstrappedChild = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  dateOfBirth: string | null;
};

interface ClassRow {
  id: string;
  name: string | null;
  weekday: string | number | null;
  startTime: string | null;
  endTime: string | null;
  durationMinutes: number | null;
  minAge: number | string | null;
  maxAge: number | string | null;
  capacity: number | null;
  isCompetitionClass: boolean | null;
}

const WEEKDAY_ORDER = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

function computeAge(dateOfBirth: string | null): number | null {
  if (!dateOfBirth) return null;
  const birthDate = new Date(dateOfBirth);
  if (Number.isNaN(birthDate.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const hasBirthdayPassed =
    today.getMonth() > birthDate.getMonth() ||
    (today.getMonth() === birthDate.getMonth() &&
      today.getDate() >= birthDate.getDate());

  if (!hasBirthdayPassed) {
    age -= 1;
  }

  return age >= 0 ? age : null;
}

function parseTimeToMinutes(value: string | null): number {
  if (!value) return Number.MAX_SAFE_INTEGER;
  const parts = value.split(":");
  const hours = Number.parseInt(parts[0] ?? "", 10);
  const minutes = Number.parseInt(parts[1] ?? "", 10);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return Number.MAX_SAFE_INTEGER;
  }
  return hours * 60 + minutes;
}

function normalizeWeekday(input: string | number | null): string | null {
  if (input == null) return null;

  if (typeof input === "number") {
    if (input >= 1 && input <= 7) return WEEKDAY_ORDER[input - 1];
    if (input >= 0 && input <= 6) {
      const sundayFirst = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ] as const;
      return sundayFirst[input];
    }
    return null;
  }

  const trimmed = input.trim();
  if (!trimmed) return null;
  if (/^\d+$/.test(trimmed)) {
    return normalizeWeekday(Number.parseInt(trimmed, 10));
  }

  const normalized = trimmed.toLowerCase();
  const lookup: Record<string, string> = {
    mon: "Monday",
    monday: "Monday",
    tue: "Tuesday",
    tues: "Tuesday",
    tuesday: "Tuesday",
    wed: "Wednesday",
    wednesday: "Wednesday",
    thu: "Thursday",
    thur: "Thursday",
    thurs: "Thursday",
    thursday: "Thursday",
    fri: "Friday",
    friday: "Friday",
    sat: "Saturday",
    saturday: "Saturday",
    sun: "Sunday",
    sunday: "Sunday",
  };

  return lookup[normalized] ?? null;
}

function toNullableNumber(value: number | string | null): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function isEligibleForAge(item: ClassRow, childAge: number | null): boolean {
  if (childAge == null) return false;
  const min = toNullableNumber(item.minAge) ?? -Infinity;
  const max = toNullableNumber(item.maxAge) ?? Infinity;
  return min <= childAge && childAge <= max;
}

export default async function RecreationalBookingPage({
  searchParams,
}: {
  searchParams?: SearchParams | Promise<SearchParams>;
}) {
  const resolvedSearchParams = await searchParams;
  const childId = resolvedSearchParams?.childId;
  const initialSelectedClassIds = (resolvedSearchParams?.classIds ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
  if (!childId) {
    redirect("/book");
  }

  const headersList = headers();
  const resolvedHeaders =
    typeof (headersList as unknown as Promise<Headers>).then === "function"
      ? await (headersList as Promise<Headers>)
      : (headersList as Headers);
  const cookieHeader =
    typeof (resolvedHeaders as Headers).get === "function"
      ? resolvedHeaders.get("cookie") ?? ""
      : "";
  const host =
    typeof (resolvedHeaders as Headers).get === "function"
      ? resolvedHeaders.get("x-forwarded-host") ??
        resolvedHeaders.get("host") ??
        "localhost:3000"
      : "localhost:3000";
  const proto =
    typeof (resolvedHeaders as Headers).get === "function"
      ? resolvedHeaders.get("x-forwarded-proto") ?? "http"
      : "http";
  const baseUrl = `${proto}://${host}`;

  const bootstrapRes = await fetch(`${baseUrl}/api/account/bootstrap`, {
    method: "POST",
    headers: { cookie: cookieHeader },
    cache: "no-store",
  });

  if (bootstrapRes.status === 401) {
    redirect("/login");
  }
  if (!bootstrapRes.ok) {
    redirect("/book");
  }

  const bootstrap = await bootstrapRes.json();
  const children: BootstrappedChild[] = Array.isArray(bootstrap?.children)
    ? bootstrap.children
    : [];
  const child = children.find((item) => item.id === childId);
  if (!child?.id) {
    redirect("/book");
  }

  const childName = `${child.firstName ?? ""} ${child.lastName ?? ""}`.trim();
  const childAge = computeAge(child.dateOfBirth ?? null);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error("Supabase environment variables are not configured.");
  }

  const admin = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const { data, error } = await admin
    .from("Classes")
    .select(
      "id,name:className,weekday,startTime,endTime,durationMinutes,minAge:ageMin,maxAge:ageMax,capacity,isCompetitionClass"
    )
    .eq("isCompetitionClass", false);

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as ClassRow[];
  const eligible = rows.filter((item) => isEligibleForAge(item, childAge));
  const ageBandLabel = childAge != null ? `Age ${childAge}` : "Age unknown";
  const eligibleClassIds = eligible.map((item) => item.id);

  const bookingCountsByClassId = new Map<string, number>();
  if (eligibleClassIds.length > 0) {
    const { data: activeBookings, error: activeBookingsError } = await admin
      .from("Bookings")
      .select("classId")
      .in("classId", eligibleClassIds)
      .eq("status", "active");

    if (activeBookingsError) {
      throw new Error(activeBookingsError.message);
    }

    (activeBookings ?? []).forEach((row: { classId: string | null }) => {
      if (!row.classId) return;
      const current = bookingCountsByClassId.get(row.classId) ?? 0;
      bookingCountsByClassId.set(row.classId, current + 1);
    });
  }

  const groupedMap = new Map<string, WeekdayGroup["classes"]>();
  WEEKDAY_ORDER.forEach((day) => {
    groupedMap.set(day, []);
  });

  eligible.forEach((item) => {
    const day = normalizeWeekday(item.weekday);
    if (!day) return;
    const bucket = groupedMap.get(day);
    if (!bucket) return;
    bucket.push({
      id: item.id,
      name: item.name ?? "Unnamed class",
      startTime: item.startTime ?? "",
      endTime: item.endTime ?? "",
      durationMinutes:
        typeof item.durationMinutes === "number" ? item.durationMinutes : null,
      minAge: toNullableNumber(item.minAge),
      maxAge: toNullableNumber(item.maxAge),
      capacity: typeof item.capacity === "number" ? item.capacity : null,
      spotsTaken: bookingCountsByClassId.get(item.id) ?? 0,
      spotsLeft:
        typeof item.capacity === "number"
          ? Math.max(0, item.capacity - (bookingCountsByClassId.get(item.id) ?? 0))
          : null,
      isFull:
        typeof item.capacity === "number"
          ? item.capacity - (bookingCountsByClassId.get(item.id) ?? 0) <= 0
          : false,
    });
  });

  const groups: WeekdayGroup[] = WEEKDAY_ORDER.map((day) => ({
    weekday: day,
    classes: (groupedMap.get(day) ?? []).sort(
      (a, b) => parseTimeToMinutes(a.startTime) - parseTimeToMinutes(b.startTime)
    ),
  })).filter((group) => group.classes.length > 0);

  return (
    <section className="relative w-full overflow-hidden bg-[#faf7fb] px-4 pb-8 pt-8 sm:px-6 sm:pb-10 sm:pt-10">
      <div className="mx-auto w-full max-w-5xl">
        <RecreationalClassesClient
          childId={child.id}
          childName={childName || "selected child"}
          ageBandLabel={ageBandLabel}
          groups={groups}
          initialSelectedClassIds={initialSelectedClassIds}
        />
      </div>
    </section>
  );
}
