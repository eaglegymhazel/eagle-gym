import { redirect } from "next/navigation";
import { getBookingContext } from "@/lib/server/bookingContext";
import { getActiveBookingCountsForClassIds } from "@/lib/server/availability";
import { getCompetitionClasses, type RecreationalClassRow } from "@/lib/server/classes";
import CompetitionClassesClient from "./CompetitionClassesClient";
import type { WeekdayGroup } from "../recreational/types";

type SearchParams = {
  childId?: string;
  classIds?: string;
};

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
    (today.getMonth() === birthDate.getMonth() && today.getDate() >= birthDate.getDate());

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

function isEligibleForAge(item: RecreationalClassRow, childAge: number | null): boolean {
  if (childAge == null) return false;
  const min = toNullableNumber(item.minAge) ?? -Infinity;
  const max = toNullableNumber(item.maxAge) ?? Infinity;
  return min <= childAge && childAge <= max;
}

function getAgeGroupLabel(childAge: number | null): string {
  if (childAge == null) return "Age unavailable";
  if (childAge <= 3) return "18 months to 3 years";
  if (childAge <= 7) return "4 to 7 years";
  return "8 to 18 years";
}

export default async function CompetitionBookingPage({
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

  const bookingContext = await getBookingContext();
  if (bookingContext.status !== "existing") {
    redirect("/book");
  }

  const children = bookingContext.children;
  const child = children.find((item) => item.id === childId);
  if (!child?.id) {
    redirect("/book");
  }

  const childName = `${child.firstName ?? ""} ${child.lastName ?? ""}`.trim();
  const childAge = computeAge(child.dateOfBirth ?? null);
  const ageGroupLabel = getAgeGroupLabel(childAge);

  const rows = await getCompetitionClasses();
  const eligible = rows.filter((item) => isEligibleForAge(item, childAge));
  const eligibleClassIds = eligible.map((item) => item.id);
  const bookingCountsByClassId = await getActiveBookingCountsForClassIds(eligibleClassIds);

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
    <section className="relative w-full overflow-hidden bg-[#faf7fb] px-4 pb-8 pt-4 sm:px-6 sm:pb-10 sm:pt-6">
      <div className="pointer-events-none absolute inset-0 hidden lg:block">
        <div className="absolute inset-y-0 left-0 right-[calc(50%+32rem)]">
          <div className="absolute inset-y-[7%] left-2 w-px bg-[#6c35c3]/22" />
          <div className="absolute inset-y-[15%] left-6 w-px bg-[#6c35c3]/10" />
          <div className="absolute inset-y-[10%] left-12 w-[2px] bg-[#6c35c3]/18" />
          <div className="absolute inset-y-[20%] left-[74px] w-px bg-[#6c35c3]/8" />
        </div>
        <div className="absolute inset-y-0 left-[calc(50%+32rem)] right-0">
          <div className="absolute inset-y-[8%] right-2 w-px bg-[#6c35c3]/20" />
          <div className="absolute inset-y-[13%] right-7 w-[2px] bg-[#6c35c3]/26" />
          <div className="absolute inset-y-[22%] right-12 w-px bg-[#6c35c3]/9" />
        </div>
      </div>
      <div className="relative z-10 mx-auto w-full max-w-5xl">
        <CompetitionClassesClient
          childId={child.id}
          childName={childName || "selected child"}
          ageGroupLabel={ageGroupLabel}
          groups={groups}
          initialSelectedClassIds={initialSelectedClassIds}
        />
      </div>
    </section>
  );
}
