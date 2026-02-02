"use client";

import { useMemo, useState } from "react";

const timetable = [
  {
    day: "Monday",
    sessions: [
      { title: "Recreational", age: "4-7 years", time: "4pm-5pm" },
      { title: "Recreational", age: "8+ years", time: "5pm-6pm" },
      { title: "Competition Class", age: "Invite only", time: "6pm-9pm" },
    ],
  },
  {
    day: "Tuesday",
    sessions: [
      { title: "Recreational", age: "4-7 years", time: "4pm-5pm" },
      { title: "Recreational", age: "8+ years", time: "5pm-6pm" },
      { title: "Competition Class", age: "Invite only", time: "6pm-9pm" },
    ],
  },
  {
    day: "Wednesday",
    sessions: [
      { title: "Development Class", age: "Invite only", time: "4pm-6pm" },
      { title: "Recreational", age: "4-7 years", time: "5:30pm-6:30pm" },
      { title: "Recreational", age: "4-7 years", time: "6pm-7pm" },
      { title: "Recreational", age: "8+ years", time: "6:30pm-7:30pm" },
      { title: "Recreational", age: "8+ years", time: "7pm-8pm" },
    ],
  },
  {
    day: "Thursday",
    sessions: [
      { title: "Recreational", age: "4-7 years", time: "4pm-5pm" },
      { title: "Recreational", age: "8+ years", time: "5pm-6pm" },
      { title: "Competition Class", age: "Invite only", time: "5:30pm-8:30pm" },
    ],
  },
  {
    day: "Friday",
    sessions: [
      { title: "Competition Class", age: "Invite only", time: "4pm-7pm" },
    ],
  },
  {
    day: "Saturday",
    sessions: [
      { title: "Recreational", age: "4-7 years", time: "9am-10am" },
      { title: "Recreational", age: "4-7 years", time: "9:30am-10:30am" },
      { title: "Recreational", age: "8+ years", time: "10am-11am" },
      { title: "Recreational", age: "8+ years", time: "10:30am-11:30am" },
      { title: "Recreational", age: "4-7 years", time: "12pm-1pm" },
      { title: "Competition Class", age: "Invite only", time: "12:30pm-2:30pm" },
    ],
  },
];

const filters = [
  { key: "all", label: "All" },
  { key: "recreational", label: "Recreational" },
  { key: "development", label: "Development" },
  { key: "competition", label: "Competition" },
  { key: "invite", label: "Invite only" },
];

const typeStyles: Record<string, string> = {
  recreational: "bg-[#ffe3f4] text-[#8a2d63]",
  development: "bg-[#e3f0ff] text-[#2a4a7a]",
  competition: "bg-[#e9ddff] text-[#4a267a]",
  invite: "bg-[#6c35c3] text-white",
};

const getType = (title: string) => {
  const lower = title.toLowerCase();
  if (lower.includes("competition")) return "competition";
  if (lower.includes("development")) return "development";
  return "recreational";
};

export default function TimetablePage() {
  const [activeFilter, setActiveFilter] = useState<string>("all");

  const filteredTimetable = useMemo(() => {
    return timetable
      .map((day) => {
        const sessions = day.sessions.filter((session) => {
          const type = getType(session.title);
          const isInvite = session.age.toLowerCase().includes("invite");
          if (activeFilter === "all") return true;
          if (activeFilter === "invite") return isInvite;
          return type === activeFilter;
        });
        return { ...day, sessions };
      })
      .filter((day) => day.sessions.length > 0);
  }, [activeFilter]);

  return (
    <section className="w-full px-6 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#2a0c4f]">Timetable</h1>
        <p className="mt-2 text-lg text-[#2a0c4f]/80">
          Weekly classes and sessions. Invite-only classes are noted.
        </p>
      </div>

      <div className="mb-6 flex flex-wrap gap-3">
        {filters.map((filter) => {
          const isActive = activeFilter === filter.key;
          const baseStyle =
            filter.key === "all"
              ? "bg-white text-[#2a0c4f] border border-[#6c35c3]/20"
              : typeStyles[filter.key];
          return (
            <button
              key={filter.key}
              type="button"
              onClick={() => setActiveFilter(filter.key)}
              className={[
                "rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200",
                "hover:-translate-y-0.5 hover:scale-105",
                isActive ? "ring-2 ring-[#de59b6]/60" : "opacity-90",
                baseStyle,
              ].join(" ")}
            >
              {filter.label}
            </button>
          );
        })}
      </div>

      <div className="rounded-3xl border border-[#6c35c3]/10 bg-white/70 p-4 shadow-sm">
        <div className="overflow-x-auto">
          <div className="grid w-full gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {filteredTimetable.map((day) => (
              <div key={day.day} className="rounded-2xl bg-white/80 p-4">
                <div className="mb-3 text-center text-lg font-bold text-[#5a1c9c]">
                  {day.day}
                </div>
                <div className="space-y-3">
                  {day.sessions.map((session, index) => {
                    const isInvite = session.age
                      .toLowerCase()
                      .includes("invite");
                    const type = getType(session.title);
                    return (
                      <div
                        key={`${session.title}-${session.time}-${index}`}
                        className="rounded-xl border border-[#6c35c3]/10 bg-white px-3 py-2"
                      >
                        <div
                          className={`mb-2 inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${typeStyles[type]}`}
                        >
                          {session.title.replace("Class", "").trim()}
                        </div>
                        <div className="text-sm font-bold text-[#2a0c4f]">
                          {session.time}
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[#2a0c4f]/80">
                          <span>{session.age}</span>
                          {isInvite ? (
                            <span className="rounded-full bg-[#6c35c3] px-2 py-0.5 font-semibold text-white">
                              Invite only
                            </span>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
        {filteredTimetable.length === 0 ? (
          <p className="mt-6 text-center text-sm text-[#2a0c4f]/70">
            No classes match this filter.
          </p>
        ) : null}
      </div>
    </section>
  );
}
