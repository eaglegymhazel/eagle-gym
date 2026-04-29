import EventsClient from "./EventsClient";
import { getCalendarEvents } from "@/lib/server/calendarEvents";

export default async function EventsPage() {
  const events = await getCalendarEvents();

  return <EventsClient events={events} />;
}
