"use client";

import { useMemo, useRef, useState } from "react";
import type { CalendarEventRow } from "@/lib/server/calendarEvents";

type EventsClientProps = {
  events: CalendarEventRow[];
};

type EventMonthGroup = {
  month: number;
  monthLabel: string;
  items: CalendarEventRow[];
};

const MONTH_LABELS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

function formatDayLabel(day: number, month: number, year: number) {
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
  });
}

export default function EventsClient({ events }: EventsClientProps) {
  const years = useMemo(
    () => Array.from(new Set(events.map((event) => event.year))).sort((a, b) => a - b),
    [events]
  );
  const [activeYear, setActiveYear] = useState<number>(() => {
    const currentYear = new Date().getFullYear();
    return years.includes(currentYear) ? currentYear : years[0] ?? currentYear;
  });
  const [activeMonth, setActiveMonth] = useState<number>(1);
  const detailRef = useRef<HTMLDivElement | null>(null);

  const filteredEvents = useMemo(
    () => events.filter((event) => event.year === activeYear),
    [activeYear, events]
  );

  const monthGroups = useMemo<EventMonthGroup[]>(() => {
    const groups = new Map<number, CalendarEventRow[]>();
    filteredEvents.forEach((event) => {
      const bucket = groups.get(event.month) ?? [];
      bucket.push(event);
      groups.set(event.month, bucket);
    });

    return MONTH_LABELS.map((label, index) => {
      const month = index + 1;
      return {
        month,
        monthLabel: label,
        items: groups.get(month) ?? [],
      };
    });
  }, [filteredEvents]);

  const upcomingCount = filteredEvents.length;
  const fallbackMonth = monthGroups.find((group) => group.items.length > 0)?.month ?? 1;
  const resolvedActiveMonth =
    monthGroups.find((group) => group.month === activeMonth) != null
      ? activeMonth
      : fallbackMonth;
  const activeMonthGroup =
    monthGroups.find((group) => group.month === resolvedActiveMonth) ?? monthGroups[0] ?? null;
  const activeMonthEventCount = activeMonthGroup?.items.length ?? 0;

  const selectMonth = (month: number, options?: { scrollToDetail?: boolean }) => {
    setActiveMonth(month);
    if (options?.scrollToDetail) {
      requestAnimationFrame(() => {
        detailRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      });
    }
  };

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-10">
      <header className="mb-10 space-y-4">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6c35c3]">
            Club Dates
          </p>
          <h1 className="text-4xl font-bold tracking-[-0.02em] text-[#143271] sm:text-5xl">
            Events
          </h1>
          <p className="max-w-3xl text-base leading-7 text-[#2a0c4f]/80 sm:text-lg">
            Key club dates, holiday sessions, and important upcoming events.
          </p>
        </div>

        <div className="flex flex-col gap-3 border-t border-black/10 pt-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            {years.map((year) => (
              <button
                key={year}
                type="button"
                onClick={() => {
                  setActiveYear(year);
                  const nextYearGroups = events
                    .filter((event) => event.year === year)
                    .reduce<Map<number, number>>((map, event) => {
                      map.set(event.month, (map.get(event.month) ?? 0) + 1);
                      return map;
                    }, new Map());
                  const nextMonth =
                    MONTH_LABELS.findIndex((_, index) => nextYearGroups.has(index + 1)) + 1 || 1;
                  setActiveMonth(nextMonth);
                }}
                className={[
                  "cursor-pointer rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] transition-colors",
                  activeYear === year
                    ? "border-[#6c35c3] bg-[#6c35c3] text-white"
                    : "border-[#d8cbe7] bg-white text-[#6c35c3] hover:bg-[#f3ecfb]",
                ].join(" ")}
              >
                {year}
              </button>
            ))}
          </div>
          <p className="text-sm font-semibold text-[#2a0c4f]/75">
            {upcomingCount} {upcomingCount === 1 ? "event" : "events"}
          </p>
        </div>
      </header>

      {monthGroups.length === 0 ? (
        <section className="rounded-3xl border border-[#e1d7ee] bg-white px-6 py-8 shadow-[0_18px_42px_rgba(22,12,47,0.08)]">
          <p className="text-base font-semibold text-[#2E2A33]">
            No events have been added for {activeYear}.
          </p>
        </section>
      ) : (
        <section className="space-y-8">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {monthGroups.map((group) => {
              const isActive = group.month === resolvedActiveMonth;
              const previewItems = group.items.slice(0, 2);
              return (
                <button
                  key={group.month}
                  type="button"
                  onClick={() => selectMonth(group.month, { scrollToDetail: true })}
                  className={[
                    "group relative cursor-pointer overflow-hidden border px-4 py-4 text-left transition",
                    isActive
                      ? "border-[#6c35c3] bg-[#faf6ff] shadow-[0_20px_40px_-30px_rgba(45,26,78,0.34)]"
                      : "border-[#e1d7ee] bg-white hover:-translate-y-[1px] hover:border-[#cdb8ea] hover:bg-[#fcf9ff] hover:shadow-[0_18px_36px_-30px_rgba(45,26,78,0.22)]",
                  ].join(" ")}
                  aria-pressed={isActive}
                >
                  <span
                    aria-hidden="true"
                    className={[
                      "pointer-events-none absolute inset-x-0 top-0 h-[3px] transition-opacity",
                      isActive ? "bg-[#6c35c3] opacity-100" : "bg-[#cdb8ea] opacity-0 group-hover:opacity-100",
                    ].join(" ")}
                  />
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-bold tracking-[-0.02em] text-[#143271]">
                        {group.monthLabel}
                      </h2>
                      <p className="mt-1 text-sm font-semibold text-[#2a0c4f]/75">
                        {group.items.length} {group.items.length === 1 ? "event" : "events"}
                      </p>
                    </div>
                    {isActive ? (
                      <span className="inline-flex items-center rounded-full border border-[#d7c5ef] bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6c35c3]">
                        Selected
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-4 border-t border-[#efe7f7] pt-3 space-y-1.5">
                    {previewItems.length > 0 ? (
                      previewItems.map((event) => (
                        <div key={event.id} className="flex items-start gap-2 text-sm text-[#2E2A33]/78">
                          <span className="mt-[3px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#6c35c3]/55" />
                          <p className="truncate">
                            <span className="font-semibold text-[#2E2A33]">
                              {String(event.day).padStart(2, "0")}
                            </span>{" "}
                            {event.event}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-[#8d7fa3]">No events listed.</p>
                    )}
                    {group.items.length > previewItems.length ? (
                      <p className="pt-1 text-xs font-semibold uppercase tracking-[0.08em] text-[#6c35c3]">
                        View all {group.items.length}
                      </p>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>

          {activeMonthGroup ? (
            <div ref={detailRef} className="scroll-mt-28 space-y-4">
              <div className="flex flex-col gap-3 border-t border-black/10 pt-5 sm:flex-row sm:items-end sm:justify-between">
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold tracking-[-0.02em] text-[#143271]">
                    {activeMonthGroup.monthLabel} {activeYear}
                  </h2>
                  <p className="text-sm font-semibold text-[#2a0c4f]/72">
                    {activeMonthEventCount} {activeMonthEventCount === 1 ? "event" : "events"} in this month
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {monthGroups
                    .filter((group) => group.items.length > 0)
                    .map((group) => (
                      <button
                        key={group.month}
                        type="button"
                        onClick={() => selectMonth(group.month)}
                        className={[
                          "cursor-pointer rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] transition-colors",
                          group.month === resolvedActiveMonth
                            ? "border-[#6c35c3] bg-[#6c35c3] text-white"
                            : "border-[#ddd3eb] bg-white text-[#6c35c3] hover:bg-[#f4ecff]",
                        ].join(" ")}
                      >
                        {group.monthLabel.slice(0, 3)}
                      </button>
                    ))}
                </div>
              </div>

              {activeMonthGroup.items.length === 0 ? (
                <div className="border border-[#e1d7ee] bg-white px-5 py-6 shadow-[0_16px_34px_-28px_rgba(45,26,78,0.18)]">
                  <p className="text-base font-semibold text-[#2E2A33]">
                    No events have been added for {activeMonthGroup.monthLabel}.
                  </p>
                </div>
              ) : (
                <div className="relative space-y-3 pl-0 sm:pl-7">
                  <span
                    aria-hidden="true"
                    className="absolute left-[11px] top-1 bottom-1 hidden w-0 border-l-2 border-dashed border-[#cdb8ea] sm:block"
                  />
                  {activeMonthGroup.items.map((event) => (
                    <article
                      key={event.id}
                      className="relative grid gap-3 border border-[#e1d7ee] bg-white px-4 py-4 shadow-[0_16px_34px_-28px_rgba(45,26,78,0.2)] transition hover:border-[#d4c5ea] hover:shadow-[0_18px_38px_-28px_rgba(45,26,78,0.26)] sm:grid-cols-[124px_minmax(0,1fr)] sm:px-5"
                    >
                      <span
                        aria-hidden="true"
                        className="absolute -left-[27px] top-6 hidden h-3 w-3 rounded-full border-2 border-[#f9f6fa] bg-[#6c35c3] sm:block"
                      />
                      <div className="flex flex-col gap-1 border-b border-[#efe7f7] pb-3 sm:border-b-0 sm:border-r sm:pb-0 sm:pr-4">
                        <p className="text-sm font-bold uppercase tracking-[0.12em] text-[#6c35c3]">
                          {formatDayLabel(event.day, event.month, event.year)}
                        </p>
                        <p className="text-2xl font-black leading-none text-[#143271]">
                          {String(event.day).padStart(2, "0")}
                        </p>
                      </div>
                      <div className="min-w-0">
                        <p className="text-base font-semibold text-[#2E2A33]">
                          {event.event}
                        </p>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          ) : null}
        </section>
      )}
    </main>
  );
}
