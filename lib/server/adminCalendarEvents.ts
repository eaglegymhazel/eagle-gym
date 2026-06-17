import "server-only";

import { supabaseAdmin } from "@/lib/admin";
import type { CalendarEventRow } from "./calendarEvents";

export type CalendarEventProgramme = "recreational" | "competition";

export type AdminCalendarEventRow = CalendarEventRow & {
  programme: CalendarEventProgramme;
};

export type AdminCalendarEventFilterOptions = {
  years: number[];
};

const CALENDAR_EVENT_SELECT =
  "id,eventDate:event_date,year,month,monthName:month_name,day,event,sourceFile:source_file,createdAt:created_at";

async function listCalendarTable(
  tableName: "calendar_events" | "calendar_events_competition",
  programme: CalendarEventProgramme,
  options?: { rangeEnd?: number; year?: number; month?: number }
): Promise<AdminCalendarEventRow[]> {
  let query = supabaseAdmin
    .from(tableName)
    .select(CALENDAR_EVENT_SELECT)
    .order("event_date", { ascending: true })
    .order("id", { ascending: true });

  if (typeof options?.year === "number") {
    query = query.eq("year", options.year);
  }

  if (typeof options?.month === "number") {
    query = query.eq("month", options.month);
  }

  if (typeof options?.rangeEnd === "number") {
    query = query.range(0, options.rangeEnd);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as CalendarEventRow[]).map((row) => ({
    ...row,
    programme,
  }));
}

export async function getAdminCalendarEvents(): Promise<AdminCalendarEventRow[]> {
  const [recreationalEvents, competitionEvents] = await Promise.all([
    listCalendarTable("calendar_events", "recreational"),
    listCalendarTable("calendar_events_competition", "competition"),
  ]);

  return [...recreationalEvents, ...competitionEvents].sort((a, b) => {
    const dateComparison = a.eventDate.localeCompare(b.eventDate);
    if (dateComparison !== 0) return dateComparison;
    return a.event.localeCompare(b.event, undefined, { sensitivity: "base" });
  });
}

export async function getAdminCalendarEventsPage({
  offset = 0,
  limit = 20,
  programme,
  year,
  month,
}: {
  offset?: number;
  limit?: number;
  programme?: CalendarEventProgramme;
  year?: number;
  month?: number;
} = {}): Promise<{ events: AdminCalendarEventRow[]; hasMore: boolean; nextOffset: number }> {
  const safeOffset = Math.max(0, Math.floor(offset));
  const safeLimit = Math.min(100, Math.max(1, Math.floor(limit)));
  const fetchCount = safeOffset + safeLimit + 1;
  const queryOptions = { rangeEnd: fetchCount - 1, year, month };

  const eventGroups = await Promise.all(
    [
      programme === "competition"
        ? null
        : listCalendarTable("calendar_events", "recreational", queryOptions),
      programme === "recreational"
        ? null
        : listCalendarTable("calendar_events_competition", "competition", queryOptions),
    ].filter((query): query is Promise<AdminCalendarEventRow[]> => query !== null)
  );

  const merged = eventGroups.flat().sort((a, b) => {
    const dateComparison = a.eventDate.localeCompare(b.eventDate);
    if (dateComparison !== 0) return dateComparison;
    return a.event.localeCompare(b.event, undefined, { sensitivity: "base" });
  });
  const events = merged.slice(safeOffset, safeOffset + safeLimit);

  return {
    events,
    hasMore: merged.length > safeOffset + safeLimit,
    nextOffset: safeOffset + events.length,
  };
}

async function listCalendarTableYears(
  tableName: "calendar_events" | "calendar_events_competition"
): Promise<number[]> {
  const { data, error } = await supabaseAdmin
    .from(tableName)
    .select("year")
    .order("year", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? [])
    .map((row) => row.year)
    .filter((year): year is number => Number.isInteger(year));
}

export async function getAdminCalendarEventFilterOptions(): Promise<AdminCalendarEventFilterOptions> {
  const [recreationalYears, competitionYears] = await Promise.all([
    listCalendarTableYears("calendar_events"),
    listCalendarTableYears("calendar_events_competition"),
  ]);

  return {
    years: Array.from(new Set([...recreationalYears, ...competitionYears])).sort((a, b) => a - b),
  };
}
