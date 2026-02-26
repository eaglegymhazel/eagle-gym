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

export function getSessionStartIso(params: {
  sessionDate: string;
  startTime: string | null;
  endTime: string | null;
}): string | null {
  const start = parseTime(params.startTime);
  const end = parseTime(params.endTime);
  if (!start && !end) return null;
  const first = start ?? end;
  if (!first) return null;
  return londonLocalToUtc(params.sessionDate, first.hour, first.minute).toISOString();
}

export function isBeforeSaveWindow(params: {
  sessionDate: string;
  startTime: string | null;
  endTime: string | null;
  leadMinutes?: number;
  now?: Date;
}): boolean {
  const startIso = getSessionStartIso(params);
  if (!startIso) return false;
  const leadMinutes = params.leadMinutes ?? 15;
  const openAt = new Date(new Date(startIso).getTime() - leadMinutes * 60_000);
  const now = params.now ?? new Date();
  return now.getTime() < openAt.getTime();
}

export function getRegisterCutoffIso(params: {
  sessionDate: string;
  startTime: string | null;
  endTime: string | null;
  durationMinutes: number | null;
  lockHours?: number;
}): string | null {
  const start = parseTime(params.startTime);
  const end = parseTime(params.endTime);
  if (!start && !end) return null;

  const startAt = londonLocalToUtc(params.sessionDate, (start ?? end)!.hour, (start ?? end)!.minute);
  const endAt = end
    ? londonLocalToUtc(params.sessionDate, end.hour, end.minute)
    : new Date(startAt.getTime() + (params.durationMinutes ?? 60) * 60_000);
  const safeEndAt = endAt > startAt ? endAt : new Date(startAt.getTime() + (params.durationMinutes ?? 60) * 60_000);
  const lockHours = params.lockHours ?? 2;
  const cutoff = new Date(safeEndAt.getTime() + lockHours * 60 * 60 * 1000);
  return cutoff.toISOString();
}

export function isRegisterLocked(params: {
  sessionDate: string;
  startTime: string | null;
  endTime: string | null;
  durationMinutes: number | null;
  lockHours?: number;
  now?: Date;
}): boolean {
  const cutoffIso = getRegisterCutoffIso(params);
  if (!cutoffIso) return false;
  const now = params.now ?? new Date();
  return now.getTime() > new Date(cutoffIso).getTime();
}
