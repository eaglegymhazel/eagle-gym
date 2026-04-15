import "server-only";

import { supabaseAdmin } from "@/lib/admin";
import type { Child } from "@/components/admin/mockChildren";
import type { RegisterClassTemplate } from "@/components/admin/sessionBuild";

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
  accTelNo: string | null;
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

type WaitlistEntryRow = {
  childId: string | null;
  classId: string | null;
  timestamp: string | null;
  status: string | null;
};

type WaitlistChildRow = {
  id: string;
  accountId: string | number | null;
  firstName: string | null;
  lastName: string | null;
};

type WaitlistClassRow = {
  id: string;
  className: string | null;
};

export type AdminWaitlistRow = {
  childId: string;
  classId: string;
  childName: string;
  className: string;
  accountEmail: string;
  accountTelNo: string;
  requestedOn: string;
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

export async function getAdminChildrenDirectory(): Promise<Child[]> {
  const children: ChildRow[] = [];
  for (let from = 0; ; from += QUERY_PAGE_SIZE) {
    const to = from + QUERY_PAGE_SIZE - 1;
    const { data: childRows, error: childError } = await supabaseAdmin
      .from("Children")
      .select("id,accountId,firstName,lastName,dateOfBirth")
      .order("created_at", { ascending: false })
      .range(from, to);

    if (childError) throw new Error(childError.message);

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

      if (accountError) throw new Error(accountError.message);

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

      if (bookingError) throw new Error(bookingError.message);
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
    } satisfies Child;
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

  return directory;
}

export async function getAdminRegisterClasses(): Promise<RegisterClassTemplate[]> {
  const { data: classesData, error: classesError } = await supabaseAdmin
    .from("Classes")
    .select(
      "id,className,weekday,startTime,endTime,durationMinutes,ageMin,ageMax,isCompetitionClass"
    )
    .order("className", { ascending: true });

  if (classesError) throw new Error(classesError.message);

  const classes = (classesData ?? []) as ClassRow[];
  const classIds = classes.map((row) => row.id);

  let bookings: BookingRow[] = [];
  if (classIds.length > 0) {
    const { data: bookingData, error: bookingError } = await supabaseAdmin
      .from("Bookings")
      .select("classId,status")
      .in("classId", classIds);

    if (bookingError) throw new Error(bookingError.message);
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

  return classes.map((row) => ({
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
}

export async function getAdminWaitlist(): Promise<AdminWaitlistRow[]> {
  const { data: waitlistData, error: waitlistError } = await supabaseAdmin
    .from("WaitlistEntries")
    .select("childId,classId,timestamp,status")
    .eq("status", "waiting")
    .order("timestamp", { ascending: true });

  if (waitlistError) throw new Error(waitlistError.message);

  const waitlistRows = (waitlistData ?? []) as WaitlistEntryRow[];
  if (waitlistRows.length === 0) return [];

  const childIds = [
    ...new Set(
      waitlistRows
        .map((row) => row.childId)
        .filter((id): id is string => typeof id === "string" && id.length > 0)
    ),
  ];
  const classIds = [
    ...new Set(
      waitlistRows
        .map((row) => row.classId)
        .filter((id): id is string => typeof id === "string" && id.length > 0)
    ),
  ];

  const childNameById = new Map<string, string>();
  const childAccountIdById = new Map<string, string>();
  if (childIds.length > 0) {
    for (const chunk of chunkArray(childIds, IN_CLAUSE_CHUNK_SIZE)) {
      const { data: childrenData, error: childrenError } = await supabaseAdmin
        .from("Children")
        .select("id,accountId,firstName,lastName")
        .in("id", chunk);
      if (childrenError) throw new Error(childrenError.message);

      (childrenData as WaitlistChildRow[] | null)?.forEach((row) => {
        const first = row.firstName?.trim() || "";
        const last = row.lastName?.trim() || "";
        const name = `${first} ${last}`.trim() || "Unknown child";
        childNameById.set(row.id, name);
        if (row.accountId != null) {
          childAccountIdById.set(row.id, String(row.accountId));
        }
      });
    }
  }

  const classNameById = new Map<string, string>();
  if (classIds.length > 0) {
    for (const chunk of chunkArray(classIds, IN_CLAUSE_CHUNK_SIZE)) {
      const { data: classesData, error: classesError } = await supabaseAdmin
        .from("Classes")
        .select("id,className")
        .in("id", chunk);
      if (classesError) throw new Error(classesError.message);

      (classesData as WaitlistClassRow[] | null)?.forEach((row) => {
        classNameById.set(row.id, row.className?.trim() || "Unknown class");
      });
    }
  }

  const accountIds = [...new Set(Array.from(childAccountIdById.values()))];
  const accountById = new Map<string, { email: string; accTelNo: string }>();
  if (accountIds.length > 0) {
    for (const chunk of chunkArray(accountIds, IN_CLAUSE_CHUNK_SIZE)) {
      const { data: accountsData, error: accountsError } = await supabaseAdmin
        .from("Accounts")
        .select("id,email,accTelNo")
        .in("id", chunk);
      if (accountsError) throw new Error(accountsError.message);

      (accountsData as AccountRow[] | null)?.forEach((row) => {
        accountById.set(String(row.id), {
          email: row.email?.trim() || "",
          accTelNo: row.accTelNo?.trim() || "",
        });
      });
    }
  }

  return waitlistRows
    .map((row) => {
      const childId = row.childId?.trim() ?? "";
      const classId = row.classId?.trim() ?? "";
      if (!childId || !classId) return null;

      const accountId = childAccountIdById.get(childId) ?? "";
      const account = accountById.get(accountId) ?? { email: "", accTelNo: "" };

      return {
        childId,
        classId,
        childName: childNameById.get(childId) ?? "Unknown child",
        className: classNameById.get(classId) ?? "Unknown class",
        accountEmail: account.email,
        accountTelNo: account.accTelNo,
        requestedOn: row.timestamp ?? "",
      } satisfies AdminWaitlistRow;
    })
    .filter((row): row is AdminWaitlistRow => row !== null);
}
