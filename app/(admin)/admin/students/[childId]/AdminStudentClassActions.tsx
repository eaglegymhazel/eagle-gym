"use client";

import { useMemo, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import type { RegisterClassTemplate } from "@/components/admin/sessionBuild";
import MoveRecreationalBookingControl from "./MoveRecreationalBookingControl";

type ActiveStudentBooking = {
  id: string;
  childId: string;
  classId: string | null;
  bookingType: string | null;
  createdAt: string | null;
  stripeCustomerId: string | null;
  className: string | null;
  weekday: string | number | null;
  startTime: string | null;
  endTime: string | null;
  durationMinutes: number | string | null;
  ageMin: number | string | null;
  ageMax: number | string | null;
  capacity: number | null;
};

type RecreationalMoveOption = {
  id: string;
  weekday: string | null;
  startTime: string | null;
  ageMin: number | string | null;
  ageMax: number | string | null;
  capacity: number | null;
  enrolledCount: number;
};

const WEEKDAY_ORDER = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

function displayText(value: string | null | undefined): string {
  return value?.trim() ? value : "Not provided";
}

function getProgrammeTag(className: string | null | undefined): "Rec" | "Comp" {
  const text = (className ?? "").toLowerCase();
  return text.includes("comp") ? "Comp" : "Rec";
}

function extractAgeBand(className: string | null | undefined): string | null {
  const match = (className ?? "").match(/\(([^)]+)\)/);
  const value = match?.[1]?.trim() || null;
  if (!value) return null;
  if (value.toLowerCase() === "comp") return null;
  return value;
}

function formatAttendingDuration(createdAt: string | null | undefined): string {
  if (!createdAt) return "Attending since unknown date";
  const start = new Date(createdAt);
  if (Number.isNaN(start.getTime())) return "Attending since unknown date";

  const now = new Date();
  const diffMs = now.getTime() - start.getTime();
  if (diffMs < 0) return "Attending recently";

  const dayMs = 24 * 60 * 60 * 1000;
  const days = Math.floor(diffMs / dayMs);
  if (days < 7) {
    const safeDays = Math.max(1, days);
    return `Attending for ${safeDays} day${safeDays === 1 ? "" : "s"}`;
  }

  const months =
    (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
  if (months < 1) {
    const weeks = Math.max(1, Math.floor(days / 7));
    return `Attending for ${weeks} week${weeks === 1 ? "" : "s"}`;
  }

  if (months < 12) {
    return `Attending for ${months} month${months === 1 ? "" : "s"}`;
  }

  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  if (remainingMonths === 0) {
    return `Attending for ${years} year${years === 1 ? "" : "s"}`;
  }
  return `Attending for ${years}y ${remainingMonths}m`;
}

function normalizeWeekday(value: string | number | null | undefined): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);
  return "";
}

function weekdaySortValue(value: string | number | null | undefined) {
  const normalized = normalizeWeekday(value);
  const index = WEEKDAY_ORDER.findIndex((weekday) => weekday === normalized);
  return index === -1 ? WEEKDAY_ORDER.length : index;
}

function formatTimeValue(value: string | null | undefined): string {
  if (!value) return "";
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
}

function formatTimeRange(startTime: string | null | undefined, endTime: string | null | undefined): string {
  const start = formatTimeValue(startTime);
  const end = formatTimeValue(endTime);
  if (start && end) return `${start}-${end}`;
  if (start) return start;
  if (end) return end;
  return "Time not set";
}

function classSort(a: RegisterClassTemplate, b: RegisterClassTemplate) {
  const weekdayCompare = weekdaySortValue(a.weekday) - weekdaySortValue(b.weekday);
  if (weekdayCompare !== 0) return weekdayCompare;
  const startCompare = (a.startTime ?? "").localeCompare(b.startTime ?? "");
  if (startCompare !== 0) return startCompare;
  return a.className.localeCompare(b.className, undefined, { sensitivity: "base" });
}

function formatClassSummary(
  programme: string | null | undefined,
  weekday: string | number | null | undefined,
  startTime: string | null | undefined,
  endTime: string | null | undefined
) {
  const safeProgramme = displayText(programme);
  const safeWeekday = normalizeWeekday(weekday) || "day not set";
  return `${safeProgramme} class on ${safeWeekday} ${formatTimeRange(startTime, endTime)}`;
}

export default function AdminStudentClassActions({
  childId,
  initialBookings,
  classOptions,
  recreationalMoveOptions,
}: {
  childId: string;
  initialBookings: ActiveStudentBooking[];
  classOptions: RegisterClassTemplate[];
  recreationalMoveOptions: RecreationalMoveOption[];
}) {
  const [bookings, setBookings] = useState(initialBookings);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [confirmedStripeAdd, setConfirmedStripeAdd] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [removeCandidate, setRemoveCandidate] = useState<ActiveStudentBooking | null>(null);
  const [confirmedStripeRemove, setConfirmedStripeRemove] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [removeError, setRemoveError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const activeClassIds = useMemo(
    () => new Set(bookings.map((booking) => booking.classId).filter((value): value is string => !!value)),
    [bookings]
  );

  const selectableClasses = useMemo(
    () =>
      classOptions
        .filter((option) => !activeClassIds.has(option.id))
        .sort(classSort),
    [activeClassIds, classOptions]
  );

  const selectedClass = selectableClasses.find((option) => option.id === selectedClassId) ?? null;

  const resetAddState = () => {
    setSelectedClassId("");
    setConfirmedStripeAdd(false);
    setAddError(null);
    setIsAdding(false);
  };

  const resetRemoveState = () => {
    setRemoveCandidate(null);
    setConfirmedStripeRemove(false);
    setRemoveError(null);
    setIsRemoving(false);
  };

  const addToClass = async () => {
    if (!selectedClassId || !confirmedStripeAdd || isAdding) return;
    setIsAdding(true);
    setAddError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/admin/class-bookings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          childId,
          classId: selectedClassId,
          confirmedStripeUpdate: true,
        }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Student could not be added to the class.");
      }

      window.location.reload();
    } catch (error) {
      setAddError(
        error instanceof Error ? error.message : "Student could not be added to the class."
      );
      setIsAdding(false);
    }
  };

  const removeFromClass = async () => {
    if (!removeCandidate || !confirmedStripeRemove || isRemoving) return;
    setIsRemoving(true);
    setRemoveError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/admin/class-bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: removeCandidate.id,
          confirmedStripeUpdate: true,
        }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Booking could not be cancelled.");
      }

      setBookings((prev) => prev.filter((booking) => booking.id !== removeCandidate.id));
      setMessage("Booking cancelled.");
      resetRemoveState();
    } catch (error) {
      setRemoveError(error instanceof Error ? error.message : "Booking could not be cancelled.");
      setIsRemoving(false);
    }
  };

  return (
    <section className="border-b border-[#e8e0f2] px-5 py-5 md:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.08em] text-[#6f6287]">
            Active bookings
          </h2>
          <p className="mt-1 text-sm text-[#5f5177]">
            Manually manage class access here. Billing and subscription changes must still be handled separately in Stripe.
          </p>
        </div>
        <Dialog.Root
          open={addDialogOpen}
          onOpenChange={(open) => {
            setAddDialogOpen(open);
            if (!open) resetAddState();
          }}
        >
          <Dialog.Trigger asChild>
            <button
              type="button"
              className="inline-flex h-10 cursor-pointer items-center justify-center border border-[#0f8d4e] bg-[#0f8d4e] px-4 text-sm font-semibold text-white transition hover:bg-[#0d7c45]"
            >
              Add to class
            </button>
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-[100] bg-black/45" />
            <Dialog.Content className="fixed inset-x-3 top-1/2 z-[101] max-h-[86vh] -translate-y-1/2 overflow-hidden border border-[#d8ceeb] bg-white shadow-2xl sm:left-1/2 sm:right-auto sm:w-[min(680px,calc(100vw-32px))] sm:-translate-x-1/2">
              <div className="border-b border-[#e8e0f2] px-4 py-4 sm:px-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Dialog.Title className="text-lg font-bold text-[#24193a]">
                      Add student to class
                    </Dialog.Title>
                    <Dialog.Description className="mt-1 text-sm text-[#5f5177]">
                      This creates an active booking in Eagle Gymnastics only. Stripe billing must already be set up separately.
                    </Dialog.Description>
                  </div>
                  <Dialog.Close asChild>
                    <button
                      type="button"
                      className="inline-flex h-9 w-9 cursor-pointer items-center justify-center border border-[#ddd4ea] text-[#6f6384] transition hover:bg-[#faf7ff]"
                      aria-label="Close add class dialog"
                    >
                      <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M6 6l12 12" />
                        <path d="M18 6l-12 12" />
                      </svg>
                    </button>
                  </Dialog.Close>
                </div>
              </div>
              <div className="max-h-[52vh] overflow-y-auto px-4 py-4 sm:px-5">
                {selectableClasses.length === 0 ? (
                  <p className="text-sm text-[#5f5177]">No additional classes are available for this student.</p>
                ) : (
                  <div className="space-y-2" role="radiogroup" aria-label="Available classes">
                    {selectableClasses.map((option) => {
                      const isSelected = selectedClassId === option.id;
                      return (
                        <label
                          key={option.id}
                          className={[
                            "flex cursor-pointer items-start gap-3 border px-3 py-3 transition",
                            isSelected
                              ? "border-[#bfa7e6] bg-[#f7f2ff] shadow-[0_8px_18px_-16px_rgba(79,35,144,0.5)]"
                              : "border-[#ece4f5] bg-white hover:bg-[#fcfafe]",
                          ].join(" ")}
                        >
                          <input
                            type="radio"
                            name="target-class"
                            value={option.id}
                            checked={isSelected}
                            onChange={() => setSelectedClassId(option.id)}
                            className="mt-0.5 h-4 w-4 accent-[#6c35c3]"
                          />
                          <span className="min-w-0">
                            <span className="block text-sm font-semibold text-[#24193a]">
                              {(normalizeWeekday(option.weekday) || "Day not set") +
                                " " +
                                (formatTimeValue(option.startTime) || "Time not set")}
                            </span>
                            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-[#6c607d]">
                              <span>{option.programme}</span>
                              <span>{formatTimeRange(option.startTime, option.endTime)}</span>
                              {option.programme === "Recreational" ? <span>{option.ageBand}</span> : null}
                              <span>{option.enrolledCount} active</span>
                            </div>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}
                <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border border-[#f0c9ce] bg-[#fff6f7] p-3 text-sm text-[#6a1f35] transition hover:bg-[#fff0f2]">
                  <input
                    type="checkbox"
                    checked={confirmedStripeAdd}
                    onChange={(event) => setConfirmedStripeAdd(event.target.checked)}
                    className="mt-0.5 h-4 w-4 cursor-pointer rounded border-[#cdbfe0] text-[#6c35c3] focus:ring-[#6c35c3]"
                  />
                  <span className="font-medium">
                    I confirm Stripe billing/subscription setup has already been handled manually.
                  </span>
                </label>
                {addError ? <p className="mt-3 text-sm font-medium text-[#a72020]">{addError}</p> : null}
                {selectedClass ? (
                  <p className="mt-3 text-sm font-semibold text-[#3c3151]">
                    Selected class:{" "}
                    {formatClassSummary(
                      selectedClass.programme,
                      selectedClass.weekday,
                      selectedClass.startTime,
                      selectedClass.endTime
                    )}
                    .
                  </p>
                ) : null}
              </div>
              <div className="border-t border-[#e8e0f2] px-4 py-4 sm:px-5">
                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <Dialog.Close asChild>
                    <button
                      type="button"
                      disabled={isAdding}
                      className="h-10 cursor-pointer border border-[#ddd4ea] bg-white px-4 text-sm font-semibold text-[#6f6384] hover:bg-[#faf7ff] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Cancel
                    </button>
                  </Dialog.Close>
                  <button
                    type="button"
                    onClick={() => void addToClass()}
                    disabled={!selectedClassId || !confirmedStripeAdd || isAdding}
                    className={[
                      "h-10 border px-4 text-sm font-semibold transition",
                      selectedClassId && confirmedStripeAdd && !isAdding
                        ? "cursor-pointer border-[#0f8d4e] bg-[#0f8d4e] text-white hover:bg-[#0d7c45]"
                        : "cursor-not-allowed border-[#e9e4f0] bg-[#f8f6fb] text-[#a095b0]",
                    ].join(" ")}
                  >
                    {isAdding ? "Adding..." : "Add to class"}
                  </button>
                </div>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>

      {message ? (
        <div className="mt-3 rounded-lg border border-[#d7c7ef] bg-[#f6f1ff] px-3 py-2 text-sm text-[#2a203c]">
          {message}
        </div>
      ) : null}

      {bookings.length === 0 ? (
        <p className="mt-3 text-sm text-[#5f5177]">No active bookings found.</p>
      ) : (
        <ul className="mt-3 divide-y divide-[#ece4f5] border border-[#ece4f5]">
          {bookings.map((booking, index) => {
            const programme = getProgrammeTag(booking.className);
            const ageBand = extractAgeBand(booking.className);
            const weekdayText = displayText(normalizeWeekday(booking.weekday) || null);
            const timeText = formatTimeRange(booking.startTime, booking.endTime);

            return (
              <li
                key={booking.id ?? `${booking.childId}-${booking.className ?? "class"}-${index}`}
                className="flex flex-col gap-2 px-4 py-3 md:flex-row md:items-center md:justify-between md:gap-3"
              >
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[#221833]">
                    <span
                      className={[
                        "inline-flex items-center gap-1 text-sm font-semibold leading-none",
                        programme === "Comp" ? "text-[#c89200]" : "text-[#0f8d4e]",
                      ].join(" ")}
                    >
                      {programme}
                    </span>
                    <span className="text-sm font-semibold leading-none">{weekdayText}</span>
                    <span className="text-sm font-medium leading-none text-[#322843]">{timeText}</span>
                    {programme === "Rec" && ageBand ? (
                      <span className="text-xs font-normal leading-none text-[#6e6383]">{ageBand}</span>
                    ) : null}
                  </p>
                  <p className="mt-1 text-xs font-medium leading-tight text-[#6e6383]">
                    {formatAttendingDuration(booking.createdAt).replace("Attending for ", "Attending ")}
                  </p>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center md:flex-shrink-0">
                  {booking.bookingType === "recreational" && booking.classId ? (
                    <MoveRecreationalBookingControl
                      bookingId={booking.id}
                      currentClassId={booking.classId}
                      options={recreationalMoveOptions}
                    />
                  ) : null}
                  <button
                    type="button"
                    onClick={() => {
                      setRemoveCandidate(booking);
                      setConfirmedStripeRemove(false);
                      setRemoveError(null);
                      setMessage(null);
                    }}
                    className="h-8 cursor-pointer border border-[#d93636] bg-[#d93636] px-2.5 text-xs font-semibold text-white transition hover:bg-[#bd2d2d]"
                  >
                    Remove from class
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Dialog.Root
        open={removeCandidate !== null}
        onOpenChange={(open) => {
          if (!open && !isRemoving) resetRemoveState();
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[100] bg-black/45" />
          <Dialog.Content className="fixed inset-x-3 top-1/2 z-[101] max-h-[86vh] -translate-y-1/2 overflow-hidden border border-[#d8ceeb] bg-white shadow-2xl sm:left-1/2 sm:right-auto sm:w-[min(560px,calc(100vw-32px))] sm:-translate-x-1/2">
            <div className="border-b border-[#e8e0f2] px-4 py-4 sm:px-5">
              <div>
                <Dialog.Title className="text-lg font-bold text-[#24193a]">
                  Remove from class
                </Dialog.Title>
                <Dialog.Description className="mt-1 text-sm text-[#5f5177]">
                  This updates the booking in Eagle Gymnastics only. Refunds and subscription changes must be handled separately in Stripe.
                </Dialog.Description>
              </div>
            </div>
            <div className="space-y-4 px-4 py-4 sm:px-5">
              <p className="text-sm text-[#342744]">
                Remove this student from{" "}
                <span className="font-semibold text-[#24193a]">
                  {removeCandidate
                    ? `${displayText(normalizeWeekday(removeCandidate.weekday) || null)} ${formatTimeRange(
                        removeCandidate.startTime,
                        removeCandidate.endTime
                      )}`
                    : "this class"}
                </span>
                ?
              </p>
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#f0c9ce] bg-[#fff6f7] p-3 text-sm text-[#6a1f35] transition hover:bg-[#fff0f2]">
                <input
                  type="checkbox"
                  checked={confirmedStripeRemove}
                  onChange={(event) => setConfirmedStripeRemove(event.target.checked)}
                  className="mt-0.5 h-4 w-4 cursor-pointer rounded border-[#cdbfe0] text-[#6c35c3] focus:ring-[#6c35c3]"
                />
                <span className="font-medium">
                  I confirm Stripe payments and subscriptions have already been updated separately.
                </span>
              </label>
              {removeError ? <p className="text-sm font-medium text-[#a72020]">{removeError}</p> : null}
            </div>
            <div className="border-t border-[#e8e0f2] px-4 py-4 sm:px-5">
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Dialog.Close asChild>
                  <button
                    type="button"
                    disabled={isRemoving}
                    className="h-10 cursor-pointer border border-[#ddd4ea] bg-white px-4 text-sm font-semibold text-[#6f6384] hover:bg-[#faf7ff] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Keep booking
                  </button>
                </Dialog.Close>
                <button
                  type="button"
                  onClick={() => void removeFromClass()}
                  disabled={!removeCandidate || !confirmedStripeRemove || isRemoving}
                  className={[
                    "h-10 border px-4 text-sm font-semibold transition",
                    removeCandidate && confirmedStripeRemove && !isRemoving
                      ? "cursor-pointer border-[#d93636] bg-[#d93636] text-white hover:bg-[#bd2d2d]"
                      : "cursor-not-allowed border-[#eadada] bg-[#f8f6fb] text-[#b79a9a]",
                  ].join(" ")}
                >
                  {isRemoving ? "Removing..." : "Remove booking"}
                </button>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </section>
  );
}
