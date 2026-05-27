"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import DaySection from "./components/DaySection";
import type { ClassCardItem, SelectedClassDetail, WeekdayGroup } from "./types";
import { parseTimeToMinutes, WEEKDAY_ORDER } from "./utils";

type RecreationalClassesClientProps = {
  childId: string;
  childName: string;
  groups: WeekdayGroup[];
  initialSelectedClassIds?: string[];
};

export { type WeekdayGroup, type ClassCardItem } from "./types";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(value);
}

export default function RecreationalClassesClient({
  childId,
  childName,
  groups,
  initialSelectedClassIds = [],
}: RecreationalClassesClientProps) {
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

  const [selectedClassIds, setSelectedClassIds] = useState<string[]>(() =>
    Array.from(
      new Set(
        initialSelectedClassIds
          .map((id) => id.trim())
          .filter((id) => id && classById.has(id))
      )
    )
  );
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

  const selectedSet = useMemo(() => new Set(selectedClassIds), [selectedClassIds]);
  const selectedCount = selectedClassIds.length;

  const selectedItems = useMemo(() => {
    const weekdayOrderIndex = new Map<string, number>(
      WEEKDAY_ORDER.map((day, idx) => [day, idx])
    );
    const items: SelectedClassDetail[] = selectedClassIds.reduce<SelectedClassDetail[]>(
      (acc, id) => {
        const item = classById.get(id);
        if (!item) return acc;
        acc.push({
          id: item.id,
          name: item.name,
          weekday: item.weekday,
          startTime: item.startTime,
          durationMinutes: item.durationMinutes,
          price: item.price ?? null,
          isFull: item.isFull,
        });
        return acc;
      },
      []
    );

    return items.sort((a, b) => {
      const dayDiff = (weekdayOrderIndex.get(a.weekday) ?? 99) - (weekdayOrderIndex.get(b.weekday) ?? 99);
      if (dayDiff !== 0) return dayDiff;
      return parseTimeToMinutes(a.startTime) - parseTimeToMinutes(b.startTime);
    });
  }, [classById, selectedClassIds]);
  const totalPrice = useMemo(
    () =>
      selectedItems.reduce((sum, item) => {
        if (typeof item.price !== "number" || !Number.isFinite(item.price)) return sum;
        return sum + item.price;
      }, 0),
    [selectedItems]
  );

  const toggleClass = (item: ClassCardItem) => {
    const isSelected = selectedSet.has(item.id);
    if (item.isFull && !isSelected) return;

    setSelectedClassIds((prev) => {
      if (prev.includes(item.id)) {
        return prev.filter((id) => id !== item.id);
      }
      return [...prev, item.id];
    });
  };

  const handleContinue = () => {
    if (selectedClassIds.length === 0) return;
    const classIds = selectedClassIds.join(",");
    router.push(
      `/book/recreational/review?childId=${encodeURIComponent(
        childId
      )}&classIds=${encodeURIComponent(classIds)}`
    );
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
          Recreational Classes
        </h1>
        <p className="mt-3 text-sm text-[#2E2A33]/75 sm:text-base">
          No recreational classes available for {childName}.
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
            <p className="text-[1.75rem] font-black uppercase tracking-[0.04em] text-[#1f7a3a] sm:text-[2.1rem]">
              Recreational Classes
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
                Select recreational classes below to book, multiple classes can
                be selected at the same time. Price is calculated based on
                total sessions selected.
              </p>
            </div>
          </div>
          {waitlistMessage ? (
            <p className="pl-4 text-sm font-semibold text-[#2a203c]">{waitlistMessage}</p>
          ) : null}
        </header>

        <div className="pt-3 space-y-5 sm:pt-5 sm:space-y-6">
          {groups.map((group) => (
            <DaySection
              key={group.weekday}
              weekday={group.weekday}
              classes={group.classes}
              selectedIds={selectedSet}
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
              Booking Total
            </p>
            <p className="text-lg font-black tracking-tight text-[#1f1a25]">
              {formatCurrency(totalPrice)}
            </p>
            {selectedCount === 0 ? (
              <p className="text-[11px] text-[#6a5a86]">Select at least one class to continue.</p>
            ) : null}
          </div>

          <button
            type="button"
            onClick={handleContinue}
            disabled={selectedCount === 0}
            className="inline-flex h-11 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-full bg-[#6c35c3] px-5 text-sm font-semibold text-white !text-white shadow-[0_12px_24px_-12px_rgba(69,34,124,0.78)] transition hover:bg-[#5b2ca7] disabled:cursor-not-allowed disabled:bg-[#c5addf] disabled:!text-white"
          >
            Review Booking
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
