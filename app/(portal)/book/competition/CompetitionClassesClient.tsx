"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import {
  buildCompetitionSelectionKey,
  type CompetitionBookingSelection,
} from "@/lib/competitionBookingSelection";
import DaySection from "../recreational/components/DaySection";
import type { ClassCardItem, WeekdayGroup } from "../recreational/types";
import { parseTimeToMinutes, WEEKDAY_ORDER } from "../recreational/utils";

type CompetitionClassesClientProps = {
  childId: string;
  childName: string;
  groups: WeekdayGroup[];
  initialSelections?: CompetitionBookingSelection[];
};

export default function CompetitionClassesClient({
  childId,
  childName,
  groups,
  initialSelections = [],
}: CompetitionClassesClientProps) {
  const router = useRouter();

  const allClasses = useMemo(
    () =>
      groups.flatMap((group) =>
        group.classes.map((item) => ({
          ...item,
          weekday: group.weekday,
        }))
      ),
    [groups]
  );

  const classById = useMemo(() => {
    const map = new Map<string, ClassCardItem & { weekday: string }>();
    allClasses.forEach((item) => map.set(item.id, item));
    return map;
  }, [allClasses]);
  const optionBySelectionKey = useMemo(() => {
    const map = new Map<string, ClassCardItem & { weekday: string }>();
    allClasses.forEach((item) => map.set(item.selectionKey ?? item.id, item));
    return map;
  }, [allClasses]);

  const [selectedOptions, setSelectedOptions] = useState<CompetitionBookingSelection[]>(() =>
    initialSelections.filter((selection) => classById.has(selection.classId))
  );
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [waitlistStateByClassId, setWaitlistStateByClassId] = useState<
    Record<string, "idle" | "saving" | "added">
  >({});
  const [waitlistMessage, setWaitlistMessage] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    const hydrateWaitlistState = async () => {
      try {
        const response = await fetch(
          `/api/waitlist?childId=${encodeURIComponent(childId)}`,
          { method: "GET" }
        );
        const payload = (await response.json()) as {
          classIds?: string[];
          error?: string;
        };

        if (!response.ok) {
          throw new Error(payload.error ?? "Could not load waitlist.");
        }

        const nextState: Record<string, "idle" | "saving" | "added"> = {};
        (payload.classIds ?? []).forEach((classId) => {
          if (typeof classId === "string" && classId) {
            nextState[classId] = "added";
          }
        });

        if (isActive) {
          setWaitlistStateByClassId(nextState);
        }
      } catch {
        if (isActive) {
          setWaitlistStateByClassId({});
        }
      }
    };

    void hydrateWaitlistState();

    return () => {
      isActive = false;
    };
  }, [childId]);

  const selectedOptionKeys = useMemo(
    () => new Set(selectedOptions.map((option) => buildCompetitionSelectionKey(option))),
    [selectedOptions]
  );
  const selectedCount = selectedOptions.length;
  const selectedHoursLabel = useMemo(() => {
    const totalMinutes = selectedOptions.reduce((sum, selection) => {
      if (
        typeof selection.bookedDurationMinutes !== "number" ||
        selection.bookedDurationMinutes <= 0
      ) {
        return sum;
      }
      return sum + selection.bookedDurationMinutes;
    }, 0);
    if (totalMinutes <= 0) return null;
    const totalHours = Number((totalMinutes / 60).toFixed(2));
    return `Total selected hours: ${totalHours}h`;
  }, [selectedOptions]);

  const toggleClass = (item: ClassCardItem) => {
    const classId = item.classId ?? item.id;
    const bookedDurationMinutes =
      item.bookedDurationMinutes ?? item.durationMinutes ?? 0;
    const selectionKey = buildCompetitionSelectionKey({
      classId,
      bookedDurationMinutes,
    });
    const isSelected = selectedOptionKeys.has(selectionKey);
    if (item.isFull && !isSelected) return;

    setSelectedOptions((prev) => {
      if (isSelected) {
        return prev.filter(
          (selection) =>
            buildCompetitionSelectionKey(selection) !== selectionKey
        );
      }

      const next = prev.filter((selection) => selection.classId !== classId);
      next.push({ classId, bookedDurationMinutes });
      return next;
    });
  };

  const handleContinue = async () => {
    if (selectedOptions.length === 0 || isSavingDraft) return;

    setIsSavingDraft(true);
    try {
      const response = await fetch("/api/booking-drafts/competition", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          childId,
          selections: selectedOptions,
        }),
      });
      const payload = (await response.json()) as {
        draftId?: string;
        error?: string;
      };

      if (!response.ok || !payload.draftId) {
        throw new Error(payload.error ?? "Could not save selection.");
      }

      router.push(
        `/book/competition/review?childId=${encodeURIComponent(
          childId
        )}&draftId=${encodeURIComponent(payload.draftId)}`
      );
    } finally {
      setIsSavingDraft(false);
    }
  };

  const addToWaitlist = async (classId: string) => {
    const currentState = waitlistStateByClassId[classId] ?? "idle";
    if (currentState === "saving" || currentState === "added") return;

    setWaitlistStateByClassId((prev) => ({ ...prev, [classId]: "saving" }));
    setWaitlistMessage(null);

    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ childId, classId }),
      });
      const payload = (await response.json()) as { status?: string; error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Could not add to waitlist.");
      }

      if (payload.status === "already_exists") {
        setWaitlistStateByClassId((prev) => ({ ...prev, [classId]: "added" }));
        setWaitlistMessage("This child is already on the waitlist for that class.");
        return;
      }

      if (payload.status === "added") {
        setWaitlistStateByClassId((prev) => ({ ...prev, [classId]: "added" }));
        setWaitlistMessage("Added to waitlist.");
        return;
      }

      throw new Error("Could not add to waitlist.");
    } catch (error) {
      setWaitlistStateByClassId((prev) => ({ ...prev, [classId]: "idle" }));
      setWaitlistMessage(
        error instanceof Error ? error.message : "Could not add to waitlist."
      );
    }
  };

  if (groups.length === 0) {
    return (
      <div className="rounded-2xl border border-[#e8ddf8] bg-white p-8 text-center shadow-[0_14px_30px_-24px_rgba(42,32,60,0.42)]">
        <h1 className="text-2xl font-black tracking-tight text-[#1f1a25] sm:text-3xl">
          Competition Classes
        </h1>
        <p className="mt-3 text-sm text-[#2E2A33]/75 sm:text-base">
          No competition classes available for {childName}.
        </p>
        <button
          type="button"
          onClick={() => router.push(`/book?childId=${encodeURIComponent(childId)}`)}
          className="mt-6 inline-flex h-11 items-center justify-center rounded-full border border-[#d8c7f4] px-5 text-sm font-semibold text-[#5b2ca7] transition hover:bg-[#faf6ff]"
        >
          Back to booking
        </button>
      </div>
    );
  }

  return (
    <div className="pb-28 sm:pb-32">
      <div className="mx-auto w-full max-w-5xl space-y-4 sm:space-y-5">
        <header className="space-y-3 sm:space-y-4">
          <div className="pl-4">
            <p className="text-[1.75rem] font-black uppercase tracking-[0.04em] text-[#9a6500] sm:text-[2.1rem]">
              Competition Classes
            </p>
          </div>
          <div className="pl-4">
            <div className="px-0.5 py-0.5">
              <div className="inline-flex items-center rounded-full border border-[#6c35c3]/25 bg-white/85 px-4 py-1.5 text-sm font-semibold uppercase tracking-[0.18em] text-[#2a203c]/70 shadow-[0_12px_28px_-18px_rgba(31,26,37,0.5)] backdrop-blur">
                Booking for{" "}
                <span className="ml-1 font-bold text-[#2a203c]">
                  {childName || "selected child"}
                </span>
              </div>
            </div>
          </div>
          <div className="pl-4">
            <Link
              href="/account"
              className="inline-flex items-center gap-2 rounded-full border border-[#d8c7f4] bg-white px-4 py-2 text-sm font-semibold text-[#5b2ca7] transition hover:bg-[#faf6ff]"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back to account
            </Link>
          </div>
          <div className="pl-4 pt-3 sm:pt-5">
            <div className="max-w-4xl border-b border-[#d9cdef] pb-4">
              <p className="text-sm leading-7 text-[#2E2A33]/76 sm:text-[15px]">
                Choose the 2-hour or 3-hour block where available. Monthly
                pricing is calculated automatically from the total training
                hours you book.
              </p>
            </div>
          </div>
          {waitlistMessage ? (
            <p className="pl-4 text-sm font-semibold text-[#2a203c]">{waitlistMessage}</p>
          ) : null}
        </header>

        <div className="space-y-5 pt-3 sm:space-y-6 sm:pt-5">
          {groups.map((group) => (
            <DaySection
              key={group.weekday}
              weekday={group.weekday}
              classes={group.classes}
              selectedIds={selectedOptionKeys}
              onToggleClass={toggleClass}
              waitlistStateByClassId={waitlistStateByClassId}
              onAddToWaitlist={addToWaitlist}
            />
          ))}
        </div>
      </div>
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[#e7e1f1] bg-white/96 px-4 pb-[calc(0.85rem+env(safe-area-inset-bottom))] pt-3 shadow-[0_-16px_32px_-24px_rgba(34,24,56,0.42)] backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-black uppercase tracking-[0.12em] text-[#6c35c3]">
              Total Hours
            </p>
            <p className="text-lg font-black tracking-tight text-[#1f1a25]">
              {selectedHoursLabel ? selectedHoursLabel.replace("Total selected hours: ", "") : "0h"}
            </p>
            {selectedCount === 0 ? (
              <p className="text-[11px] text-[#6a5a86]">Select at least one class to continue.</p>
            ) : null}
          </div>

          <button
            type="button"
            onClick={handleContinue}
            disabled={selectedCount === 0 || isSavingDraft}
            className="inline-flex h-11 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-full bg-[#6c35c3] px-5 text-sm font-semibold text-white !text-white shadow-[0_12px_24px_-12px_rgba(69,34,124,0.78)] transition hover:bg-[#5b2ca7] disabled:cursor-not-allowed disabled:bg-[#c5addf] disabled:!text-white"
          >
            {isSavingDraft ? "Saving..." : "Review Booking"}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
