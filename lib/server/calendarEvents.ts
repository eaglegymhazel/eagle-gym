import "server-only";

import { unstable_cache } from "next/cache";
import { createServerClient } from "@supabase/ssr";

export type CalendarEventRow = {
  id: number;
  eventDate: string;
  year: number;
  month: number;
  monthName: string;
  day: number;
  event: string;
  sourceFile: string | null;
  createdAt: string;
};

function createCalendarEventsFetcher(
  tableName: "calendar_events" | "calendar_events_competition",
  cacheKey: string,
) {
  return unstable_cache(
    async (): Promise<CalendarEventRow[]> => {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

      if (!supabaseUrl || !supabaseServiceRoleKey) {
        throw new Error("Supabase environment variables are not configured.");
      }

      const supabase = createServerClient(supabaseUrl, supabaseServiceRoleKey, {
        cookies: {
          getAll() {
            return [];
          },
          setAll() {},
        },
      });

      const { data, error } = await supabase
        .from(tableName)
        .select(
          "id,eventDate:event_date,year,month,monthName:month_name,day,event,sourceFile:source_file,createdAt:created_at"
        )
        .order("event_date", { ascending: true });

      if (error) {
        throw new Error(error.message);
      }

      return (data ?? []) as CalendarEventRow[];
    },
    [cacheKey],
    { revalidate: 300 }
  );
}

const getCalendarEventsCached = createCalendarEventsFetcher(
  "calendar_events",
  "calendar-events-catalog"
);
const getCompetitionCalendarEventsCached = createCalendarEventsFetcher(
  "calendar_events_competition",
  "calendar-events-competition-catalog"
);

export async function getCalendarEvents(): Promise<CalendarEventRow[]> {
  return getCalendarEventsCached();
}

export async function getCompetitionCalendarEvents(): Promise<CalendarEventRow[]> {
  return getCompetitionCalendarEventsCached();
}
