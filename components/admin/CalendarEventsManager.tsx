"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, CalendarDays, Pencil, Plus, Save, Trash2, X } from "lucide-react";
import type {
  AdminCalendarEventFilterOptions,
  AdminCalendarEventRow,
  CalendarEventProgramme,
} from "@/lib/server/adminCalendarEvents";

type CalendarEventsManagerProps = {
  initialEvents: AdminCalendarEventRow[];
  initialHasMore: boolean;
  initialNextOffset: number;
  initialFilterOptions: AdminCalendarEventFilterOptions;
};

type ProgrammeFilter = CalendarEventProgramme | "all";
type MonthFilter = number | "all";

type EventFormState = {
  programme: CalendarEventProgramme;
  eventDate: string;
  event: string;
};

type CalendarDatePickerProps = {
  value: string;
  onChange: (value: string) => void;
  label: string;
  restrictPastDates?: boolean;
};

const emptyForm: EventFormState = {
  programme: "recreational",
  eventDate: "",
  event: "",
};

const MONTH_OPTIONS = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
] as const;

function formatEventDate(value: string): string {
  const parsed = new Date(`${value}T12:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(parsed);
}

function getTodayParts() {
  const today = new Date();
  return {
    year: today.getFullYear(),
    month: today.getMonth() + 1,
    day: today.getDate(),
    value: buildDateValue(today.getFullYear(), today.getMonth() + 1, today.getDate()),
  };
}

function isPastDateValue(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && value < getTodayParts().value;
}

function programmeLabel(programme: CalendarEventProgramme): string {
  return programme === "competition" ? "Competition" : "Recreational";
}

function makeClientKey(row: Pick<AdminCalendarEventRow, "programme" | "id">): string {
  return `${row.programme}-${row.id}`;
}

function parseDateParts(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [yearRaw, monthRaw, dayRaw] = value.split("-");
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  const day = Number(dayRaw);
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return null;
  if (month < 1 || month > 12) return null;
  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    return null;
  }
  return { year, month, day };
}

function buildDateValue(year: number, month: number, day: number): string {
  return [
    String(year).padStart(4, "0"),
    String(month).padStart(2, "0"),
    String(day).padStart(2, "0"),
  ].join("-");
}

function CalendarDatePicker({
  value,
  onChange,
  label,
  restrictPastDates = false,
}: CalendarDatePickerProps) {
  const selectedDate = parseDateParts(value);
  const today = getTodayParts();
  const pickerRef = useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [viewYear, setViewYear] = useState(
    selectedDate && (!restrictPastDates || !isPastDateValue(value)) ? selectedDate.year : today.year
  );
  const [viewMonth, setViewMonth] = useState(
    selectedDate && (!restrictPastDates || !isPastDateValue(value)) ? selectedDate.month : today.month
  );

  useEffect(() => {
    const nextDate = parseDateParts(value);
    if (!nextDate || (restrictPastDates && isPastDateValue(value))) return;
    setViewYear(nextDate.year);
    setViewMonth(nextDate.month);
  }, [restrictPastDates, value]);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (target && pickerRef.current?.contains(target)) return;
      setIsOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [isOpen]);

  const daysInMonth = new Date(Date.UTC(viewYear, viewMonth, 0)).getUTCDate();
  const monthStart = new Date(Date.UTC(viewYear, viewMonth - 1, 1));
  const startOffset = (monthStart.getUTCDay() + 6) % 7;
  const yearOptions = useMemo(() => {
    const startYear = restrictPastDates
      ? today.year
      : Math.min(today.year - 10, selectedDate?.year ?? today.year, viewYear);
    const endYear = Math.max(today.year + 10, selectedDate?.year ?? today.year, viewYear);
    return Array.from({ length: endYear - startYear + 1 }, (_, index) => startYear + index);
  }, [restrictPastDates, selectedDate?.year, today.year, viewYear]);
  const displayValue = selectedDate
    ? `${String(selectedDate.day).padStart(2, "0")}/${String(selectedDate.month).padStart(2, "0")}/${selectedDate.year}`
    : "dd/mm/yyyy";

  const cells = Array.from({ length: Math.ceil((startOffset + daysInMonth) / 7) * 7 }, (_, index) => {
    const day = index - startOffset + 1;
    return day >= 1 && day <= daysInMonth ? day : null;
  });

  return (
    <div ref={pickerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="flex h-11 w-full items-center justify-between gap-2 rounded-lg border border-[#d7c7ef] bg-white px-3 text-left text-sm text-[#2a203c] outline-none ring-[#6e2ac0]/25 transition hover:bg-[#faf7ff] focus:ring-2"
        aria-label={label}
        aria-expanded={isOpen}
      >
        <span className={selectedDate ? "font-semibold" : "text-[#7a7089]"}>
          {displayValue}
        </span>
        <CalendarDays className="h-4 w-4 shrink-0 text-[#6c35c3]" aria-hidden="true" />
      </button>

      {isOpen ? (
        <div className="absolute left-0 top-[calc(100%+6px)] z-30 w-[min(310px,calc(100vw-48px))] rounded-xl border border-[#d7c7ef] bg-white p-3 shadow-[0_18px_48px_rgba(34,24,56,0.22)]">
          <div className="grid grid-cols-[minmax(0,1fr)_104px] gap-2">
            <select
              value={viewMonth}
              onChange={(event) => {
                const nextMonth = Number(event.target.value);
                setViewMonth(nextMonth);
                if (restrictPastDates && viewYear === today.year && nextMonth < today.month) {
                  setViewMonth(today.month);
                }
              }}
              className="h-9 rounded-lg border border-[#d7c7ef] bg-white px-2 text-sm font-semibold text-[#2a203c] outline-none ring-[#6e2ac0]/25 focus:ring-2"
            >
              {MONTH_OPTIONS.map((month) => (
                <option
                  key={month.value}
                  value={month.value}
                  disabled={restrictPastDates && viewYear === today.year && month.value < today.month}
                >
                  {month.label}
                </option>
              ))}
            </select>
            <select
              value={viewYear}
              onChange={(event) => setViewYear(Number(event.target.value))}
              className="h-9 rounded-lg border border-[#d7c7ef] bg-white px-2 text-sm font-semibold text-[#2a203c] outline-none ring-[#6e2ac0]/25 focus:ring-2"
            >
              {yearOptions.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[11px] font-bold uppercase text-[#7e7193]">
            {["M", "T", "W", "T", "F", "S", "S"].map((dayLabel, index) => (
              <span key={`${dayLabel}-${index}`}>{dayLabel}</span>
            ))}
          </div>
          <div className="mt-1 grid grid-cols-7 gap-1">
            {cells.map((day, index) => {
              const dateValue = day ? buildDateValue(viewYear, viewMonth, day) : "";
              const isPastDay = restrictPastDates && !!day && dateValue < today.value;
              const isSelected =
                !!day &&
                selectedDate?.year === viewYear &&
                selectedDate.month === viewMonth &&
                selectedDate.day === day;
              return day ? (
                <button
                  key={`${viewYear}-${viewMonth}-${day}`}
                  type="button"
                  disabled={isPastDay}
                  onClick={() => {
                    if (isPastDay) return;
                    onChange(dateValue);
                    setIsOpen(false);
                  }}
                  className={[
                    "h-9 rounded-lg text-sm font-semibold transition",
                    isSelected
                      ? "bg-[#6c35c3] text-white"
                      : isPastDay
                        ? "cursor-not-allowed bg-[#f2eff6] text-[#b5aabd]"
                      : "bg-[#faf7ff] text-[#2a203c] hover:bg-[#efe6fb]",
                  ].join(" ")}
                >
                  {day}
                </button>
              ) : (
                <span key={`blank-${index}`} className="h-9" />
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function AddCalendarEventForm({
  onEventAdded,
  setError,
  setMessage,
}: {
  onEventAdded: (event: AdminCalendarEventRow) => void;
  setError: (message: string | null) => void;
  setMessage: (message: string | null) => void;
}) {
  const [form, setForm] = useState<EventFormState>(emptyForm);
  const [isSaving, setIsSaving] = useState(false);

  const handleAddEvent = async () => {
    const eventTitle = form.event.trim();
    if (!form.eventDate || !eventTitle) {
      setError("Date and event title are required.");
      setMessage(null);
      return;
    }
    if (isPastDateValue(form.eventDate)) {
      setError("Calendar events cannot be added in the past.");
      setMessage(null);
      return;
    }

    setIsSaving(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/admin/calendar-events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, event: eventTitle }),
      });
      const result = (await response.json().catch(() => null)) as
        | { event?: AdminCalendarEventRow; error?: string }
        | null;

      if (!response.ok || !result?.event) {
        throw new Error(result?.error ?? "Could not add calendar event.");
      }

      onEventAdded(result.event);
      setForm({ ...emptyForm, programme: form.programme });
      setMessage("Calendar event added.");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Could not add calendar event.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="rounded-xl border border-[#e6e0ee] bg-white p-4">
      <div className="flex items-center gap-2">
        <Plus className="h-4 w-4 text-[#6c35c3]" aria-hidden="true" />
        <h3 className="text-base font-bold text-[#24193a]">Add event</h3>
      </div>
      <div className="mt-4 grid gap-3 lg:grid-cols-[180px_170px_minmax(0,1fr)_120px]">
        <select
          value={form.programme}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              programme: event.target.value as CalendarEventProgramme,
            }))
          }
          className="h-11 rounded-lg border border-[#d7c7ef] bg-white px-3 text-sm font-semibold text-[#2a203c] outline-none ring-[#6e2ac0]/25 transition focus:ring-2"
        >
          <option value="recreational">Recreational</option>
          <option value="competition">Competition</option>
        </select>
        <CalendarDatePicker
          value={form.eventDate}
          onChange={(eventDate) => setForm((current) => ({ ...current, eventDate }))}
          label="Select event date"
          restrictPastDates
        />
        <input
          type="text"
          value={form.event}
          onChange={(event) => setForm((current) => ({ ...current, event: event.target.value }))}
          placeholder="Event title"
          className="h-11 rounded-lg border border-[#d7c7ef] bg-white px-3 text-sm text-[#2a203c] outline-none ring-[#6e2ac0]/25 transition focus:ring-2"
        />
        <button
          type="button"
          onClick={() => void handleAddEvent()}
          disabled={isSaving}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#6c35c3] px-4 text-sm font-semibold text-white transition hover:bg-[#5b2ca7] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          {isSaving ? "Adding" : "Add"}
        </button>
      </div>
    </div>
  );
}

export default function CalendarEventsManager({
  initialEvents,
  initialHasMore,
  initialNextOffset,
  initialFilterOptions,
}: CalendarEventsManagerProps) {
  const [events, setEvents] = useState(initialEvents);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [nextOffset, setNextOffset] = useState(initialNextOffset);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isLoadingFilteredEvents, setIsLoadingFilteredEvents] = useState(false);
  const [filterOptions, setFilterOptions] = useState(initialFilterOptions);
  const [filter, setFilter] = useState<ProgrammeFilter>("all");
  const [yearFilter, setYearFilter] = useState<number | "all">("all");
  const [monthFilter, setMonthFilter] = useState<MonthFilter>("all");
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EventFormState>(emptyForm);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [deleteCandidateKey, setDeleteCandidateKey] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filteredEvents = useMemo(() => {
    return events
      .filter((event) => filter === "all" || event.programme === filter)
      .filter((event) => yearFilter === "all" || event.year === yearFilter)
      .filter((event) => monthFilter === "all" || event.month === monthFilter)
      .sort((a, b) => {
        const dateComparison = a.eventDate.localeCompare(b.eventDate);
        if (dateComparison !== 0) return dateComparison;
        return a.event.localeCompare(b.event, undefined, { sensitivity: "base" });
      });
  }, [events, filter, monthFilter, yearFilter]);

  const yearOptions = useMemo(
    () =>
      Array.from(new Set([...filterOptions.years, ...events.map((event) => event.year)])).sort(
        (a, b) => a - b
      ),
    [events, filterOptions.years]
  );

  const buildCalendarEventsUrl = useCallback((offset: number) => {
    const params = new URLSearchParams({
      offset: String(offset),
      limit: "20",
    });
    if (filter !== "all") params.set("programme", filter);
    if (yearFilter !== "all") params.set("year", String(yearFilter));
    if (monthFilter !== "all") params.set("month", String(monthFilter));
    return `/api/admin/calendar-events?${params.toString()}`;
  }, [filter, monthFilter, yearFilter]);

  const mergeFilterOptions = (nextOptions?: AdminCalendarEventFilterOptions) => {
    if (!nextOptions) return;
    setFilterOptions((current) => ({
      years: Array.from(new Set([...current.years, ...nextOptions.years])).sort((a, b) => a - b),
    }));
  };

  useEffect(() => {
    const controller = new AbortController();

    const loadFilteredEvents = async () => {
      setIsLoadingFilteredEvents(true);
      setError(null);
      setMessage(null);

      try {
        const response = await fetch(buildCalendarEventsUrl(0), {
          method: "GET",
          signal: controller.signal,
        });
        const result = (await response.json().catch(() => null)) as
          | {
              events?: AdminCalendarEventRow[];
              hasMore?: boolean;
              nextOffset?: number;
              filterOptions?: AdminCalendarEventFilterOptions;
              error?: string;
            }
          | null;

        if (!response.ok || !Array.isArray(result?.events)) {
          throw new Error(result?.error ?? "Could not load calendar events.");
        }

        setEvents(result.events);
        setHasMore(result.hasMore === true);
        setNextOffset(
          typeof result.nextOffset === "number" ? result.nextOffset : result.events.length
        );
        mergeFilterOptions(result.filterOptions);
      } catch (caughtError) {
        if (caughtError instanceof DOMException && caughtError.name === "AbortError") return;
        setError(
          caughtError instanceof Error ? caughtError.message : "Could not load calendar events."
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingFilteredEvents(false);
        }
      }
    };

    void loadFilteredEvents();

    return () => controller.abort();
  }, [buildCalendarEventsUrl]);

  const replaceEvent = (nextEvent: AdminCalendarEventRow) => {
    setEvents((prev) =>
      prev.map((event) =>
        event.id === nextEvent.id && event.programme === nextEvent.programme ? nextEvent : event
      )
    );
    setFilterOptions((current) => ({
      years: Array.from(new Set([...current.years, nextEvent.year])).sort((a, b) => a - b),
    }));
  };

  const handleLoadMore = async () => {
    if (isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch(buildCalendarEventsUrl(nextOffset), { method: "GET" });
      const result = (await response.json().catch(() => null)) as
        | {
            events?: AdminCalendarEventRow[];
            hasMore?: boolean;
            nextOffset?: number;
            filterOptions?: AdminCalendarEventFilterOptions;
            error?: string;
          }
        | null;

      if (!response.ok || !Array.isArray(result?.events)) {
        throw new Error(result?.error ?? "Could not load more calendar events.");
      }

      setEvents((prev) => {
        const seen = new Set(prev.map((event) => makeClientKey(event)));
        const newEvents = result.events!.filter((event) => !seen.has(makeClientKey(event)));
        return [...prev, ...newEvents];
      });
      setHasMore(result.hasMore === true);
      setNextOffset(
        typeof result.nextOffset === "number"
          ? result.nextOffset
          : nextOffset + result.events.length
      );
      mergeFilterOptions(result.filterOptions);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not load more calendar events."
      );
    } finally {
      setIsLoadingMore(false);
    }
  };

  const startEditing = (event: AdminCalendarEventRow) => {
    setEditingKey(makeClientKey(event));
    setDeleteCandidateKey(null);
    setEditForm({
      programme: event.programme,
      eventDate: event.eventDate,
      event: event.event,
    });
    setError(null);
    setMessage(null);
  };

  const cancelEditing = () => {
    setEditingKey(null);
    setEditForm(emptyForm);
  };

  const handleSaveEdit = async (event: AdminCalendarEventRow) => {
    const eventTitle = editForm.event.trim();
    if (!editForm.eventDate || !eventTitle) {
      setError("Date and event title are required.");
      setMessage(null);
      return;
    }
    const key = makeClientKey(event);
    setSavingKey(key);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/admin/calendar-events", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: event.id,
          programme: event.programme,
          eventDate: editForm.eventDate,
          event: eventTitle,
        }),
      });
      const result = (await response.json().catch(() => null)) as
        | { event?: AdminCalendarEventRow; error?: string }
        | null;

      if (!response.ok || !result?.event) {
        throw new Error(result?.error ?? "Could not update calendar event.");
      }

      replaceEvent(result.event);
      setEditingKey(null);
      setMessage("Calendar event updated.");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : "Could not update calendar event."
      );
    } finally {
      setSavingKey(null);
    }
  };

  const handleDelete = async (event: AdminCalendarEventRow) => {
    const key = makeClientKey(event);
    if (deleteCandidateKey !== key) {
      setDeleteCandidateKey(key);
      setEditingKey(null);
      setError(null);
      setMessage(null);
      return;
    }

    setSavingKey(key);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/admin/calendar-events", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: event.id, programme: event.programme }),
      });
      const result = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        throw new Error(result?.error ?? "Could not delete calendar event.");
      }

      setEvents((prev) =>
        prev.filter((row) => !(row.id === event.id && row.programme === event.programme))
      );
      setNextOffset((current) => Math.max(0, current - 1));
      setDeleteCandidateKey(null);
      setMessage("Calendar event deleted.");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : "Could not delete calendar event."
      );
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <section className="space-y-4">
      {error ? (
        <div className="rounded-xl border border-[#f2c7cf] bg-[#fff4f6] p-3 text-sm text-[#7a2334]">
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <p className="font-semibold">{error}</p>
          </div>
        </div>
      ) : null}

      {message ? (
        <div className="rounded-xl border border-[#d9f0e0] bg-[#f3fff7] p-3 text-sm text-[#17623a]">
          <p className="font-semibold">{message}</p>
        </div>
      ) : null}

      <AddCalendarEventForm
        onEventAdded={(event) => {
          setEvents((prev) => [...prev, event]);
          setNextOffset((current) => current + 1);
          setFilterOptions((current) => ({
            years: Array.from(new Set([...current.years, event.year])).sort((a, b) => a - b),
          }));
        }}
        setError={setError}
        setMessage={setMessage}
      />

      <div className="rounded-xl border border-[#e6e0ee] bg-white p-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-[#6c35c3]" aria-hidden="true" />
            <h3 className="text-base font-bold text-[#24193a]">Calendar rows</h3>
            {isLoadingFilteredEvents ? (
              <span className="text-xs font-semibold text-[#6f6384]">Loading</span>
            ) : null}
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            <select
              value={filter}
              onChange={(event) => setFilter(event.target.value as ProgrammeFilter)}
              className="h-10 rounded-lg border border-[#d7c7ef] bg-white px-3 text-sm font-semibold text-[#2a203c] outline-none ring-[#6e2ac0]/25 transition focus:ring-2"
            >
              <option value="all">All calendars</option>
              <option value="recreational">Recreational only</option>
              <option value="competition">Competition only</option>
            </select>
            <select
              value={yearFilter}
              onChange={(event) =>
                setYearFilter(event.target.value === "all" ? "all" : Number(event.target.value))
              }
              className="h-10 rounded-lg border border-[#d7c7ef] bg-white px-3 text-sm font-semibold text-[#2a203c] outline-none ring-[#6e2ac0]/25 transition focus:ring-2"
            >
              <option value="all">All years</option>
              {yearOptions.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
            <select
              value={monthFilter}
              onChange={(event) =>
                setMonthFilter(event.target.value === "all" ? "all" : Number(event.target.value))
              }
              className="h-10 rounded-lg border border-[#d7c7ef] bg-white px-3 text-sm font-semibold text-[#2a203c] outline-none ring-[#6e2ac0]/25 transition focus:ring-2"
            >
              <option value="all">All months</option>
              {MONTH_OPTIONS.map((month) => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 hidden overflow-x-auto md:block">
          <table className="min-w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-[#e8e0f2] text-xs font-bold uppercase tracking-[0.08em] text-[#6f6287]">
                <th className="px-3 py-3">Calendar</th>
                <th className="px-3 py-3">Date</th>
                <th className="px-3 py-3">Event</th>
                <th className="px-3 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEvents.map((row) => {
                const key = makeClientKey(row);
                const isEditing = editingKey === key;
                const isSaving = savingKey === key;
                const isConfirmingDelete = deleteCandidateKey === key;

                return (
                  <tr key={key} className="border-b border-[#f0eaf7] align-top last:border-b-0">
                    <td className="px-3 py-3 text-sm font-semibold text-[#24193a]">
                      {programmeLabel(row.programme)}
                    </td>
                    <td className="px-3 py-3 text-sm text-[#3a3048]">
                      {isEditing ? (
                        <div className="w-[190px]">
                          <CalendarDatePicker
                            value={editForm.eventDate}
                            onChange={(eventDate) =>
                              setEditForm((current) => ({
                                ...current,
                                eventDate,
                              }))
                            }
                            label="Select event date"
                          />
                        </div>
                      ) : (
                        formatEventDate(row.eventDate)
                      )}
                    </td>
                    <td className="px-3 py-3 text-sm text-[#3a3048]">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editForm.event}
                          onChange={(event) =>
                            setEditForm((current) => ({
                              ...current,
                              event: event.target.value,
                            }))
                          }
                          className="h-10 w-full min-w-[260px] rounded-lg border border-[#d7c7ef] bg-white px-3 text-sm text-[#2a203c] outline-none ring-[#6e2ac0]/25 transition focus:ring-2"
                        />
                      ) : (
                        row.event
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex justify-end gap-2">
                        {isEditing ? (
                          <>
                            <button
                              type="button"
                              onClick={() => void handleSaveEdit(row)}
                              disabled={isSaving}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#cfe8d8] bg-[#f3fff7] text-[#17623a] transition hover:bg-[#e8fbef] disabled:cursor-not-allowed disabled:opacity-60"
                              aria-label="Save event"
                              title="Save event"
                            >
                              <Save className="h-4 w-4" aria-hidden="true" />
                            </button>
                            <button
                              type="button"
                              onClick={cancelEditing}
                              disabled={isSaving}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#ddd4ea] bg-white text-[#6f6384] transition hover:bg-[#faf7ff] disabled:cursor-not-allowed disabled:opacity-60"
                              aria-label="Cancel edit"
                              title="Cancel edit"
                            >
                              <X className="h-4 w-4" aria-hidden="true" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => startEditing(row)}
                              disabled={isSaving}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#d9ccef] bg-[#faf7ff] text-[#5b2ca7] transition hover:bg-[#f4eeff] disabled:cursor-not-allowed disabled:opacity-60"
                              aria-label="Edit event"
                              title="Edit event"
                            >
                              <Pencil className="h-4 w-4" aria-hidden="true" />
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleDelete(row)}
                              disabled={isSaving}
                              className={[
                                "inline-flex h-9 items-center justify-center gap-2 rounded-lg border px-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60",
                                isConfirmingDelete
                                  ? "border-[#d93636] bg-[#d93636] text-white hover:bg-[#bd2d2d]"
                                  : "border-[#f2c7cf] bg-[#fff4f6] text-[#9c2440] hover:bg-[#ffe9ee]",
                              ].join(" ")}
                              aria-label="Delete event"
                              title="Delete event"
                            >
                              <Trash2 className="h-4 w-4" aria-hidden="true" />
                              {isConfirmingDelete ? "Confirm" : "Delete"}
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-4 space-y-3 md:hidden">
          {filteredEvents.map((row) => {
            const key = makeClientKey(row);
            const isEditing = editingKey === key;
            const isSaving = savingKey === key;
            const isConfirmingDelete = deleteCandidateKey === key;

            return (
              <article key={key} className="rounded-xl border border-[#e6e0ee] bg-white p-3">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#6f6287]">
                        {programmeLabel(row.programme)}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-[#24193a]">
                        {formatEventDate(row.eventDate)}
                      </p>
                    </div>
                  </div>

                  {isEditing ? (
                    <div className="space-y-2">
                      <CalendarDatePicker
                        value={editForm.eventDate}
                        onChange={(eventDate) =>
                          setEditForm((current) => ({
                            ...current,
                            eventDate,
                          }))
                        }
                        label="Select event date"
                      />
                      <input
                        type="text"
                        value={editForm.event}
                        onChange={(event) =>
                          setEditForm((current) => ({
                            ...current,
                            event: event.target.value,
                          }))
                        }
                        className="h-10 w-full rounded-lg border border-[#d7c7ef] bg-white px-3 text-sm text-[#2a203c] outline-none ring-[#6e2ac0]/25 transition focus:ring-2"
                      />
                    </div>
                  ) : (
                    <p className="break-words text-sm text-[#3a3048]">{row.event}</p>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    {isEditing ? (
                      <>
                        <button
                          type="button"
                          onClick={() => void handleSaveEdit(row)}
                          disabled={isSaving}
                          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#cfe8d8] bg-[#f3fff7] px-3 text-sm font-semibold text-[#17623a] transition hover:bg-[#e8fbef] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <Save className="h-4 w-4" aria-hidden="true" />
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={cancelEditing}
                          disabled={isSaving}
                          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#ddd4ea] bg-white px-3 text-sm font-semibold text-[#6f6384] transition hover:bg-[#faf7ff] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <X className="h-4 w-4" aria-hidden="true" />
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => startEditing(row)}
                          disabled={isSaving}
                          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#d9ccef] bg-[#faf7ff] px-3 text-sm font-semibold text-[#5b2ca7] transition hover:bg-[#f4eeff] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <Pencil className="h-4 w-4" aria-hidden="true" />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDelete(row)}
                          disabled={isSaving}
                          className={[
                            "inline-flex h-10 items-center justify-center gap-2 rounded-lg border px-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60",
                            isConfirmingDelete
                              ? "border-[#d93636] bg-[#d93636] text-white hover:bg-[#bd2d2d]"
                              : "border-[#f2c7cf] bg-[#fff4f6] text-[#9c2440] hover:bg-[#ffe9ee]",
                          ].join(" ")}
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                          {isConfirmingDelete ? "Confirm" : "Delete"}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {filteredEvents.length === 0 ? (
          <p className="mt-4 rounded-lg border border-[#e6e0ee] bg-white px-3 py-5 text-sm text-[#2a203c]/75">
            No calendar events match this filter.
          </p>
        ) : null}

        {hasMore ? (
          <div className="mt-4 flex justify-center border-t border-[#f0eaf7] pt-4">
            <button
              type="button"
              onClick={() => void handleLoadMore()}
              disabled={isLoadingMore}
              className="inline-flex min-h-10 items-center justify-center rounded-lg border border-[#d9ccef] bg-[#faf7ff] px-4 text-sm font-semibold text-[#5b2ca7] transition hover:border-[#cbb6ea] hover:bg-[#f4eeff] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoadingMore ? "Loading..." : "Show more events"}
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
