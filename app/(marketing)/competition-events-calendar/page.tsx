import EventsClient from "../events/EventsClient";
import { getCompetitionCalendarEvents } from "@/lib/server/calendarEvents";

export default async function CompetitionEventsCalendarPage() {
  const events = await getCompetitionCalendarEvents();

  return (
    <EventsClient
      events={events}
      title="Competition Events Calendar"
      description="Competition dates, meet information, and important upcoming events for the competition programme."
    />
  );
}
