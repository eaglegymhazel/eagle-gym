"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, ArrowLeft, ArrowRight, CalendarDays } from "lucide-react";
import type { BirthdayPartyCalendarSlotSummary } from "@/lib/server/birthdayPartyBookings";

type BirthdayPartyAvailabilityManagerProps = {
  initialSlots: BirthdayPartyCalendarSlotSummary[];
};

type AvailabilityState =
  | "available"
  | "blocked"
  | "payment-hold"
  | "booked"
  | "unavailable";

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function getMonthKeyFromDateKey(dateKey: string): string {
  const [year, month] = dateKey.split("-");
  return `${year}-${Number.parseInt(month ?? "1", 10)}`;
}

function formatDate(value: string): string {
  const parsed = new Date(`${value}T12:00:00Z`);
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(parsed);
}

function formatTimeRange(startTime: string, endTime: string): string {
  const formatOne = (value: string) => {
    const [hourRaw, minuteRaw] = value.split(":");
    const hour = Number.parseInt(hourRaw ?? "", 10);
    const minute = Number.parseInt(minuteRaw ?? "", 10);
    if (Number.isNaN(hour) || Number.isNaN(minute)) return value;
    const date = new Date(Date.UTC(1970, 0, 1, hour, minute, 0, 0));
    return new Intl.DateTimeFormat("en-GB", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: "UTC",
    })
      .format(date)
      .replace(":00", "")
      .replace(" ", "")
      .toLowerCase();
  };

  return `${formatOne(startTime)}-${formatOne(endTime)}`;
}

function getAvailabilityState(
  slot: BirthdayPartyCalendarSlotSummary,
  nowIso: string
): AvailabilityState {
  if (slot.isBlocked) return "blocked";
  if (
    slot.bookingState === "payment-hold" &&
    slot.holdExpiresAt &&
    slot.holdExpiresAt > nowIso
  ) {
    return "payment-hold";
  }
  if (slot.bookingState === "booked") return "booked";
  if (
    slot.bookingState === "payment-hold" &&
    (!slot.holdExpiresAt || slot.holdExpiresAt <= nowIso)
  ) {
    return "available";
  }
  if (slot.isAvailable) return "available";
  return "unavailable";
}

export default function BirthdayPartyAvailabilityManager({
  initialSlots,
}: BirthdayPartyAvailabilityManagerProps) {
  const [slots, setSlots] = useState(initialSlots);
  const [selectedSlotId, setSelectedSlotId] = useState(initialSlots[0]?.id ?? "");
  const [blockingReason, setBlockingReason] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [nowIso, setNowIso] = useState(() => new Date().toISOString());

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNowIso(new Date().toISOString());
    }, 15_000);
    return () => window.clearInterval(timer);
  }, []);

  const calendarMonths = useMemo(() => {
    if (slots.length === 0) return [];

    const slotByDate = new Map(slots.map((slot) => [slot.slotDate, slot]));
    const firstSlotDate = new Date(`${slots[0].slotDate}T12:00:00Z`);
    const lastSlotDate = new Date(`${slots[slots.length - 1].slotDate}T12:00:00Z`);
    const startMonth = new Date(Date.UTC(firstSlotDate.getUTCFullYear(), firstSlotDate.getUTCMonth(), 1));
    const endMonth = new Date(Date.UTC(lastSlotDate.getUTCFullYear(), lastSlotDate.getUTCMonth(), 1));

    const months: Array<{
      key: string;
      label: string;
      weeks: Array<
        Array<{
          key: string;
          dateKey: string;
          dayNumber: number;
          inCurrentMonth: boolean;
          slot: BirthdayPartyCalendarSlotSummary | null;
          isBookableDay: boolean;
        }>
      >;
    }> = [];

    for (
      let monthDate = new Date(startMonth);
      monthDate <= endMonth;
      monthDate = new Date(Date.UTC(monthDate.getUTCFullYear(), monthDate.getUTCMonth() + 1, 1))
    ) {
      const year = monthDate.getUTCFullYear();
      const month = monthDate.getUTCMonth();
      const monthStart = new Date(Date.UTC(year, month, 1));
      const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
      const startOffset = (monthStart.getUTCDay() + 6) % 7;
      const totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7;
      const cells = Array.from({ length: totalCells }, (_, index) => {
        const dayOffset = index - startOffset;
        const date = new Date(Date.UTC(year, month, dayOffset + 1));
        const dateKey = date.toISOString().slice(0, 10);
        return {
          key: `${year}-${month}-${index}`,
          dateKey,
          dayNumber: date.getUTCDate(),
          inCurrentMonth: date.getUTCMonth() === month,
          slot: slotByDate.get(dateKey) ?? null,
          isBookableDay: date.getUTCDay() === 6,
        };
      });

      months.push({
        key: `${year}-${month + 1}`,
        label: new Intl.DateTimeFormat("en-GB", {
          month: "long",
          year: "numeric",
          timeZone: "UTC",
        }).format(monthDate),
        weeks: Array.from({ length: cells.length / 7 }, (_, index) => cells.slice(index * 7, index * 7 + 7)),
      });
    }

    return months;
  }, [slots]);

  const [activeMonthIndex, setActiveMonthIndex] = useState(0);

  const selectedSlot = useMemo(
    () => slots.find((slot) => slot.id === selectedSlotId) ?? null,
    [selectedSlotId, slots]
  );

  useEffect(() => {
    if (calendarMonths.length === 0) return;
    const selectedIndex = selectedSlot
      ? calendarMonths.findIndex((month) => month.key === getMonthKeyFromDateKey(selectedSlot.slotDate))
      : 0;
    setActiveMonthIndex(selectedIndex >= 0 ? selectedIndex : 0);
  }, [calendarMonths, selectedSlot]);

  useEffect(() => {
    setBlockingReason(selectedSlot?.blockedReason ?? "");
  }, [selectedSlot?.id, selectedSlot?.blockedReason]);

  const activeMonth = calendarMonths[activeMonthIndex] ?? null;

  const handleBlockToggle = async () => {
    if (!selectedSlot) return;

    const payload = {
      slotDate: selectedSlot.slotDate,
      startTime: selectedSlot.startTime,
      endTime: selectedSlot.endTime,
      reason: blockingReason.trim(),
    };

    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const response = await fetch("/api/admin/birthday-party-availability", {
        method: selectedSlot.isBlocked ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = (await response.json().catch(() => null)) as
        | { error?: string; slot?: BirthdayPartyCalendarSlotSummary }
        | null;

      if (!response.ok || !result?.slot) {
        throw new Error(result?.error ?? "Could not update birthday party availability.");
      }

      setSlots((prev) =>
        prev.map((slot) => (slot.id === result.slot?.id ? result.slot : slot))
      );
      setSuccessMessage(
        selectedSlot.isBlocked ? "Date restored for birthday parties." : "Date blocked for birthday parties."
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Could not update birthday party availability."
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="rounded-xl border border-[#e6e0ee] bg-white p-4 shadow-[0_10px_24px_-20px_rgba(34,24,56,0.36)]">
      <div className="flex items-center gap-2">
        <CalendarDays className="h-4 w-4 text-[#6c35c3]" aria-hidden="true" />
        <h3 className="text-base font-bold text-[#24193a]">Manage availability</h3>
      </div>
      <p className="mt-2 text-sm text-[#5f5177]">
        Block or reopen birthday party dates without leaving the admin dashboard.
      </p>

      <div className="mt-4 flex flex-wrap gap-3 text-xs font-semibold text-[#5f4a82]">
        <div className="inline-flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-[#2f9e44]" />
          Available
        </div>
        <div className="inline-flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-[#d9485f]" />
          Blocked
        </div>
        <div className="inline-flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-[#c58f00]" />
          Payment in progress
        </div>
        <div className="inline-flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-[#7c5db5]" />
          Booked
        </div>
        <div className="inline-flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-[#9a91a8]" />
          Unavailable
        </div>
      </div>

      {errorMessage ? (
        <div className="mt-4 rounded-xl border border-[#f2c7cf] bg-[#fff4f6] p-3 text-sm text-[#7a2334]">
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <p className="font-semibold">{errorMessage}</p>
          </div>
        </div>
      ) : null}

      {successMessage ? (
        <div className="mt-4 rounded-xl border border-[#d9f0e0] bg-[#f3fff7] p-3 text-sm text-[#17623a]">
          <p className="font-semibold">{successMessage}</p>
        </div>
      ) : null}

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="rounded-2xl border border-[#e7e1f1] bg-[#fcfbff] p-4">
          {activeMonth ? (
            <>
              <div className="mb-4 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setActiveMonthIndex((index) => Math.max(0, index - 1))}
                  disabled={activeMonthIndex === 0}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#d9ccef] bg-white text-[#5b2ca7] transition hover:bg-[#faf7ff] disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Previous month"
                >
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                </button>
                <h4 className="text-lg font-black text-[#1f1a25]">{activeMonth.label}</h4>
                <button
                  type="button"
                  onClick={() =>
                    setActiveMonthIndex((index) => Math.min(calendarMonths.length - 1, index + 1))
                  }
                  disabled={activeMonthIndex >= calendarMonths.length - 1}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#d9ccef] bg-white text-[#5b2ca7] transition hover:bg-[#faf7ff] disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Next month"
                >
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>

              <div className="grid grid-cols-7 gap-2 text-center text-[11px] font-bold uppercase tracking-[0.12em] text-[#7e7193]">
                {WEEKDAY_LABELS.map((label) => (
                  <span key={label}>{label}</span>
                ))}
              </div>

              <div className="mt-3 space-y-2">
                {activeMonth.weeks.map((week, weekIndex) => (
                  <div key={`${activeMonth.key}-week-${weekIndex}`} className="grid grid-cols-7 gap-2">
                    {week.map((day) => {
                      const isSelected = day.slot?.id === selectedSlotId;
                      const state = day.slot
                        ? getAvailabilityState(day.slot, nowIso)
                        : null;
                      const tintClasses =
                        state === "available"
                          ? "border-[#b6dfc1] bg-[#f3fff7] text-[#17623a]"
                          : state === "blocked"
                            ? "border-[#f2c1cb] bg-[#fff4f6] text-[#9c2440]"
                            : state === "booked"
                              ? "border-[#d8ccef] bg-[#f7f3fd] text-[#5b3f8d]"
                              : state === "payment-hold"
                                ? "border-[#f1dc9f] bg-[#fff9e8] text-[#8b6200]"
                              : "border-[#ece6f4] bg-white text-[#b0a5c4]";

                      return day.slot ? (
                        <button
                          key={day.key}
                          type="button"
                          onClick={() => {
                            setSelectedSlotId(day.slot?.id ?? "");
                            setErrorMessage(null);
                            setSuccessMessage(null);
                          }}
                          className={[
                            "min-h-[76px] rounded-2xl border p-2 text-left transition",
                            tintClasses,
                            isSelected ? "ring-2 ring-[#6c35c3]/30" : "",
                          ].join(" ")}
                        >
                          <span className="block text-sm font-black">{day.dayNumber}</span>
                          <span className="mt-2 block text-[11px] font-semibold uppercase tracking-[0.08em]">
                            {state === "payment-hold"
                              ? "Payment hold"
                              : state}
                          </span>
                        </button>
                      ) : (
                        <div
                          key={day.key}
                          className={[
                            "min-h-[76px] rounded-2xl border p-2 text-left",
                            day.inCurrentMonth && day.isBookableDay
                              ? "border-[#ece6f4] bg-white text-[#c1b8d1]"
                              : "border-transparent bg-transparent text-transparent",
                          ].join(" ")}
                        >
                          {day.inCurrentMonth && day.isBookableDay ? (
                            <span className="block text-sm font-black text-[#b0a5c4]">{day.dayNumber}</span>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-[#5f5177]">No birthday party dates are available to manage yet.</p>
          )}
        </div>

        <aside className="rounded-2xl border border-[#e7e1f1] bg-white p-4">
          <h4 className="text-base font-black text-[#1f1a25]">Selected date</h4>
          {selectedSlot ? (
            <div className="mt-3 space-y-4">
              <div>
                <p className="text-sm font-semibold text-[#24193a]">{formatDate(selectedSlot.slotDate)}</p>
                <p className="mt-1 text-sm text-[#5f5177]">
                  {formatTimeRange(selectedSlot.startTime, selectedSlot.endTime)}
                </p>
                <p className="mt-2 text-xs font-semibold uppercase tracking-[0.1em] text-[#6f6287]">
                  {getAvailabilityState(selectedSlot, nowIso) === "payment-hold"
                    ? "Payment in progress"
                    : getAvailabilityState(selectedSlot, nowIso)}
                </p>
              </div>

              {getAvailabilityState(selectedSlot, nowIso) === "payment-hold" ? (
                <div className="rounded-xl border border-[#f1dc9f] bg-[#fff9e8] p-3 text-sm text-[#8b6200]">
                  A customer is currently completing payment for this slot. The hold will release automatically if payment is not completed.
                </div>
              ) : getAvailabilityState(selectedSlot, nowIso) === "booked" ? (
                <div className="rounded-xl border border-[#d8ccef] bg-[#f7f3fd] p-3 text-sm text-[#5b3f8d]">
                  This date has a confirmed booking and cannot be blocked here.
                </div>
              ) : getAvailabilityState(selectedSlot, nowIso) === "unavailable" ? (
                <div className="rounded-xl border border-[#e3dee9] bg-[#f7f5f9] p-3 text-sm text-[#6b6275]">
                  This date is currently unavailable to customers, for example because it falls inside the booking notice period.
                </div>
              ) : (
                <>
                  <label className="block text-sm font-semibold text-[#2a203c]">
                    Block reason
                    <textarea
                      value={blockingReason}
                      onChange={(event) => setBlockingReason(event.target.value)}
                      rows={4}
                      placeholder="Optional note for why this date is unavailable"
                      className="mt-2 w-full rounded-xl border border-[#d7c7ef] bg-white px-3 py-2 text-sm text-[#2a203c] outline-none ring-[#6e2ac0]/25 transition focus:ring-2"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={() => void handleBlockToggle()}
                    disabled={isSaving}
                    className={[
                      "inline-flex min-h-11 w-full items-center justify-center rounded-xl px-4 text-sm font-semibold transition",
                      selectedSlot.isBlocked
                        ? "border border-[#d7c7ef] bg-white text-[#5b2ca7] hover:bg-[#faf7ff]"
                        : "bg-[#6c35c3] text-white hover:bg-[#5b2ca7]",
                      isSaving ? "cursor-not-allowed opacity-60" : "",
                    ].join(" ")}
                  >
                    {isSaving
                      ? "Saving..."
                      : selectedSlot.isBlocked
                        ? "Reopen date"
                        : "Block this date"}
                  </button>
                </>
              )}
            </div>
          ) : (
            <p className="mt-3 text-sm text-[#5f5177]">Select a date on the calendar to manage availability.</p>
          )}
        </aside>
      </div>
    </section>
  );
}
