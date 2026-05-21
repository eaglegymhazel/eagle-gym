"use client";

import { useMemo, useState } from "react";

export type TimetableSession = {
  title: string;
  age: string;
  startTime: string;
  time: string;
  duration: string;
  isSpecial?: boolean;
};

export type TimetableDay = {
  day: string;
  sessions: TimetableSession[];
};

type TimetableClientProps = {
  timetable: TimetableDay[];
};

const filters = [
  { key: "all", label: "All" },
  { key: "recreational", label: "Recreational" },
  { key: "competition", label: "Competition" },
  { key: "special", label: "Special" },
] as const;

const weekdayFilters = [
  "All days",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

type RecreationalAgeGroup = "Preschool" | "4-7 years" | "8-18 years";
type SessionType = "recreational" | "competition" | "special";

const typeStyles: Record<
  SessionType,
  { badge: string; rail: string; dot: string; text: string }
> = {
  recreational: {
    badge: "bg-[#ecfaf1] text-[#138a4b] border-[#b7e6ca]",
    rail: "bg-[#138a4b]",
    dot: "bg-[#138a4b]",
    text: "text-[#138a4b]",
  },
  competition: {
    badge: "bg-[#fff8df] text-[#9a7200] border-[#efd98d]",
    rail: "bg-[#d8a514]",
    dot: "bg-[#d8a514]",
    text: "text-[#9a7200]",
  },
  special: {
    badge: "bg-[#eef4ff] text-[#1e4fbf] border-[#bfd3ff]",
    rail: "bg-[#2563eb]",
    dot: "bg-[#2563eb]",
    text: "text-[#1e4fbf]",
  },
};

const specialIcon = (
  <span aria-hidden="true" className="inline-flex h-3.5 w-3.5 items-center justify-center text-[#2563eb]">
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current">
      <path d="M12 2.6l2.77 5.61 6.19.9-4.48 4.37 1.06 6.17L12 17.3 6.46 19.7l1.06-6.17L3.04 9.11l6.19-.9L12 2.6z" />
    </svg>
  </span>
);

const getType = (session: TimetableSession): SessionType => {
  if (session.isSpecial) return "special";
  const lower = session.title.toLowerCase();
  if (lower.includes("competition")) return "competition";
  return "recreational";
};

function normalizeAgeLabel(label: string): string {
  const lower = label.toLowerCase().replace(/\s+/g, " ").trim();
  if (
    lower.includes("1.5-3") ||
    lower.includes("1.5 - 3") ||
    lower.includes("18 months") ||
    lower.includes("18months")
  ) {
    return "Preschool";
  }
  return label;
}

function recreationalAgeBucket(label: string): RecreationalAgeGroup | null {
  const normalized = normalizeAgeLabel(label);
  if (normalized === "Preschool") return "Preschool";
  if (normalized === "4-7 years") return "4-7 years";
  if (normalized === "8-18 years") return "8-18 years";
  return null;
}

function getClassLabel(type: SessionType): string {
  if (type === "special") return "Special";
  if (type === "competition") return "Competition";
  return "Recreational";
}

function SessionRow({ session }: { session: TimetableSession }) {
  const type = getType(session);
  const styles = typeStyles[type];
  const label = getClassLabel(type);
  const ageLabel = type === "recreational" ? normalizeAgeLabel(session.age) : null;

  return (
    <article className="relative overflow-hidden rounded-xl border border-[#ddd3eb] bg-white px-3 py-2.5 shadow-[0_12px_28px_-26px_rgba(41,22,67,0.6)]">
      <span aria-hidden="true" className={`absolute inset-y-0 left-0 w-[4px] ${styles.rail}`} />
      <div className="flex items-start justify-between gap-3 pl-2">
        <div className="min-w-0 flex-1">
          <p className="text-[18px] font-extrabold leading-none tracking-[-0.01em] text-[#251341]">
            {session.startTime}
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] font-semibold text-[#2a0c4f]/72">
            <span
              className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] ${styles.badge}`}
            >
              {type === "special" ? specialIcon : <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${styles.dot}`} />}
              {label}
            </span>
            <span>{session.duration}</span>
            {ageLabel ? <span>{ageLabel}</span> : null}
          </div>
        </div>
        <p className="shrink-0 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6b5c85]">
          {session.time}
        </p>
      </div>
    </article>
  );
}

export default function TimetableClient({ timetable }: TimetableClientProps) {
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [activeAgeGroup, setActiveAgeGroup] = useState<"all" | RecreationalAgeGroup>("all");
  const [activeWeekday, setActiveWeekday] = useState<string>("All days");

  const recreationalAgeGroups = useMemo(() => {
    const groups = new Set<RecreationalAgeGroup>();
    timetable.forEach((day) => {
      day.sessions.forEach((session) => {
        if (getType(session) === "recreational") {
          const bucket = recreationalAgeBucket(session.age);
          if (bucket) groups.add(bucket);
        }
      });
    });
    const order = ["Preschool", "4-7 years", "8-18 years"] as const;
    return order.filter((value) => groups.has(value));
  }, [timetable]);

  const effectiveAgeFilter =
    activeFilter === "recreational" &&
    activeAgeGroup !== "all" &&
    recreationalAgeGroups.includes(activeAgeGroup)
      ? activeAgeGroup
      : "all";

  const filteredTimetable = useMemo(() => {
    return timetable
      .map((day) => {
        const sessions = day.sessions.filter((session) => {
          const type = getType(session);
          if (activeFilter === "all") return true;
          if (activeFilter === "special") return type === "special";
          if (activeFilter === "recreational") {
            if (type !== "recreational") return false;
            if (effectiveAgeFilter === "all") return true;
            return recreationalAgeBucket(session.age) === effectiveAgeFilter;
          }
          return type === "competition";
        });
        return { ...day, sessions };
      })
      .filter((day) => activeWeekday === "All days" || day.day === activeWeekday)
      .filter((day) => day.sessions.length > 0);
  }, [activeFilter, activeWeekday, effectiveAgeFilter, timetable]);

  const hasNoResults = filteredTimetable.length === 0;

  return (
    <section className="mx-auto w-full max-w-[1500px] px-4 pb-10 pt-7 sm:px-6 sm:pb-12 sm:pt-9 lg:px-8">
      <header className="mb-5 space-y-3">
        <h1 className="max-w-3xl text-[clamp(34px,4.2vw,58px)] font-extrabold leading-[0.96] tracking-[0.01em] text-[#143271]">
          Weekly Timetable
        </h1>
        <p className="max-w-2xl text-sm leading-7 text-[#2E2A33]/78 sm:text-base">
          A quick weekly overview of when classes run across the club.
        </p>
      </header>

      <div className="mb-5 rounded-2xl border border-[#dfd3e8] bg-white/90 px-3 py-3 shadow-[0_16px_36px_-30px_rgba(48,24,83,0.48)] backdrop-blur sm:px-4 sm:py-4">
        <div className="space-y-3">
          <div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.08em] text-[#5f5177]">
              Class type
            </p>
            <div className="flex flex-wrap gap-2">
              {filters.map((filter) => {
                const isActive = activeFilter === filter.key;
                const baseStyle =
                  filter.key === "all"
                    ? isActive
                      ? "border-[#6c35c3]/35 bg-[#efe8fb] text-[#41216f] ring-1 ring-[#6c35c3]/15"
                      : "border-[#d9d1e8] bg-white text-[#2a0c4f] hover:border-[#cdbfe4] hover:bg-[#faf7ff]"
                    : filter.key === "recreational"
                      ? isActive
                        ? "border-[#138a4b]/35 bg-[#dff5e8] text-[#106f3d] ring-1 ring-[#138a4b]/20"
                        : "border-[#d9d1e8] bg-white text-[#138a4b] hover:border-[#b7e6ca] hover:bg-[#f4fbf7]"
                      : filter.key === "competition"
                        ? isActive
                          ? "border-[#c89200]/35 bg-[#fff7de] text-[#8f6900] ring-1 ring-[#e0b21a]/26"
                          : "border-[#d9d1e8] bg-white text-[#9a7200] hover:border-[#f1dd8b] hover:bg-[#fffdf4]"
                        : isActive
                          ? "border-[#2563eb]/35 bg-[#eaf1ff] text-[#1e4fbf] ring-1 ring-[#2563eb]/24"
                          : "border-[#d9d1e8] bg-white text-[#1e4fbf] hover:border-[#bfd3ff] hover:bg-[#f5f8ff]";
                const dotStyle =
                  filter.key === "all"
                    ? "bg-[#7a6a98]"
                    : filter.key === "special"
                      ? "bg-[#2563eb]"
                      : typeStyles[filter.key].dot;

                return (
                  <button
                    key={filter.key}
                    type="button"
                    onClick={() => {
                      setActiveFilter(filter.key);
                      if (filter.key !== "recreational") {
                        setActiveAgeGroup("all");
                      }
                    }}
                    className={[
                      "inline-flex min-h-9 items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold transition-all duration-160",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6c35c3]/45 focus-visible:ring-offset-2",
                      isActive ? "shadow-[0_8px_20px_-18px_rgba(31,18,57,0.5)]" : "",
                      baseStyle,
                    ].join(" ")}
                  >
                    {filter.key === "special" ? (
                      specialIcon
                    ) : (
                      <span aria-hidden="true" className={`h-2 w-2 rounded-full ${dotStyle}`} />
                    )}
                    {filter.label}
                  </button>
                );
              })}
            </div>
          </div>

          {activeFilter === "recreational" ? (
            <div>
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.08em] text-[#5f5177]">
                Age group
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setActiveAgeGroup("all")}
                  className={[
                    "inline-flex min-h-8 items-center rounded-full border px-3 py-1.5 text-[11px] font-bold transition-all duration-160",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#138a4b]/40 focus-visible:ring-offset-2",
                    activeAgeGroup === "all"
                      ? "border-[#138a4b]/30 bg-[#dff5e8] text-[#106f3d] ring-1 ring-[#138a4b]/18"
                      : "border-[#d9d1e8] bg-white text-[#138a4b] hover:border-[#b7e6ca] hover:bg-[#f4fbf7]",
                  ].join(" ")}
                >
                  All ages
                </button>
                {recreationalAgeGroups.map((age) => {
                  const isActive = activeAgeGroup === age;
                  return (
                    <button
                      key={age}
                      type="button"
                      onClick={() => setActiveAgeGroup(age)}
                      className={[
                        "inline-flex min-h-8 items-center rounded-full border px-3 py-1.5 text-[11px] font-bold transition-all duration-160",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#138a4b]/40 focus-visible:ring-offset-2",
                        isActive
                          ? "border-[#138a4b]/30 bg-[#dff5e8] text-[#106f3d] ring-1 ring-[#138a4b]/18"
                          : "border-[#d9d1e8] bg-white text-[#138a4b] hover:border-[#b7e6ca] hover:bg-[#f4fbf7]",
                      ].join(" ")}
                    >
                      {age}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          <div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.08em] text-[#5f5177]">
              Day
            </p>
            <div className="flex flex-wrap gap-2">
              {weekdayFilters.map((day) => {
                const isActive = activeWeekday === day;
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => setActiveWeekday(day)}
                    className={[
                      "inline-flex min-h-8 items-center justify-center rounded-full border px-3 py-1.5 text-[11px] font-bold transition-all duration-160",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6c35c3]/35 focus-visible:ring-offset-2",
                      isActive
                        ? "border-[#6c35c3]/30 bg-[#efe8fb] text-[#41216f]"
                        : "border-[#d9d1e8] bg-white text-[#554579] hover:border-[#cdbfe4] hover:bg-[#faf7ff]",
                    ].join(" ")}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {hasNoResults ? (
        <div className="rounded-2xl border border-dashed border-[#6c35c3]/20 bg-[#faf5ff] px-5 py-9 text-center">
          <p className="text-base font-semibold text-[#2a0c4f]">No sessions match this filter.</p>
          <p className="mt-2 text-sm text-[#2a0c4f]/75">
            Try another class type or clear your filters to view all sessions.
          </p>
          <div className="mt-5">
            <button
              type="button"
              onClick={() => {
                setActiveFilter("all");
                setActiveAgeGroup("all");
                setActiveWeekday("All days");
              }}
              className="inline-flex items-center rounded-full bg-[#6c35c3] px-4 py-2 text-xs font-semibold uppercase tracking-[0.06em] text-white transition-colors duration-160 hover:bg-[#5f2eb6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6c35c3]/40 focus-visible:ring-offset-2"
            >
              Clear filters
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="hidden md:grid md:grid-cols-2 md:items-start md:gap-3 xl:grid-cols-6">
            {filteredTimetable.map((day) => (
              <section
                key={day.day}
                className="rounded-2xl border border-[#ddd3eb] bg-white px-3 py-3 shadow-[0_14px_32px_-28px_rgba(52,24,86,0.5)]"
                aria-label={`${day.day} sessions`}
              >
                <div className="mb-3 flex items-center justify-between gap-2 border-b border-[#ece2f4] pb-2">
                  <h2 className="text-base font-extrabold tracking-[0.01em] text-[#143271]">
                    {day.day}
                  </h2>
                  <span className="rounded-full bg-[#f4efff] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-[#5f2eb6]">
                    {day.sessions.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {day.sessions.map((session, index) => (
                    <SessionRow
                      key={`${day.day}-${session.title}-${session.time}-${index}`}
                      session={session}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>

          <div className="space-y-4 md:hidden">
            {filteredTimetable.map((day) => (
              <section key={`mobile-${day.day}`} className="rounded-2xl border border-[#ddd3eb] bg-white px-3 py-3 shadow-[0_14px_32px_-28px_rgba(52,24,86,0.45)]">
                <div className="mb-3 flex items-center justify-between gap-2 border-b border-[#ece2f4] pb-2">
                  <h2 className="text-base font-extrabold tracking-[0.01em] text-[#143271]">
                    {day.day}
                  </h2>
                  <span className="rounded-full bg-[#f4efff] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-[#5f2eb6]">
                    {day.sessions.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {day.sessions.map((session, index) => (
                    <SessionRow
                      key={`${day.day}-${session.title}-${session.time}-${index}`}
                      session={session}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
