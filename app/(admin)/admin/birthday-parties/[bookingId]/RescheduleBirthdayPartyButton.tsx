"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { CalendarClock } from "lucide-react";

export type AvailableBirthdayPartySlot = {
  id: string;
  slotDate: string;
  startTime: string;
  endTime: string;
};

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

function formatTime(value: string): string {
  const [hourRaw, minuteRaw] = value.split(":");
  const hour = Number.parseInt(hourRaw ?? "", 10);
  const minute = Number.parseInt(minuteRaw ?? "", 10);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return value;

  return new Intl.DateTimeFormat("en-GB", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "UTC",
  })
    .format(new Date(Date.UTC(1970, 0, 1, hour, minute)))
    .replace(":00", "")
    .replace(" ", "")
    .toLowerCase();
}

function formatSlot(slot: AvailableBirthdayPartySlot): string {
  return `${formatDate(slot.slotDate)} | ${formatTime(slot.startTime)}-${formatTime(slot.endTime)}`;
}

export default function RescheduleBirthdayPartyButton({
  bookingId,
  childName,
  currentSlotLabel,
  availableSlots,
}: {
  bookingId: string;
  childName: string;
  currentSlotLabel: string;
  availableSlots: AvailableBirthdayPartySlot[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selectedSlotId, setSelectedSlotId] = useState(availableSlots[0]?.id ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedSlot = useMemo(
    () => availableSlots.find((slot) => slot.id === selectedSlotId) ?? null,
    [availableSlots, selectedSlotId]
  );

  const reschedule = async () => {
    if (!selectedSlotId || submitting) return;
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/admin/birthday-party-bookings/${encodeURIComponent(bookingId)}`,
        {
          method: "PATCH",
          credentials: "include",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ slotId: selectedSlotId }),
        }
      );
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          typeof payload?.error === "string"
            ? payload.error
            : "Unable to move this birthday party booking."
        );
      }

      setOpen(false);
      router.refresh();
    } catch (rescheduleError) {
      setError(
        rescheduleError instanceof Error
          ? rescheduleError.message
          : "Unable to move this birthday party booking."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(nextOpen) => {
        if (submitting) return;
        setOpen(nextOpen);
        if (!nextOpen) setError(null);
      }}
    >
      <Dialog.Trigger asChild>
        <button
          type="button"
          disabled={availableSlots.length === 0}
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg border border-[#d9ccef] bg-[#faf7ff] px-5 text-base font-semibold text-[#5b2ca7] transition hover:border-[#cbb6ea] hover:bg-[#f4eeff] disabled:cursor-not-allowed disabled:opacity-55 lg:w-auto"
          title={
            availableSlots.length === 0
              ? "There are no available birthday party dates."
              : undefined
          }
        >
          <CalendarClock className="h-4 w-4" aria-hidden="true" />
          Move booking
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-[#160d21]/55" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[min(94vw,620px)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto border border-[#ddd3ea] bg-white p-6 shadow-[0_24px_70px_rgba(20,10,35,0.3)] focus:outline-none">
          <Dialog.Title className="text-xl font-bold text-[#221833]">
            Move {childName}&apos;s birthday party
          </Dialog.Title>
          <Dialog.Description className="mt-2 text-sm leading-6 text-[#5f5177]">
            Current booking: <span className="font-semibold text-[#302442]">{currentSlotLabel}</span>
            <span className="mt-1 block">
              This changes the booking record only. The customer is not emailed automatically.
            </span>
          </Dialog.Description>

          <label className="mt-5 block text-sm font-semibold text-[#2a203c]">
            New party date
            <select
              value={selectedSlotId}
              onChange={(event) => {
                setSelectedSlotId(event.target.value);
                setError(null);
              }}
              disabled={submitting}
              className="mt-2 min-h-12 w-full border border-[#d7c7ef] bg-white px-3 py-2 text-sm text-[#2a203c] outline-none transition focus:border-[#6e2ac0] focus:ring-2 focus:ring-[#6e2ac0]/20"
            >
              {availableSlots.map((slot) => (
                <option key={slot.id} value={slot.id}>
                  {formatSlot(slot)}
                </option>
              ))}
            </select>
          </label>

          {selectedSlot ? (
            <div className="mt-4 border border-[#e7e1f1] bg-[#fcfbff] px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#74688a]">
                New booking date
              </p>
              <p className="mt-1 text-sm font-semibold text-[#221833]">
                {formatSlot(selectedSlot)}
              </p>
            </div>
          ) : null}

          {error ? (
            <p className="mt-4 border border-[#efc5cf] bg-[#fff4f6] px-3 py-2.5 text-sm font-semibold text-[#9e2242]">
              {error}
            </p>
          ) : null}

          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Dialog.Close asChild>
              <button
                type="button"
                disabled={submitting}
                className="inline-flex min-h-10 items-center justify-center border border-[#d9d1e5] bg-white px-4 text-sm font-semibold text-[#5f536f] hover:bg-[#f8f5fc] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>
            </Dialog.Close>
            <button
              type="button"
              onClick={() => void reschedule()}
              disabled={!selectedSlotId || submitting}
              className="inline-flex min-h-10 items-center justify-center border border-[#6e2ac0] bg-[#6e2ac0] px-4 text-sm font-semibold text-white transition hover:bg-[#5d23a7] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Moving booking..." : "Confirm new date"}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
