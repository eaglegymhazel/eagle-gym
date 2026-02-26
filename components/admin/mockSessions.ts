export type Session = {
  id: string;
  classId: string;
  className: string;
  programme: "Recreational" | "Competition";
  ageBand: string;
  location?: string;
  startAt: string;
  endAt: string;
  bookedCount: number;
};

type ClassTemplate = {
  classId: string;
  className: string;
  programme: "Recreational" | "Competition";
  ageBand: string;
  location: string;
  startHour: number;
  startMinute: number;
  durationMins: number;
};

const CLASS_TEMPLATES: ClassTemplate[] = [
  {
    classId: "rec-foundation",
    className: "Foundation Recreational",
    programme: "Recreational",
    ageBand: "4-7yrs",
    location: "Hall A",
    startHour: 15,
    startMinute: 30,
    durationMins: 60,
  },
  {
    classId: "rec-junior",
    className: "Junior Recreational",
    programme: "Recreational",
    ageBand: "8-11yrs",
    location: "Hall B",
    startHour: 16,
    startMinute: 30,
    durationMins: 60,
  },
  {
    classId: "rec-senior",
    className: "Senior Recreational",
    programme: "Recreational",
    ageBand: "12-18yrs",
    location: "Hall B",
    startHour: 17,
    startMinute: 30,
    durationMins: 60,
  },
  {
    classId: "comp-dev",
    className: "Competition Development",
    programme: "Competition",
    ageBand: "8-18yrs",
    location: "Hall C",
    startHour: 18,
    startMinute: 0,
    durationMins: 90,
  },
  {
    classId: "comp-squad",
    className: "Competition Squad",
    programme: "Competition",
    ageBand: "10-18yrs",
    location: "Hall C",
    startHour: 19,
    startMinute: 0,
    durationMins: 90,
  },
  {
    classId: "rec-open",
    className: "Open Recreational",
    programme: "Recreational",
    ageBand: "8-18yrs",
    location: "Hall A",
    startHour: 17,
    startMinute: 0,
    durationMins: 75,
  },
];

function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
}

function hash(value: string): number {
  let h = 0;
  for (let index = 0; index < value.length; index += 1) {
    h = (h * 31 + value.charCodeAt(index)) >>> 0;
  }
  return h;
}

export function generateMockSessions(days = 14): Session[] {
  const base = startOfToday();
  const sessions: Session[] = [];

  for (let dayOffset = 0; dayOffset < days; dayOffset += 1) {
    const dayDate = new Date(base);
    dayDate.setDate(base.getDate() + dayOffset);

    for (let slot = 0; slot < 6; slot += 1) {
      const template = CLASS_TEMPLATES[(dayOffset + slot) % CLASS_TEMPLATES.length];

      const start = new Date(dayDate);
      start.setHours(template.startHour, template.startMinute, 0, 0);

      const end = new Date(start);
      end.setMinutes(end.getMinutes() + template.durationMins);

      const id = `session-${dayOffset + 1}-${slot + 1}`;
      const bookedSeed = hash(`${template.classId}:${dayOffset}:${slot}`);
      const bookedCount = 8 + (bookedSeed % 16);

      sessions.push({
        id,
        classId: template.classId,
        className: template.className,
        programme: template.programme,
        ageBand: template.ageBand,
        location: template.location,
        startAt: start.toISOString(),
        endAt: end.toISOString(),
        bookedCount,
      });
    }
  }

  return sessions;
}

export const MOCK_SESSIONS: Session[] = generateMockSessions(14);
