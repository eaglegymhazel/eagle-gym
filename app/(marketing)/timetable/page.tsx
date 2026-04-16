import {
  getCompetitionClasses,
  getRecreationalClasses,
  type RecreationalClassRow,
} from "@/lib/server/classes";
import TimetableClient, { type TimetableDay } from "./TimetableClient";

const WEEKDAY_ORDER = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

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

function formatAgeLabel(minAge: number | string | null, maxAge: number | string | null): string {
  const min = toNullableNumber(minAge);
  const max = toNullableNumber(maxAge);

  const formatAge = (value: number) => {
    if (Number.isInteger(value)) return String(value);
    return String(value);
  };

  if (min == null && max == null) return "All ages";
  if (min != null && max != null) {
    if (min === max) return `${formatAge(min)} years`;
    return `${formatAge(min)}-${formatAge(max)} years`;
  }
  if (min != null) return `${formatAge(min)}+ years`;
  return `Up to ${formatAge(max ?? 0)} years`;
}

function formatTimePart(value: string | null): string {
  if (!value) return "";
  const parts = value.split(":");
  const rawHours = Number.parseInt(parts[0] ?? "", 10);
  const rawMinutes = Number.parseInt(parts[1] ?? "", 10);
  if (Number.isNaN(rawHours) || Number.isNaN(rawMinutes)) return "";

  const suffix = rawHours >= 12 ? "pm" : "am";
  const hour12 = rawHours % 12 === 0 ? 12 : rawHours % 12;
  if (rawMinutes === 0) return `${hour12}${suffix}`;
  return `${hour12}:${String(rawMinutes).padStart(2, "0")}${suffix}`;
}

function formatTimeRange(startTime: string | null, endTime: string | null): string {
  const start = formatTimePart(startTime);
  const end = formatTimePart(endTime);
  if (start && end) return `${start}-${end}`;
  if (start) return start;
  return "Time TBC";
}

function formatDuration(minutes: number | string | null): string {
  const parsed =
    typeof minutes === "number"
      ? minutes
      : typeof minutes === "string"
        ? Number.parseInt(minutes, 10)
        : null;

  if (!parsed || !Number.isFinite(parsed)) return "Duration TBC";
  if (parsed < 60) return `${parsed} mins`;

  const hours = Math.floor(parsed / 60);
  const remainingMinutes = parsed % 60;
  if (remainingMinutes === 0) return `${hours} ${hours === 1 ? "hour" : "hours"}`;
  return `${hours}h ${remainingMinutes}m`;
}

function toTimetable(rows: RecreationalClassRow[]): TimetableDay[] {
  const groupedMap = new Map<string, TimetableDay["sessions"]>();
  WEEKDAY_ORDER.forEach((day) => {
    groupedMap.set(day, []);
  });

  const weekdayOrderMap = new Map<string, number>(
    WEEKDAY_ORDER.map((day, index) => [day, index]),
  );

  const sortedRows = [...rows].sort((a, b) => {
    const dayA = normalizeWeekday(a.weekday);
    const dayB = normalizeWeekday(b.weekday);
    const dayOrderA = dayA ? (weekdayOrderMap.get(dayA) ?? 99) : 99;
    const dayOrderB = dayB ? (weekdayOrderMap.get(dayB) ?? 99) : 99;
    if (dayOrderA !== dayOrderB) return dayOrderA - dayOrderB;
    return parseTimeToMinutes(a.startTime) - parseTimeToMinutes(b.startTime);
  });

  sortedRows.forEach((item) => {
    const day = normalizeWeekday(item.weekday);
    if (!day) return;
    const bucket = groupedMap.get(day);
    if (!bucket) return;

    const isCompetition = item.isCompetitionClass === true;

    bucket.push({
      title: isCompetition ? "Competition Class" : "Recreational",
      age: formatAgeLabel(item.minAge, item.maxAge),
      startTime: formatTimePart(item.startTime) || "Time TBC",
      time: formatTimeRange(item.startTime, item.endTime),
      duration: formatDuration(item.durationMinutes),
      isSpecial: (item.name ?? "").toLowerCase().includes("display"),
    });
  });

  return WEEKDAY_ORDER.map((day) => ({
    day,
    sessions: groupedMap.get(day) ?? [],
  })).filter((entry) => entry.sessions.length > 0);
}

export default async function TimetablePage() {
  const [recreationalRows, competitionRows] = await Promise.all([
    getRecreationalClasses(),
    getCompetitionClasses(),
  ]);

  const timetable = toTimetable([...recreationalRows, ...competitionRows]);

  return <TimetableClient timetable={timetable} />;
}
