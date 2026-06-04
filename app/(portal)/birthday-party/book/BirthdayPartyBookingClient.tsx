"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertCircle, ArrowLeft, ArrowRight, CalendarDays } from "lucide-react";
import { loadBirthdayPartyDraft, saveBirthdayPartyDraft } from "./draft";

export type BirthdayPartyBookingSlotOption = {
  id: string;
  slotDate: string;
  startTime: string;
  endTime: string;
  formattedDate: string;
  formattedTime: string;
};

export type BirthdayPartyBookingCalendarSlot = BirthdayPartyBookingSlotOption & {
  isAvailable: boolean;
};

type BirthdayPartyBookingClientProps = {
  accountName: string;
  slots: BirthdayPartyBookingSlotOption[];
  calendarSlots: BirthdayPartyBookingCalendarSlot[];
  selectedSlotId?: string;
};

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function getMonthKeyFromDateKey(dateKey: string): string {
  const [year, month] = dateKey.split("-");
  return `${year}-${Number.parseInt(month ?? "1", 10)}`;
}

export default function BirthdayPartyBookingClient({
  accountName,
  slots,
  calendarSlots,
  selectedSlotId,
}: BirthdayPartyBookingClientProps) {
  const router = useRouter();
  const [slotId, setSlotId] = useState<string>(selectedSlotId ?? slots[0]?.id ?? "");
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    const savedDraft = loadBirthdayPartyDraft();
    if (!savedDraft) return;

    if (savedDraft.slotId && slots.some((slot) => slot.id === savedDraft.slotId)) {
      setSlotId(savedDraft.slotId);
    }
  }, [slots]);

  useEffect(() => {
    if (selectedSlotId && slots.some((slot) => slot.id === selectedSlotId)) {
      setSlotId(selectedSlotId);
    }
  }, [selectedSlotId, slots]);

  const selectedSlot = useMemo(
    () => slots.find((slot) => slot.id === slotId) ?? null,
    [slotId, slots]
  );

  const calendarMonths = useMemo(() => {
    if (calendarSlots.length === 0) return [];

    const slotByDate = new Map(calendarSlots.map((slot) => [slot.slotDate, slot]));
    const firstSlotDate = new Date(`${calendarSlots[0].slotDate}T12:00:00Z`);
    const lastSlotDate = new Date(`${calendarSlots[calendarSlots.length - 1].slotDate}T12:00:00Z`);
    const startMonth = new Date(Date.UTC(firstSlotDate.getUTCFullYear(), firstSlotDate.getUTCMonth(), 1));
    const endMonth = new Date(Date.UTC(lastSlotDate.getUTCFullYear(), lastSlotDate.getUTCMonth(), 1));
    const months: Array<{
      key: string;
      label: string;
      weeks: Array<Array<{
        key: string;
        dateKey: string;
        dayNumber: number;
        inCurrentMonth: boolean;
        slot: BirthdayPartyBookingCalendarSlot | null;
        isSaturday: boolean;
      }>>;
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
          isSaturday: date.getUTCDay() === 6,
        };
      });

      const weeks = Array.from({ length: cells.length / 7 }, (_, index) =>
        cells.slice(index * 7, index * 7 + 7)
      );

      months.push({
        key: `${year}-${month + 1}`,
        label: new Intl.DateTimeFormat("en-GB", {
          month: "long",
          year: "numeric",
          timeZone: "UTC",
        }).format(monthDate),
        weeks,
      });
    }

    return months;
  }, [calendarSlots]);

  const [activeMonthIndex, setActiveMonthIndex] = useState(0);

  useEffect(() => {
    if (calendarMonths.length === 0) return;
    const selectedIndex = selectedSlot
      ? calendarMonths.findIndex((month) => month.key === getMonthKeyFromDateKey(selectedSlot.slotDate))
      : 0;
    setActiveMonthIndex(selectedIndex >= 0 ? selectedIndex : 0);
  }, [calendarMonths, selectedSlot]);

  const activeMonth = calendarMonths[activeMonthIndex] ?? null;

  const handleContinue = () => {
    if (!slotId) {
      setValidationError("Please choose an available birthday party date.");
      return;
    }

    const savedDraft = loadBirthdayPartyDraft();
    saveBirthdayPartyDraft({
      slotId,
      partySize: savedDraft?.partySize ?? null,
      birthdayChildFirstName: savedDraft?.birthdayChildFirstName ?? "",
      birthdayChildLastName: savedDraft?.birthdayChildLastName ?? "",
      birthdayChildDateOfBirth: savedDraft?.birthdayChildDateOfBirth ?? "",
      healthNotes: savedDraft?.healthNotes ?? "",
      specialRequirements: savedDraft?.specialRequirements ?? "",
      additionalNotes: savedDraft?.additionalNotes ?? "",
    });

    setValidationError(null);
    router.push(`/birthday-party/book/details?slotId=${encodeURIComponent(slotId)}`);
  };

  return (
    <section className="relative w-full overflow-hidden bg-[#faf7fb] px-4 pb-12 pt-4 sm:px-6 sm:pt-6">
      <div className="relative z-10 mx-auto w-full max-w-[1040px] space-y-5 sm:space-y-6">
        <header className="space-y-3">
          <p className="text-[1.75rem] font-black uppercase tracking-[0.04em] text-[#b42348] sm:text-[2.1rem]">
            Birthday Party Booking
          </p>
          <div className="inline-flex items-center rounded-full border border-[#6c35c3]/25 bg-white/85 px-4 py-1.5 text-sm font-semibold uppercase tracking-[0.18em] text-[#2a203c]/70 shadow-[0_12px_28px_-18px_rgba(31,26,37,0.5)] backdrop-blur">
            Booking account
            <span className="ml-1 font-bold text-[#2a203c]">{accountName}</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/account"
              className="inline-flex items-center gap-2 rounded-full border border-[#d8c7f4] bg-white px-4 py-2 text-sm font-semibold text-[#5b2ca7] transition hover:bg-[#faf6ff]"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back to account
            </Link>
          </div>
          <div className="pt-1">
            <div className="h-[0.5px] w-full bg-black/20" />
          </div>
        </header>

        {validationError ? (
          <div className="rounded-2xl border border-[#f2c7cf] bg-[#fff4f6] p-4 text-sm text-[#7a2334]">
            <div className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <p className="font-semibold">{validationError}</p>
            </div>
          </div>
        ) : null}

        <div className="space-y-5 pb-28 sm:pb-32">
          <section className="rounded-2xl border border-[#e7e1f1] bg-white p-5 shadow-[0_10px_24px_-20px_rgba(34,24,56,0.36)] sm:p-6">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-[#b42348]" aria-hidden="true" />
              <h2 className="text-lg font-black text-[#1f1a25]">Choose an available date</h2>
            </div>
            {calendarSlots.length === 0 ? (
              <p className="mt-4 rounded-2xl border border-dashed border-[#dfd6eb] px-4 py-5 text-sm text-[#716586]">
                There are no birthday party dates available to book right now.
              </p>
            ) : (
              <>
                <div className="mt-4 flex flex-wrap gap-3 text-xs font-semibold text-[#5f4a82]">
                  <div className="inline-flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-[#2f9e44]" />
                    Available Saturday
                  </div>
                  <div className="inline-flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-[#d9485f]" />
                    Unavailable Saturday
                  </div>
                </div>
                {activeMonth ? (
                  <div className="mt-4 rounded-2xl border border-[#eee6f7] bg-[#fcfbff] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => setActiveMonthIndex((current) => Math.max(0, current - 1))}
                        disabled={activeMonthIndex === 0}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#ddd0f0] bg-white text-[#5b2ca7] transition hover:bg-[#faf6ff] disabled:cursor-not-allowed disabled:opacity-45"
                        aria-label="Previous month"
                      >
                        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                      </button>
                      <h3 className="text-base font-black text-[#143271]">{activeMonth.label}</h3>
                      <button
                        type="button"
                        onClick={() =>
                          setActiveMonthIndex((current) => Math.min(calendarMonths.length - 1, current + 1))
                        }
                        disabled={activeMonthIndex >= calendarMonths.length - 1}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#ddd0f0] bg-white text-[#5b2ca7] transition hover:bg-[#faf6ff] disabled:cursor-not-allowed disabled:opacity-45"
                        aria-label="Next month"
                      >
                        <ArrowRight className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                    <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase tracking-[0.14em] text-[#7d7390]">
                      {WEEKDAY_LABELS.map((label) => (
                        <span key={label}>{label}</span>
                      ))}
                    </div>
                    <div className="mt-2 space-y-1">
                      {activeMonth.weeks.map((week, weekIndex) => (
                        <div key={`${activeMonth.key}-week-${weekIndex}`} className="grid grid-cols-7 gap-1">
                          {week.map((day) => {
                            const isSelected = day.slot?.id === slotId;
                            const isAvailableSaturday = !!day.slot?.isAvailable;
                            const isUnavailableSaturday = !!day.slot && day.isSaturday && !day.slot.isAvailable;

                            const baseClass = day.inCurrentMonth
                              ? "border"
                              : "border border-transparent bg-transparent text-[#c0b7cf]";
                            const stateClass = isSelected
                              ? "border-[#6c35c3] bg-[#6c35c3] text-white shadow-[0_10px_18px_-12px_rgba(108,53,195,0.65)]"
                              : isAvailableSaturday
                                ? "border-[#bfe7c7] bg-[#edf9f0] text-[#20663a] hover:border-[#2f9e44] hover:bg-[#def4e3]"
                                : isUnavailableSaturday
                                  ? "border-[#f1c7cf] bg-[#fff1f3] text-[#a33148]"
                                  : "border-[#efe7f7] bg-white text-[#2a203c]";

                            if (isAvailableSaturday && day.slot) {
                              return (
                                <button
                                  key={day.key}
                                  type="button"
                                  onClick={() => setSlotId(day.slot!.id)}
                                  className={`aspect-square rounded-xl px-1 text-sm font-semibold transition ${baseClass} ${stateClass}`}
                                  title={`${day.slot.formattedDate} ${day.slot.formattedTime}`}
                                >
                                  {day.dayNumber}
                                </button>
                              );
                            }

                            return (
                              <div
                                key={day.key}
                                className={`aspect-square rounded-xl px-1 text-sm font-semibold ${baseClass} ${stateClass}`}
                                title={isUnavailableSaturday ? "Unavailable" : undefined}
                              >
                                <div className="flex h-full items-center justify-center">{day.dayNumber}</div>
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </>
            )}
          </section>
        </div>
      </div>
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[#e7e1f1] bg-white/96 px-4 pb-[calc(0.85rem+env(safe-area-inset-bottom))] pt-3 shadow-[0_-16px_32px_-24px_rgba(34,24,56,0.42)] backdrop-blur">
        <div className="mx-auto flex w-full max-w-[1040px] items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-black uppercase tracking-[0.12em] text-[#6c35c3]">
              Booking Summary
            </p>
            <p className="truncate text-sm font-semibold text-[#2E2A33]">
              {selectedSlot ? `${selectedSlot.formattedDate} · ${selectedSlot.formattedTime}` : "Choose a Saturday"}
            </p>
            <p className="text-[11px] text-[#6a5a86]">
              Party details will be collected on the next step.
            </p>
          </div>

          <button
            type="button"
            onClick={handleContinue}
            disabled={slots.length === 0}
            className="inline-flex h-11 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-full bg-[#6c35c3] px-5 text-sm font-semibold text-white !text-white shadow-[0_12px_24px_-12px_rgba(69,34,124,0.78)] transition hover:bg-[#5b2ca7] disabled:cursor-not-allowed disabled:bg-[#c5addf] disabled:!text-white"
          >
            Next
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  );
}
