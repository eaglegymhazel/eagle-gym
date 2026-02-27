"use client";

import { useEffect, useMemo, useState, type KeyboardEvent } from "react";
import { CalendarDays, Star } from "lucide-react";
import type { Session } from "./mockSessions";

type ClassRegisterPickerProps = {
  sessions: Session[];
  onSelect: (session: Session) => void;
};

type HistoricalRegister = {
  registerId: string;
  classId: string;
  className: string;
  programme: "Recreational" | "Competition";
  ageBand: string;
  sessionDate: string;
  startTime: string | null;
  endTime: string | null;
  presentCount: number;
  absentCount: number;
  takenAt: string | null;
  takenByLabel: string;
};

type ProgrammeFilter = "all" | "Recreational" | "Competition";

type GroupedSessions = {
  key: string;
  label: string;
  sessions: Session[];
};

const LONDON_TZ = "Europe/London";

function dayKey(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: LONDON_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value ?? "1970";
  const month = parts.find((part) => part.type === "month")?.value ?? "01";
  const day = parts.find((part) => part.type === "day")?.value ?? "01";
  return `${year}-${month}-${day}`;
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function formatTime(date: Date): string {
  return date
    .toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: LONDON_TZ,
    })
    .replace(".", ":");
}

function getTimeRangeParts(startIso: string, endIso: string): { start: string; end: string } {
  const start = new Date(startIso);
  const end = new Date(endIso);
  return {
    start: formatTime(start),
    end: formatTime(end),
  };
}

function statusChip(
  session: Session,
  now: Date
): "starting-soon" | "in-progress" | "recently-ended" | null {
  const start = new Date(session.startAt);
  const end = new Date(session.endAt);
  if (start <= now && now < end) return "in-progress";
  if (now >= end && now <= new Date(end.getTime() + 2 * 60 * 60 * 1000)) {
    return "recently-ended";
  }
  const minutesToStart = (start.getTime() - now.getTime()) / 60000;
  if (minutesToStart >= 0 && minutesToStart <= 60) return "starting-soon";
  return null;
}

function statusLabel(status: "starting-soon" | "in-progress" | "recently-ended" | null): string {
  if (status === "in-progress") return "In progress";
  if (status === "recently-ended") return "Recently ended";
  if (status === "starting-soon") return "Starting soon";
  return "";
}

function groupLabelForDay(day: string, today: string, tomorrow: string): string {
  if (day === today) return "Today";
  if (day === tomorrow) return "Tomorrow";
  const date = new Date(`${day}T12:00:00.000Z`);
  return date.toLocaleDateString("en-GB", { weekday: "long", timeZone: LONDON_TZ });
}

function formatHeaderDate(day: string): string {
  const date = new Date(`${day}T12:00:00.000Z`);
  return date.toLocaleDateString("en-GB", {
    timeZone: LONDON_TZ,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function ClassRegisterPicker({ sessions, onSelect }: ClassRegisterPickerProps) {
  const [programmeFilter, setProgrammeFilter] = useState<ProgrammeFilter>("all");
  const [historicalDate, setHistoricalDate] = useState(dayKey(new Date()));
  const [historicalRegisters, setHistoricalRegisters] = useState<HistoricalRegister[]>([]);
  const [historicalLoading, setHistoricalLoading] = useState(false);
  const [historicalError, setHistoricalError] = useState<string | null>(null);
  const [showCount, setShowCount] = useState(12);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [appliedFilters, setAppliedFilters] = useState({
    programmeFilter: "all" as ProgrammeFilter,
  });

  const loading = appliedFilters.programmeFilter !== programmeFilter;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setAppliedFilters({
        programmeFilter,
      });
    }, 220);
    return () => window.clearTimeout(timer);
  }, [programmeFilter]);

  const filteredSorted = useMemo(() => {
    const now = new Date();
    const sorted = [...sessions].sort(
      (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
    );

    return sorted.filter((session) => {
      const end = new Date(session.endAt);
      const lockAt = new Date(end.getTime() + 2 * 60 * 60 * 1000);
      const programmeMatch =
        appliedFilters.programmeFilter === "all"
          ? true
          : session.programme === appliedFilters.programmeFilter;
      return lockAt >= now && programmeMatch;
    });
  }, [appliedFilters, sessions]);

  const visibleSessions = useMemo(
    () => filteredSorted.slice(0, showCount),
    [filteredSorted, showCount]
  );

  const groupedSessions = useMemo<GroupedSessions[]>(() => {
    if (visibleSessions.length === 0) return [];

    const todayKey = dayKey(new Date());
    const tomorrowKey = dayKey(addDays(new Date(), 1));
    const byDay = new Map<string, Session[]>();

    visibleSessions.forEach((session) => {
      const key = dayKey(new Date(session.startAt));
      const existing = byDay.get(key) ?? [];
      existing.push(session);
      byDay.set(key, existing);
    });

    const orderedDayKeys = [...byDay.keys()].sort();
    return orderedDayKeys.map((key) => ({
      key,
      label: groupLabelForDay(key, todayKey, tomorrowKey),
      sessions: byDay.get(key) ?? [],
    }));
  }, [visibleSessions]);

  const flatVisibleSessions = useMemo(
    () => groupedSessions.flatMap((group) => group.sessions),
    [groupedSessions]
  );

  const hasMore = filteredSorted.length > showCount;

  useEffect(() => {
    let isActive = true;
    const loadHistorical = async () => {
      if (!historicalDate) {
        setHistoricalRegisters([]);
        setHistoricalError(null);
        return;
      }
      setHistoricalLoading(true);
      setHistoricalError(null);
      try {
        const response = await fetch(
          `/api/admin/register-history?date=${encodeURIComponent(historicalDate)}`,
          {
            method: "GET",
            credentials: "include",
          }
        );
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload?.error ?? "Unable to load historical registers.");
        }
        if (!isActive) return;
        const rows = Array.isArray(payload?.registers)
          ? (payload.registers as HistoricalRegister[])
          : [];
        setHistoricalRegisters(rows);
      } catch (error) {
        if (!isActive) return;
        setHistoricalRegisters([]);
        setHistoricalError(
          error instanceof Error ? error.message : "Unable to load historical registers."
        );
      } finally {
        if (isActive) setHistoricalLoading(false);
      }
    };
    void loadHistorical();
    return () => {
      isActive = false;
    };
  }, [historicalDate]);

  const handleSelect = (session: Session) => {
    console.log(session);
    onSelect(session);
  };

  const handleListKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (flatVisibleSessions.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightedIndex((prev) => {
        const next = prev + 1;
        return next >= flatVisibleSessions.length ? 0 : next;
      });
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightedIndex((prev) => {
        if (prev <= 0) return flatVisibleSessions.length - 1;
        return prev - 1;
      });
      return;
    }

    if (event.key === "Enter" && highlightedIndex >= 0) {
      event.preventDefault();
      handleSelect(flatVisibleSessions[highlightedIndex]);
    }
  };

  return (
    <>
    <div className="space-y-3">
      <section className="pt-0">
        <div className="mb-2 flex items-center gap-1">
          {(["all", "Recreational", "Competition"] as const).map((value) => {
            const isActive = programmeFilter === value;
            const label = value === "all" ? "All" : value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => {
                  setProgrammeFilter(value);
                  setShowCount(12);
                }}
                className={[
                  "rounded-md border px-2.5 py-1 text-xs font-semibold transition",
                  isActive
                    ? "border-[#6e2ac0] bg-[#f4edff] text-[#4d2d79]"
                    : "border-[#dfd7ea] bg-white text-[#6f6484] hover:bg-[#f7f4fb]",
                ].join(" ")}
              >
                {label}
              </button>
            );
          })}
        </div>
        <h3 className="mb-2 text-sm font-semibold text-[#2a203c]">Upcoming sessions</h3>

        {loading ? (
          <div className="space-y-1.5">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={`session-skeleton-${index}`}
                className="h-14 animate-pulse rounded-md bg-gradient-to-r from-[#f3eef8] via-[#eee6f7] to-[#f3eef8]"
              />
            ))}
          </div>
        ) : groupedSessions.length === 0 ? (
          <div className="rounded-md border border-dashed border-[#ded5ec] px-3 py-3 text-sm text-[#6d6281]">
            No upcoming sessions.
          </div>
        ) : (
          <div
            role="listbox"
            aria-label="Upcoming sessions"
            tabIndex={0}
            onKeyDown={handleListKeyDown}
            onMouseLeave={() => setHighlightedIndex(-1)}
          >
            {groupedSessions.map((group) => (
              <div key={group.key} className="mb-4 last:mb-0">
                <div className="flex items-center justify-between gap-3 border-b-2 border-[#ddd3ec] px-1 pb-1 text-[#7b7090]">
                  <p className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.03em]">
                    <CalendarDays className="h-3 w-3 text-[#9a93ac]" aria-hidden="true" />
                    {group.label}
                  </p>
                  <p className="tabular-nums text-[10px] font-medium text-[#8f84a4]">
                    {formatHeaderDate(group.key)}
                  </p>
                </div>
                <div className="mt-2 pb-2">
                {group.sessions.map((session) => {
                  const index = flatVisibleSessions.findIndex((item) => item.id === session.id);
                  const isActive = index === highlightedIndex;
                  const status = statusLabel(statusChip(session, new Date()));
                  const statusVariant = statusChip(session, new Date());
                  const range = getTimeRangeParts(session.startAt, session.endAt);
                  const isCompetition = session.programme === "Competition";

                  return (
                    <button
                      key={session.id}
                      type="button"
                      role="option"
                      aria-selected={isActive}
                      onMouseEnter={() => setHighlightedIndex(index)}
                      onClick={() => handleSelect(session)}
                      className={[
                        "group relative w-full cursor-pointer overflow-hidden border-b border-[#ede8f3] px-2 py-1.5 text-left transition last:border-b-0 sm:py-1",
                        "bg-transparent",
                      ].join(" ")}
                    >
                      <span
                        aria-hidden
                        className={[
                          "adminTintOverlay absolute inset-0 bg-[#f0e8fb]",
                          isActive ? "opacity-100" : "",
                        ].join(" ")}
                      />
                      <span
                        aria-hidden
                        className={[
                          "absolute inset-y-1 left-0 z-[1] w-[2px] rounded-full transition-opacity",
                          "bg-[#6e2ac0]",
                          isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100",
                        ].join(" ")}
                      />

                      <div className="relative z-[1] grid grid-cols-1 gap-0.5 sm:grid-cols-[minmax(0,1fr)_190px] sm:items-center">
                        <div className="min-w-0">
                          <div className="flex items-center justify-between gap-2 sm:block">
                            <p className="truncate text-[15px] font-semibold tabular-nums text-[#211735]">
                              <span>{range.start}</span>
                              <span className="text-[13px] text-[#8a8299]">-{range.end}</span>
                            </p>
                            <div className="flex items-center gap-2 text-xs sm:hidden">
                              <span className="min-w-[92px] text-right text-xs font-medium text-[#6a607d]">
                                Enrolled: {session.bookedCount}
                              </span>
                              <span className="inline-block text-[10px] leading-none text-[#7e7292] transition-transform duration-200 ease-out group-hover:scale-110 group-hover:rotate-90">
                                &gt;
                              </span>
                            </div>
                          </div>
                          <div className="mt-0.5 flex items-center justify-between gap-2 sm:block">
                            <p className="truncate text-xs text-[#7c738f]">
                              <span
                                className={[
                                  "mr-1.5 inline-flex items-center gap-1 text-[11px] font-semibold leading-none",
                                  isCompetition ? "text-[#b97700]" : "text-[#138a4b]",
                                ].join(" ")}
                              >
                                <Star className="h-2.5 w-2.5 fill-current" aria-hidden="true" />
                                <span>{isCompetition ? "Comp" : "Rec"}</span>
                              </span>
                              {session.programme === "Competition"
                                ? ""
                                : session.ageBand
                                  ? ` - ${session.ageBand}`
                                  : ""}
                            </p>
                            {status ? (
                              <span
                                className={[
                                  "inline-flex items-center whitespace-nowrap rounded-full border px-2 py-0.5 text-[10px] font-semibold leading-none sm:hidden",
                                  statusVariant === "starting-soon"
                                    ? "border-[#b7d3f3] bg-[#eaf3ff] text-[#1f4f8f]"
                                    : statusVariant === "in-progress"
                                      ? "border-[#b7e6ca] bg-[#ecfaf1] text-[#1d6a3e]"
                                      : "border-[#f1d9b3] bg-[#fff8ec] text-[#875716]",
                                ].join(" ")}
                              >
                                {status}
                              </span>
                            ) : null}
                          </div>
                        </div>
                        <div className="hidden items-center justify-between text-xs sm:flex sm:justify-end sm:gap-3">
                          {status ? (
                            <span
                              className={[
                                "inline-flex items-center whitespace-nowrap rounded-full border px-2 py-0.5 text-[10px] font-semibold leading-none",
                                statusVariant === "starting-soon"
                                  ? "border-[#b7d3f3] bg-[#eaf3ff] text-[#1f4f8f]"
                                  : statusVariant === "in-progress"
                                    ? "border-[#b7e6ca] bg-[#ecfaf1] text-[#1d6a3e]"
                                    : "border-[#f1d9b3] bg-[#fff8ec] text-[#875716]",
                              ].join(" ")}
                            >
                              {status}
                            </span>
                          ) : (
                            <span />
                          )}
                          <span className="min-w-[92px] text-right text-xs font-medium text-[#6a607d]">
                            Enrolled: {session.bookedCount}
                          </span>
                          <span className="inline-block text-[10px] leading-none text-[#7e7292] transition-transform duration-200 ease-out group-hover:scale-110 group-hover:rotate-90">
                            &gt;
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
                </div>
              </div>
            ))}

            {hasMore ? (
              <button
                type="button"
                onClick={() => setShowCount((prev) => prev + 12)}
                className="mt-2 rounded-md border border-[#d7cdea] px-3 py-1.5 text-xs font-semibold text-[#5a279f] hover:bg-[#f3ecfc]"
              >
                Show more
              </button>
            ) : null}
          </div>
        )}
      </section>

      <section className="border-t border-[#e6e0ee] pt-2">
        <h3 className="mb-2 text-sm font-semibold text-[#2a203c]">View historical registers</h3>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-[240px]">
          <div>
            <label htmlFor="historical-register-date" className="mb-1 block text-xs text-[#6c607f]">
              Date
            </label>
            <input
              id="historical-register-date"
              type="date"
              aria-label="Select historical register date"
              value={historicalDate}
              onChange={(event) => {
                setHistoricalDate(event.target.value);
              }}
              className="h-10 w-full cursor-pointer rounded-md border border-[#d9d1e5] bg-white px-3 text-sm text-[#1f1a25] outline-none transition focus:border-[#6e2ac0] focus:ring-2 focus:ring-[#6e2ac0]/20"
            />
          </div>
        </div>

        <div className="mt-3">
          {historicalLoading ? (
            <div className="space-y-1.5">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={`history-loading-${index}`}
                  className="h-12 animate-pulse rounded-md bg-gradient-to-r from-[#f3eef8] via-[#eee6f7] to-[#f3eef8]"
                />
              ))}
            </div>
          ) : historicalError ? (
            <div className="rounded-md border border-[#f0c4cc] bg-[#fff2f4] px-3 py-2 text-sm text-[#8a2940]">
              {historicalError}
            </div>
          ) : historicalRegisters.length === 0 ? (
            <div className="rounded-md border border-dashed border-[#ded5ec] px-3 py-3 text-sm text-[#6d6281]">
              No saved registers for this date.
            </div>
          ) : (
            <div className="divide-y divide-[#ece6f5] rounded-md border border-[#e6e0ee]">
              {historicalRegisters.map((register) => {
                const historySession: Session = {
                  id: `${register.classId}-${register.sessionDate}-${register.registerId}`,
                  classId: register.classId,
                  className: register.className,
                  programme: register.programme,
                  ageBand: register.ageBand,
                  startAt: `${register.sessionDate}T${register.startTime ?? "00:00:00"}`,
                  endAt: `${register.sessionDate}T${register.endTime ?? "00:00:00"}`,
                  bookedCount: register.presentCount + register.absentCount,
                };
                return (
                  <button
                    key={register.registerId}
                    type="button"
                    onClick={() => onSelect(historySession)}
                    className="group relative w-full cursor-pointer overflow-hidden border-b border-[#ede8f3] px-2 py-1.5 text-left transition last:border-b-0 sm:py-1"
                  >
                    <span
                      aria-hidden
                      className="adminTintOverlay absolute inset-0 bg-[#f0e8fb]"
                    />
                    <span
                      aria-hidden
                      className="absolute inset-y-1 left-0 z-[1] w-[2px] rounded-full bg-[#6e2ac0] opacity-0 transition-opacity group-hover:opacity-100"
                    />
                    <div className="relative z-[1] sm:hidden">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-[15px] font-semibold tabular-nums text-[#211735]">
                          <span>{(register.startTime ?? "--:--").slice(0, 5)}</span>
                          <span className="text-[13px] text-[#8a8299]">-{(register.endTime ?? "--:--").slice(0, 5)}</span>
                        </p>
                        <span className="inline-block text-[10px] leading-none text-[#7e7292] transition-transform duration-200 group-hover:scale-110 group-hover:rotate-90">
                          &gt;
                        </span>
                      </div>
                      <div className="mt-0.5 flex items-center justify-between gap-2 text-xs text-[#6f6384]">
                        <p className="truncate text-xs text-[#7c738f]">
                          <span
                            className={[
                              "mr-1.5 inline-flex items-center gap-1 text-[11px] font-semibold leading-none",
                              register.programme === "Competition" ? "text-[#b97700]" : "text-[#138a4b]",
                            ].join(" ")}
                          >
                            <Star className="h-2.5 w-2.5 fill-current" aria-hidden="true" />
                            <span>{register.programme === "Competition" ? "Comp" : "Rec"}</span>
                          </span>
                          {register.programme === "Competition" || !register.ageBand ? "" : ` - ${register.ageBand}`}
                        </p>
                        <span className="shrink-0">P {register.presentCount} - A {register.absentCount}</span>
                      </div>
                      <p className="mt-0.5 truncate text-xs text-[#6f6384]">{register.takenByLabel}</p>
                    </div>

                    <div className="relative z-[1] hidden sm:grid sm:grid-cols-[minmax(0,1fr)_270px] sm:items-center sm:gap-0.5">
                      <div className="min-w-0">
                        <p className="truncate text-[15px] font-semibold tabular-nums text-[#211735]">
                          <span>{(register.startTime ?? "--:--").slice(0, 5)}</span>
                          <span className="text-[13px] text-[#8a8299]">-{(register.endTime ?? "--:--").slice(0, 5)}</span>
                        </p>
                        <p className="truncate text-xs text-[#7c738f]">
                          <span
                            className={[
                              "mr-1.5 inline-flex items-center gap-1 text-[11px] font-semibold leading-none",
                              register.programme === "Competition" ? "text-[#b97700]" : "text-[#138a4b]",
                            ].join(" ")}
                          >
                            <Star className="h-2.5 w-2.5 fill-current" aria-hidden="true" />
                            <span>{register.programme === "Competition" ? "Comp" : "Rec"}</span>
                          </span>
                          {register.programme === "Competition" || !register.ageBand ? "" : ` - ${register.ageBand}`}
                        </p>
                      </div>
                      <div className="flex items-center justify-between gap-2 text-xs text-[#6f6384] sm:justify-end sm:gap-3">
                        <span>P {register.presentCount} - A {register.absentCount}</span>
                        <span className="truncate">{register.takenByLabel}</span>
                        <span className="inline-block text-[10px] leading-none text-[#7e7292] transition-transform duration-200 group-hover:scale-110 group-hover:rotate-90">
                          &gt;
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
    <style jsx global>{`
      #historical-register-date::-webkit-calendar-picker-indicator {
        cursor: pointer;
      }
      .adminTintOverlay {
        transform-origin: left;
        transform: scaleX(1);
        opacity: 0;
        transition: opacity 180ms ease-out;
        pointer-events: none;
      }
      .group:hover .adminTintOverlay {
        opacity: 1;
        transition-duration: 0ms;
        animation: adminTintWipeIn 280ms ease-out both;
      }
      @keyframes adminTintWipeIn {
        from {
          transform: scaleX(0);
        }
        to {
          transform: scaleX(1);
        }
      }
    `}</style>
    </>
  );
}
