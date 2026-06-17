"use client";

import styles from "@/app/(portal)/(protected)/account/account.module.css";
import CalendarEventsManager from "@/components/admin/CalendarEventsManager";
import type {
  AdminCalendarEventFilterOptions,
  AdminCalendarEventRow,
} from "@/lib/server/adminCalendarEvents";

type CalendarEventsPanelProps = {
  initialEvents: AdminCalendarEventRow[];
  initialHasMore: boolean;
  initialNextOffset: number;
  initialFilterOptions: AdminCalendarEventFilterOptions;
  loadError: string | null;
};

export default function CalendarEventsPanel({
  initialEvents,
  initialHasMore,
  initialNextOffset,
  initialFilterOptions,
  loadError,
}: CalendarEventsPanelProps) {
  if (loadError) {
    return (
      <div className={styles.errorBanner} role="alert">
        <span>{loadError}</span>
      </div>
    );
  }

  return (
    <CalendarEventsManager
      initialEvents={initialEvents}
      initialHasMore={initialHasMore}
      initialNextOffset={initialNextOffset}
      initialFilterOptions={initialFilterOptions}
    />
  );
}
