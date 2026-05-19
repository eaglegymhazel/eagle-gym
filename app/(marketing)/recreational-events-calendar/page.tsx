import EventsClient from "../events/EventsClient";
import { getCalendarEvents } from "@/lib/server/calendarEvents";

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
