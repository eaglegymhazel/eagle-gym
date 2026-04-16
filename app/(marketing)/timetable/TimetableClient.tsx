"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/app/components/auth/AuthProvider";

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
];

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

const typeStyles: Record<string, { pill: string; rail: string; dot: string }> = {
  recreational: {
    pill: "bg-[#ecfaf1] text-[#138a4b] border-[#b7e6ca]",
    rail: "bg-[#138a4b]",
    dot: "bg-[#138a4b]",
  },
  competition: {
    pill: "bg-[#fffbea] text-[#9a7200] border-[#f1dd8b]",
    rail: "bg-[#e0b21a]",
    dot: "bg-[#e0b21a]",
  },
  special: {
    pill: "bg-[#eef4ff] text-[#1e4fbf] border-[#bfd3ff]",
    rail: "bg-[#2563eb]",
    dot: "bg-[#2563eb]",
  },
};

const getType = (session: TimetableSession): "recreational" | "competition" | "special" => {
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

function getClassLabel(type: "recreational" | "competition" | "special"): string {
  if (type === "special") return "Special";
  if (type === "competition") return "Competition";
  return "Recreational";
}

export default function TimetableClient({ timetable }: TimetableClientProps) {
  const { user } = useAuth();
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [activeAgeGroup, setActiveAgeGroup] = useState<"all" | RecreationalAgeGroup>("all");
  const [activeWeekday, setActiveWeekday] = useState<string>("All days");
  const [viewMode, setViewMode] = useState<"day" | "list">("list");
  const classLinkHref = user ? "/account" : "/login";

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
          if (activeFilter === "special") return !!session.isSpecial;
          if (activeFilter === "recreational") {
            if (type !== "recreational") return false;
            if (effectiveAgeFilter === "all") return true;
            return recreationalAgeBucket(session.age) === effectiveAgeFilter;
          }
          return type === activeFilter;
        });
        return { ...day, sessions };
      })
      .filter((day) => activeWeekday === "All days" || day.day === activeWeekday)
      .filter((day) => day.sessions.length > 0);
  }, [activeFilter, activeWeekday, effectiveAgeFilter, timetable]);

  const showEmptyState = filteredTimetable.length === 0;

  const specialIcon = (
    <span aria-hidden="true" className="inline-flex h-3.5 w-3.5 items-center justify-center text-[#2563eb]">
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current">
        <path d="M12 2.6l2.77 5.61 6.19.9-4.48 4.37 1.06 6.17L12 17.3 6.46 19.7l1.06-6.17L3.04 9.11l6.19-.9L12 2.6z" />
      </svg>
    </span>
  );

  return (
    <section className="mx-auto w-full max-w-[1500px] px-4 pb-12 pt-8 sm:px-6 sm:pt-10 lg:px-8">
      <header className="mb-2">
        <div>
          <h1 className="max-w-3xl text-[clamp(36px,4.5vw,62px)] font-extrabold leading-[0.95] tracking-[0.01em] text-[#143271]">
            Weekly Timetable
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-[1.75] text-[#2E2A33]/78 sm:text-[17px]">
            Browse recreational and competition sessions by time and day.
          </p>
        </div>
      </header>

      <div className="sticky top-[66px] z-20 mb-6 -mx-4 border-y border-[#dfd3e8] bg-[#faf7fb]/96 px-4 py-2 backdrop-blur sm:top-[74px] sm:-mx-6 sm:px-6 md:top-[82px] lg:static lg:mx-0 lg:ml-[calc(50%-50vw)] lg:mr-[calc(50%-50vw)] lg:w-screen lg:px-8">
        <div className="mx-auto max-w-[1500px]">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-1 border border-[#ded2ea] bg-white p-1 md:hidden">
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={[
                  "px-3 py-1.5 text-xs font-bold uppercase tracking-[0.05em] transition-colors duration-200",
                  viewMode === "list"
                    ? "bg-[#6c35c3] text-white"
                    : "text-[#4a267a] hover:bg-[#f4efff]",
                ].join(" ")}
                aria-pressed={viewMode === "list"}
              >
                List
              </button>
              <button
                type="button"
                onClick={() => setViewMode("day")}
                className={[
                  "px-3 py-1.5 text-xs font-bold uppercase tracking-[0.05em] transition-colors duration-200",
                  viewMode === "day"
                    ? "bg-[#6c35c3] text-white"
                    : "text-[#4a267a] hover:bg-[#f4efff]",
                ].join(" ")}
                aria-pressed={viewMode === "day"}
              >
                By day
              </button>
            </div>
          </div>

          <div className="mt-4 pb-1">
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
                    "inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-md border px-4 py-2 text-sm font-bold transition-all duration-160",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6c35c3]/45 focus-visible:ring-offset-2",
                    isActive
                      ? "shadow-[0_7px_18px_-16px_rgba(31,18,57,0.45)]"
                      : "opacity-95 hover:opacity-100",
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
            <div className="mt-2.5 pb-1">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.08em] text-[#5f5177]">
              Age group
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setActiveAgeGroup("all")}
                className={[
                  "inline-flex min-h-9 cursor-pointer items-center rounded-md border px-3 py-1.5 text-xs font-bold transition-all duration-160",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#138a4b]/40 focus-visible:ring-offset-2",
                  activeAgeGroup === "all"
                    ? "border-[#138a4b]/30 bg-[#dff5e8] text-[#106f3d] ring-1 ring-[#138a4b]/18 shadow-[0_2px_8px_-6px_rgba(31,18,57,0.35)]"
                    : "border-[#d9d1e8] bg-white text-[#138a4b] hover:border-[#b7e6ca] hover:bg-[#f4fbf7] hover:shadow-[0_8px_18px_-14px_rgba(31,18,57,0.45)]",
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
                      "inline-flex min-h-9 cursor-pointer items-center rounded-md border px-3 py-1.5 text-xs font-bold transition-all duration-160",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#138a4b]/40 focus-visible:ring-offset-2",
                      isActive
                        ? "border-[#138a4b]/30 bg-[#dff5e8] text-[#106f3d] ring-1 ring-[#138a4b]/18 shadow-[0_2px_8px_-6px_rgba(31,18,57,0.35)]"
                        : "border-[#d9d1e8] bg-white text-[#138a4b] hover:border-[#b7e6ca] hover:bg-[#f4fbf7] hover:shadow-[0_8px_18px_-14px_rgba(31,18,57,0.45)]",
                    ].join(" ")}
                    aria-pressed={isActive}
                  >
                    {age}
                  </button>
                );
              })}
            </div>
            </div>
          ) : null}

          <div className="mt-2.5 pb-1">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.08em] text-[#5f5177]">
            Day
          </p>
          <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap">
            {weekdayFilters.map((day) => {
              const isActive = activeWeekday === day;
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => setActiveWeekday(day)}
                  className={[
                    "inline-flex min-h-9 cursor-pointer items-center justify-center rounded-md border px-3 py-1.5 text-xs font-bold transition-all duration-160",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6c35c3]/35 focus-visible:ring-offset-2",
                    isActive
                      ? "border-[#6c35c3]/30 bg-[#efe8fb] text-[#41216f] shadow-[0_2px_8px_-6px_rgba(31,18,57,0.35)]"
                      : "border-[#d9d1e8] bg-white text-[#554579] hover:border-[#cdbfe4] hover:bg-[#faf7ff]",
                  ].join(" ")}
                  aria-pressed={isActive}
                >
                  {day === "All days" ? "All days" : day.slice(0, 3)}
                </button>
              );
            })}
          </div>
          </div>
        </div>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[2px] bg-[#e6deef]"
        />
      </div>

      <div>
        {showEmptyState ? (
          <div className="rounded-lg border border-dashed border-[#6c35c3]/20 bg-[#faf5ff] px-5 py-10 text-center">
            <p className="text-base font-semibold text-[#2a0c4f]">No sessions match this filter.</p>
            <p className="mt-2 text-sm text-[#2a0c4f]/75">
              Try another class type or clear your filter to view all sessions.
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setActiveFilter("all");
                  setActiveAgeGroup("all");
                  setActiveWeekday("All days");
                }}
                className="inline-flex cursor-pointer items-center rounded-md bg-[#6c35c3] px-4 py-2 text-xs font-semibold uppercase tracking-[0.06em] text-white transition-colors duration-160 hover:bg-[#5f2eb6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6c35c3]/40 focus-visible:ring-offset-2"
              >
                Clear filters
              </button>
              <a
                href="/contact"
                className="inline-flex items-center rounded-md border border-[#6c35c3]/25 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.06em] text-[#4a267a] transition hover:bg-[#f8f2ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6c35c3]/40 focus-visible:ring-offset-2"
              >
                Contact us
              </a>
            </div>
          </div>
        ) : (
          <>
            <div className={viewMode === "day" ? "overflow-x-auto pb-1 md:block" : "hidden md:block"}>
              <div className="grid min-w-[1500px] grid-cols-6 gap-4">
                {filteredTimetable.map((day) => (
                  <section
                    key={day.day}
                    className="rounded-lg border border-[#ded2ea] bg-white p-3 shadow-[0_12px_28px_-26px_rgba(54,22,93,0.6)]"
                    aria-label={`${day.day} sessions`}
                  >
                    <div className="mb-2 flex items-center justify-between border-b border-[#6c35c3]/10 pb-1.5">
                      <h2 className="text-[19px] font-extrabold tracking-[0.01em] text-[#143271]">
                        {day.day}
                      </h2>
                      <span className="rounded-md bg-[#f4efff] px-2.5 py-1 text-[11px] font-semibold text-[#5f2eb6]">
                        {day.sessions.length}
                      </span>
                    </div>
                    <div className="space-y-2.5">
                      {day.sessions.map((session, index) => {
                        const type = getType(session);
                        const cleanTitle = getClassLabel(type);

                        return (
                          <Link
                            key={`${day.day}-${session.title}-${session.time}-${index}`}
                            href={classLinkHref}
                            className="block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6c35c3]/45 focus-visible:ring-offset-2"
                          >
                            <article className="relative overflow-hidden rounded-lg border border-[#ded2ea] bg-[#fff] px-3 py-3 transition hover:border-[#cbbde2] hover:bg-[#fcfaff]">
                              <span
                                aria-hidden="true"
                                className={`absolute inset-y-0 left-0 w-1 ${typeStyles[type].rail}`}
                              />
                              <div className="flex min-h-[94px] flex-col justify-between gap-3">
                                <span
                                  className={`inline-flex w-fit items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-semibold ${typeStyles[type].pill}`}
                                >
                                  {type === "special" ? specialIcon : null}
                                  {cleanTitle}
                                </span>
                                <div>
                                  <p className="text-[18px] font-extrabold leading-tight text-[#251341]">
                                    {session.startTime}
                                  </p>
                                  <div className="mt-2 grid gap-1 text-xs font-semibold text-[#2a0c4f]/75">
                                    <span>{session.duration}</span>
                                    {type === "recreational" ? (
                                      <span>{normalizeAgeLabel(session.age)}</span>
                                    ) : null}
                                  </div>
                                </div>
                              </div>
                            </article>
                          </Link>
                        );
                      })}
                    </div>
                  </section>
                ))}
              </div>
            </div>

            <div className={viewMode === "list" ? "space-y-3 md:hidden" : "hidden"}>
              {filteredTimetable.map((day) => (
                <section key={`mobile-${day.day}`}>
                  <h3 className="mb-2 px-1 text-[11px] font-bold uppercase tracking-[0.08em] text-[#5f2eb6]/85">
                    {day.day}
                  </h3>
                  <div className="space-y-2.5">
                    {day.sessions.map((session, index) => {
                      const type = getType(session);
                      const cleanTitle = getClassLabel(type);

                      return (
                        <Link
                          key={`${day.day}-${session.title}-${session.time}-${index}`}
                          href={classLinkHref}
                          className="block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6c35c3]/45 focus-visible:ring-offset-2"
                        >
                          <article className="relative overflow-hidden rounded-lg border border-[#ded2ea] bg-white px-3 py-3 pl-4 shadow-[0_8px_18px_-18px_rgba(54,22,93,0.55)] transition hover:border-[#cbbde2] hover:bg-[#fcfaff]">
                            <span
                              aria-hidden="true"
                              className={`absolute inset-y-0 left-0 w-1 ${typeStyles[type].rail}`}
                            />
                            <div className="flex min-h-[92px] flex-col justify-between gap-3">
                              <span
                                className={`inline-flex w-fit items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-semibold ${typeStyles[type].pill}`}
                              >
                                {type === "special" ? specialIcon : null}
                                {cleanTitle}
                              </span>
                              <div>
                                <p className="text-[17px] font-extrabold leading-tight text-[#251341]">
                                  {session.startTime}
                                </p>
                                <div className="mt-2 grid gap-1 text-xs font-semibold text-[#2a0c4f]/75">
                                  <span>{session.duration}</span>
                                  {type === "recreational" ? (
                                    <span>{normalizeAgeLabel(session.age)}</span>
                                  ) : null}
                                </div>
                              </div>
                            </div>
                          </article>
                        </Link>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
