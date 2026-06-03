import type { Metadata } from "next";
import EventsClient from "../events/EventsClient";
import { getCompetitionCalendarEvents } from "@/lib/server/calendarEvents";

export const metadata: Metadata = {
  title: "Competition Events Calendar",
  description:
    "Competition dates, meet information, and upcoming events for the Eagle Gymnastics Academy competition programme.",
  alternates: {
    canonical: "/competition-events-calendar",
  },
};

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
