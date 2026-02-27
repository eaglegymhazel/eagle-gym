"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import DaySection from "../recreational/components/DaySection";
import SelectionTray from "../recreational/components/SelectionTray";
import type { ClassCardItem, SelectedClassDetail, WeekdayGroup } from "../recreational/types";
import { parseTimeToMinutes, WEEKDAY_ORDER } from "../recreational/utils";

type CompetitionClassesClientProps = {
  childId: string;
  childName: string;
  ageGroupLabel: string;
  groups: WeekdayGroup[];
  initialSelectedClassIds?: string[];
};

export default function CompetitionClassesClient({
  childId,
  childName,
  ageGroupLabel,
  groups,
  initialSelectedClassIds = [],
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

  const [selectedClassIds, setSelectedClassIds] = useState<string[]>(() =>
    Array.from(
      new Set(
        initialSelectedClassIds
          .map((id) => id.trim())
          .filter((id) => id && classById.has(id))
      )
    )
  );
  const [trayExpanded, setTrayExpanded] = useState(initialSelectedClassIds.length > 0);

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
          isFull: item.isFull,
        });
        return acc;
      },
      []
    );

    return items.sort((a, b) => {
      const dayDiff =
        (weekdayOrderIndex.get(a.weekday) ?? 99) - (weekdayOrderIndex.get(b.weekday) ?? 99);
      if (dayDiff !== 0) return dayDiff;
      return parseTimeToMinutes(a.startTime) - parseTimeToMinutes(b.startTime);
    });
  }, [classById, selectedClassIds]);

  const toggleClass = (item: ClassCardItem) => {
    const isSelected = selectedSet.has(item.id);
    if (item.isFull && !isSelected) return;

    setSelectedClassIds((prev) => {
      if (prev.includes(item.id)) {
        if (prev.length === 1) {
          setTrayExpanded(false);
        }
        return prev.filter((id) => id !== item.id);
      }
      return [...prev, item.id];
    });
  };

  const removeClass = (classId: string) => {
    setSelectedClassIds((prev) => {
      if (prev.length === 1 && prev[0] === classId) {
        setTrayExpanded(false);
      }
      return prev.filter((id) => id !== classId);
    });
  };

  const clearSelection = () => {
    setTrayExpanded(false);
    setSelectedClassIds([]);
  };

  const handleContinue = () => {
    if (selectedClassIds.length === 0) return;
    const classIds = selectedClassIds.join(",");
    router.push(
      `/book/competition/review?childId=${encodeURIComponent(
        childId
      )}&classIds=${encodeURIComponent(classIds)}`
    );
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
    <div className="pb-44 sm:pb-48">
      <div className="mx-auto w-full max-w-5xl space-y-4 sm:space-y-5">
        <header className="space-y-2">
          <div className="px-0.5 py-0.5">
            <div className="inline-flex items-center rounded-full border border-[#6c35c3]/25 bg-white/85 px-4 py-1.5 text-sm font-semibold uppercase tracking-[0.18em] text-[#2a203c]/70 shadow-[0_12px_28px_-18px_rgba(31,26,37,0.5)] backdrop-blur">
              Booking for{" "}
              <span className="ml-1 font-bold text-[#2a203c]">
                {childName || "selected child"}
              </span>
            </div>
          </div>
          <p className="pl-4 text-sm font-semibold text-[#2a203c]">
            Class type: <span className="font-bold">Competition</span>
          </p>
          <p className="pl-4 text-sm font-semibold text-[#2a203c]">
            Age group: <span className="font-bold">{ageGroupLabel}</span>
          </p>
          <div className="pt-1">
            <div className="h-[0.5px] w-full bg-black/20" />
          </div>
        </header>

        <div className="space-y-5 pt-3 sm:space-y-6 sm:pt-5">
          {groups.map((group) => (
            <DaySection
              key={group.weekday}
              weekday={group.weekday}
              classes={group.classes}
              selectedIds={selectedSet}
              onToggleClass={toggleClass}
            />
          ))}
        </div>
      </div>

      <SelectionTray
        selectedCount={selectedCount}
        selectedItems={selectedItems}
        expanded={trayExpanded}
        onToggleExpanded={() => {
          if (selectedCount === 0) return;
          setTrayExpanded((prev) => !prev);
        }}
        onClear={clearSelection}
        onContinue={handleContinue}
        onRemove={removeClass}
      />
    </div>
  );
}
