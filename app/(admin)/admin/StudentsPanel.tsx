"use client";

import { useMemo } from "react";
import styles from "@/app/(portal)/(protected)/account/account.module.css";
import ChildPicker from "@/components/admin/ChildPicker";
import type { Child } from "@/components/admin/mockChildren";

type StudentDirectoryView = "current" | "archived";

type StudentsPanelProps = {
  childrenData: Child[];
  loadError: string | null;
  directoryView: StudentDirectoryView;
  onChangeDirectoryView: (nextView: StudentDirectoryView) => void;
  onSelectChild: (child: Child) => void;
};

export default function StudentsPanel({
  childrenData,
  loadError,
  directoryView,
  onChangeDirectoryView,
  onSelectChild,
}: StudentsPanelProps) {
  const currentCount = useMemo(
    () => childrenData.filter((child) => !child.isArchived).length,
    [childrenData]
  );
  const archivedCount = useMemo(
    () => childrenData.filter((child) => child.isArchived).length,
    [childrenData]
  );
  const visibleChildrenData = useMemo(
    () =>
      childrenData.filter((child) =>
        directoryView === "archived" ? child.isArchived : !child.isArchived
      ),
    [childrenData, directoryView]
  );

  const childPickerProps = {
    children: visibleChildrenData,
    recentChildren: visibleChildrenData.slice(0, 6).map((child) => child.id),
    listHeading: directoryView === "archived" ? "Archived Students" : "Current Students",
    emptyMessage:
      directoryView === "archived"
        ? "No archived students found."
        : "No current students found.",
    onSelect: onSelectChild,
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 border-b border-[#e6e0ee] pb-3">
        <button
          type="button"
          onClick={() => onChangeDirectoryView("current")}
          aria-pressed={directoryView === "current"}
          className={[
            "inline-flex min-h-10 items-center justify-center border px-4 text-sm font-semibold transition",
            directoryView === "current"
              ? "border-[#6e2ac0] bg-[#f3ecfc] text-[#4f2b80]"
              : "border-[#ddd4ea] bg-white text-[#6f6384] hover:bg-[#f8f5fc]",
          ].join(" ")}
        >
          Current Students
          <span className="ml-2 text-xs opacity-70">{currentCount}</span>
        </button>
        <button
          type="button"
          onClick={() => onChangeDirectoryView("archived")}
          aria-pressed={directoryView === "archived"}
          className={[
            "inline-flex min-h-10 items-center justify-center border px-4 text-sm font-semibold transition",
            directoryView === "archived"
              ? "border-[#6e2ac0] bg-[#f3ecfc] text-[#4f2b80]"
              : "border-[#ddd4ea] bg-white text-[#6f6384] hover:bg-[#f8f5fc]",
          ].join(" ")}
        >
          Archived Students
          <span className="ml-2 text-xs opacity-70">{archivedCount}</span>
        </button>
      </div>

      {loadError ? (
        <div className={styles.errorBanner} role="alert">
          <span>{loadError}</span>
        </div>
      ) : null}
      {!loadError ? <ChildPicker {...childPickerProps} /> : null}
    </div>
  );
}
