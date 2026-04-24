"use client";

import { useMemo, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";

type MoveOption = {
  id: string;
  weekday: string | null;
  startTime: string | null;
  ageMin: number | string | null;
  ageMax: number | string | null;
  capacity: number | null;
  enrolledCount: number;
};

function formatAgeBand(ageMin: number | string | null, ageMax: number | string | null) {
  const min = ageMin == null ? null : String(ageMin).trim();
  const max = ageMax == null ? null : String(ageMax).trim();
  if (min && max) return `${min}-${max} years`;
  if (min) return `${min}+ years`;
  if (max) return `Up to ${max} years`;
  return "Age band not set";
}

export default function MoveRecreationalBookingControl({
  bookingId,
  currentClassId,
  options,
}: {
  bookingId: string;
  currentClassId: string;
  options: MoveOption[];
}) {
  const [open, setOpen] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectableOptions = useMemo(
    () => options.filter((option) => option.id !== currentClassId),
    [currentClassId, options]
  );

  const selectedOption = selectableOptions.find((option) => option.id === selectedClassId) ?? null;

  const resetState = () => {
    setSelectedClassId("");
    setError(null);
    setIsSaving(false);
  };

  const moveBooking = async () => {
    if (!selectedClassId || isSaving) return;

    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/move-recreational-booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId,
          classId: selectedClassId,
        }),
      });

      const payload = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !payload.ok) {
        throw new Error(payload.error ?? "Booking could not be moved.");
      }

      setOpen(false);
      resetState();
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Booking could not be moved.");
      setIsSaving(false);
    }
  };

  if (selectableOptions.length === 0) {
    return <span className="text-xs font-medium text-[#6e6383]">No other recreational classes</span>;
  }

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) {
          resetState();
        }
      }}
    >
      <Dialog.Trigger asChild>
        <button
          type="button"
          className="h-8 cursor-pointer border border-[#c7b4e5] bg-[#f7f2ff] px-2.5 text-xs font-semibold text-[#4f2390] transition hover:border-[#b398dd] hover:bg-[#f1e8ff]"
        >
          Move class
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[100] bg-black/45 backdrop-blur-[1px]" />
        <Dialog.Content className="fixed inset-x-3 top-1/2 z-[101] max-h-[86vh] -translate-y-1/2 overflow-hidden border border-[#d8ceeb] bg-white shadow-2xl sm:left-1/2 sm:right-auto sm:w-[min(620px,calc(100vw-32px))] sm:-translate-x-1/2">
          <div className="border-b border-[#e8e0f2] px-4 py-4 sm:px-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <Dialog.Title className="text-lg font-bold text-[#24193a]">
                  Move recreational booking
                </Dialog.Title>
                <Dialog.Description className="mt-1 text-sm text-[#5f5177]">
                  Select another recreational class for this student.
                </Dialog.Description>
              </div>
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="inline-flex h-9 w-9 cursor-pointer items-center justify-center border border-[#ddd4ea] text-[#6f6384] transition hover:bg-[#faf7ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6e2ac0]/35"
                  aria-label="Close move booking dialog"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-4 w-4"
                    aria-hidden="true"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  >
                    <path d="M6 6l12 12" />
                    <path d="M18 6l-12 12" />
                  </svg>
                </button>
              </Dialog.Close>
            </div>
          </div>

          <div className="max-h-[52vh] overflow-y-auto px-4 py-4 sm:px-5">
            <div className="space-y-2" role="radiogroup" aria-label="Available recreational classes">
              {selectableOptions.map((option) => {
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
                      name="target-rec-class"
                      value={option.id}
                      checked={isSelected}
                      onChange={() => setSelectedClassId(option.id)}
                      className="mt-0.5 h-4 w-4 accent-[#6c35c3]"
                    />
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-[#24193a]">
                        {(option.weekday ?? "Day not set") + " " + (option.startTime ?? "Time not set")}
                      </span>
                      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-[#6c607d]">
                        <span>{formatAgeBand(option.ageMin, option.ageMax)}</span>
                        <span>
                          {option.enrolledCount}
                          {option.capacity != null ? ` / ${option.capacity}` : ""} booked
                        </span>
                      </div>
                    </span>
                  </label>
                );
              })}
            </div>
            {error ? <p className="mt-3 text-sm font-medium text-[#a72020]">{error}</p> : null}
            {selectedOption ? (
              <p className="mt-3 text-xs text-[#6c607d]">
                Move to {selectedOption.weekday ?? "day not set"} {selectedOption.startTime ?? "time not set"}.
              </p>
            ) : null}
          </div>

          <div className="border-t border-[#e8e0f2] px-4 py-4 sm:px-5">
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Dialog.Close asChild>
                <button
                  type="button"
                  disabled={isSaving}
                  className="h-10 cursor-pointer border border-[#ddd4ea] bg-white px-4 text-sm font-semibold text-[#6f6384] transition hover:bg-[#faf7ff] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancel
                </button>
              </Dialog.Close>
              <button
                type="button"
                onClick={() => {
                  void moveBooking();
                }}
                disabled={!selectedClassId || isSaving}
                className={[
                  "h-10 border px-4 text-sm font-semibold transition",
                  selectedClassId && !isSaving
                    ? "cursor-pointer border-[#0f8d4e] bg-[#0f8d4e] text-white hover:bg-[#0d7c45]"
                    : "cursor-not-allowed border-[#e9e4f0] bg-[#f8f6fb] text-[#a095b0]",
                ].join(" ")}
              >
                {isSaving ? "Moving..." : "Move booking"}
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
