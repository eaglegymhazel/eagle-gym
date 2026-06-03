import type { Metadata } from "next";
import EventsClient from "../events/EventsClient";
import { getCalendarEvents } from "@/lib/server/calendarEvents";

export const metadata: Metadata = {
  title: "Recreational Events Calendar",
  description:
    "View key recreational club dates, holiday sessions, and upcoming events at Eagle Gymnastics Academy.",
  alternates: {
    canonical: "/recreational-events-calendar",
  },
};

export default async function RecreationalEventsCalendarPage() {
  const events = await getCalendarEvents();

  return (
    <EventsClient
      events={events}
      title="Recreational Events Calendar"
      description="Key recreational club dates, holiday sessions, and important upcoming events."
    />
  );
}
