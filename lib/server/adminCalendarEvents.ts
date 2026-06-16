import "server-only";

import { supabaseAdmin } from "@/lib/admin";
import type { CalendarEventRow } from "./calendarEvents";

export type CalendarEventProgramme = "recreational" | "competition";

export type AdminCalendarEventRow = CalendarEventRow & {
  programme: CalendarEventProgramme;
};

const CALENDAR_EVENT_SELECT =
  "id,eventDate:event_date,year,month,monthName:month_name,day,event,sourceFile:source_file,createdAt:created_at";

async function listCalendarTable(
  tableName: "calendar_events" | "calendar_events_competition",
  programme: CalendarEventProgramme
): Promise<AdminCalendarEventRow[]> {
  const { data, error } = await supabaseAdmin
    .from(tableName)
    .select(CALENDAR_EVENT_SELECT)
    .order("event_date", { ascending: true })
    .order("id", { ascending: true });

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
