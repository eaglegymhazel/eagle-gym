import type { Session } from "./mockSessions";

export type RegisterClassTemplate = {
  id: string;
  className: string;
  programme: "Recreational" | "Competition";
  ageBand: string;
  weekday: string | number | null;
  startTime: string | null;
  endTime: string | null;
  durationMinutes: number | null;
  location?: string;
  enrolledCount: number;
};

const LONDON_TZ = "Europe/London";

function parseTime(value: string | null): { hour: number; minute: number } | null {
  if (!value) return null;
  const [h, m] = value.split(":");
  const hour = Number.parseInt(h ?? "", 10);
  const minute = Number.parseInt(m ?? "", 10);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  return { hour, minute };
}

function getOffsetMinutes(timeZone: string, date: Date): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    timeZoneName: "shortOffset",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const offsetToken = parts.find((part) => part.type === "timeZoneName")?.value ?? "GMT";
  const match = offsetToken.match(/^GMT([+-]\d{1,2})(?::?(\d{2}))?$/);
  if (!match) return 0;
  const hours = Number.parseInt(match[1] ?? "0", 10);
  const minutes = Number.parseInt(match[2] ?? "0", 10);
  const sign = hours >= 0 ? 1 : -1;
  return hours * 60 + sign * minutes;
}

function londonLocalToUtc(dayKey: string, hour: number, minute: number): Date {
  const [yearRaw, monthRaw, dayRaw] = dayKey.split("-");
  const year = Number.parseInt(yearRaw ?? "", 10);
  const month = Number.parseInt(monthRaw ?? "", 10);
  const day = Number.parseInt(dayRaw ?? "", 10);
  const baseUtc = Date.UTC(year, month - 1, day, hour, minute, 0, 0);

  let utc = baseUtc;
  for (let i = 0; i < 2; i += 1) {
    const offset = getOffsetMinutes(LONDON_TZ, new Date(utc));
    utc = baseUtc - offset * 60_000;
  }

  return new Date(utc);
}

function dayKeyInLondon(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: LONDON_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value ?? "1970";
  const month = parts.find((part) => part.type === "month")?.value ?? "01";
  const day = parts.find((part) => part.type === "day")?.value ?? "01";
  return `${year}-${month}-${day}`;
}

function weekdayNameInLondon(dayKey: string): string {
  const date = new Date(`${dayKey}T12:00:00.000Z`);
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: LONDON_TZ,
    weekday: "long",
  }).format(date);
}

function normalizeWeekday(value: string | number | null): string | null {
  if (value == null) return null;
  if (typeof value === "number") {
    if (value >= 1 && value <= 7) {
      const mondayFirst = [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ] as const;
      return mondayFirst[value - 1];
    }
    if (value >= 0 && value <= 6) {
      const sundayFirst = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ] as const;
      return sundayFirst[value];
    }
    return null;
  }
  const lower = value.trim().toLowerCase();
  const map: Record<string, string> = {
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
  return map[lower] ?? null;
}

function nextLondonDayKeys(days: number): string[] {
  const keys: string[] = [];
  const start = new Date();
  for (let i = 0; i < days; i += 1) {
    const date = new Date(start.getTime() + i * 24 * 60 * 60 * 1000);
    keys.push(dayKeyInLondon(date));
  }
  return [...new Set(keys)];
}

export function buildUpcomingSessions(
  templates: RegisterClassTemplate[],
  days = 14
): Session[] {
  const dayKeys = nextLondonDayKeys(days);
  const sessions: Session[] = [];

  templates.forEach((template) => {
    const weekday = normalizeWeekday(template.weekday);
    const startTime = parseTime(template.startTime);
    if (!weekday || !startTime) return;

    dayKeys.forEach((key) => {
      if (weekdayNameInLondon(key) !== weekday) return;

      const start = londonLocalToUtc(key, startTime.hour, startTime.minute);

      let end: Date;
      const parsedEnd = parseTime(template.endTime);
      if (parsedEnd) {
        end = londonLocalToUtc(key, parsedEnd.hour, parsedEnd.minute);
        if (end <= start) {
          end = new Date(end.getTime() + 24 * 60 * 60 * 1000);
        }
      } else {
        const duration = template.durationMinutes ?? 60;
        end = new Date(start.getTime() + duration * 60 * 1000);
      }

      sessions.push({
        id: `${template.id}-${key}-${template.startTime ?? "00:00"}`,
        classId: template.id,
        className: template.className,
        programme: template.programme,
        ageBand: template.ageBand,
        location: template.location,
        startAt: start.toISOString(),
        endAt: end.toISOString(),
        bookedCount: template.enrolledCount,
      });
    });
  });

  sessions.sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
  return sessions;
}
