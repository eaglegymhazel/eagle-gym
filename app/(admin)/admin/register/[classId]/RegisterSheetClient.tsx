"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";

type AttendanceState = "unmarked" | "present" | "absent";

type RegisterStudent = {
  id: string;
  fullName: string;
  dateOfBirthLabel: string;
  requiresPickup: boolean;
};

type RegisterSheetClientProps = {
  classId: string;
  sessionDate: string;
  titleLabel: string;
  contextLabel: string;
  registerLabel: string;
  enrolledCount: number;
  students: RegisterStudent[];
  initialStatuses?: Record<string, Exclude<AttendanceState, "unmarked">>;
  isLocked?: boolean;
  isBeforeSaveWindow?: boolean;
};

type FilterState = "all" | AttendanceState;

const filterOptions: Array<{ key: FilterState; label: string }> = [
  { key: "all", label: "All" },
  { key: "unmarked", label: "Unmarked" },
  { key: "absent", label: "Absent" },
];

const attendanceActions: Array<{ key: Exclude<AttendanceState, "unmarked">; label: string }> = [
  { key: "present", label: "Present" },
  { key: "absent", label: "Absent" },
];

function buildStatusSignature(
  students: RegisterStudent[],
  statuses: Record<string, AttendanceState | Exclude<AttendanceState, "unmarked">>
): string {
  return students
    .map((student) => `${student.id}:${statuses[student.id] ?? "unmarked"}`)
    .join("|");
}

export default function RegisterSheetClient({
  classId,
  sessionDate,
  titleLabel,
  contextLabel,
  registerLabel,
  enrolledCount,
  students,
  initialStatuses = {},
  isLocked = false,
  isBeforeSaveWindow = false,
}: RegisterSheetClientProps) {
  const [statuses, setStatuses] = useState<Record<string, AttendanceState>>(initialStatuses);
  const [activeFilter, setActiveFilter] = useState<FilterState>("all");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [lastSavedSignature, setLastSavedSignature] = useState<string>(() =>
    buildStatusSignature(students, initialStatuses)
  );
  const isReadOnly = isLocked;

  useEffect(() => {
    setStatuses(initialStatuses);
    setSaveState("idle");
    setSaveMessage(null);
    setLastSavedSignature(buildStatusSignature(students, initialStatuses));
  }, [classId, sessionDate, initialStatuses, students]);

  const markedCount = useMemo(
    () => students.filter((student) => (statuses[student.id] ?? "unmarked") !== "unmarked").length,
    [statuses, students]
  );

  const presentCount = useMemo(
    () => students.filter((student) => (statuses[student.id] ?? "unmarked") === "present").length,
    [statuses, students]
  );

  const absentCount = useMemo(
    () => students.filter((student) => (statuses[student.id] ?? "unmarked") === "absent").length,
    [statuses, students]
  );

  const totalStudents = students.length;
  const isComplete = markedCount === totalStudents && totalStudents > 0;
  const progressPercent =
    totalStudents > 0 ? Math.round((markedCount / totalStudents) * 100) : 0;
  const progressHue = Math.round((progressPercent / 100) * 130);
  const progressColor = `hsl(${progressHue} 70% 45%)`;
  const currentSignature = useMemo(
    () => buildStatusSignature(students, statuses),
    [students, statuses]
  );
  const hasUnsavedChanges = currentSignature !== lastSavedSignature;

  const filteredStudents = useMemo(() => {
    if (activeFilter === "all") return students;
    return students.filter((student) => (statuses[student.id] ?? "unmarked") === activeFilter);
  }, [activeFilter, statuses, students]);

  const setStatus = (studentId: string, next: AttendanceState) => {
    if (isReadOnly) return;
    setStatuses((prev) => ({
      ...prev,
      [studentId]: next,
    }));
    if (saveState !== "idle") {
      setSaveState("idle");
      setSaveMessage(null);
    }
  };

  const markAllPresent = () => {
    if (isReadOnly) return;
    const next: Record<string, AttendanceState> = {};
    students.forEach((student) => {
      next[student.id] = "present";
    });
    setStatuses(next);
    if (saveState !== "idle") {
      setSaveState("idle");
      setSaveMessage(null);
    }
  };

  const clearAll = () => {
    if (isReadOnly) return;
    setStatuses({});
    setSaveState("idle");
    setSaveMessage(null);
  };

  const handleSave = async () => {
    if (!isComplete || saveState === "saving" || isReadOnly || isBeforeSaveWindow) return;
    setSaveState("saving");
    setSaveMessage(null);

    const entries = students.map((student) => ({
      childId: student.id,
      isPresent: (statuses[student.id] ?? "unmarked") === "present",
    }));

    try {
      const response = await fetch("/api/admin/register/save", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          classId,
          sessionDate,
          entries,
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (response.status === 409) {
          setSaveState("error");
          setSaveMessage("Register can be saved from 15 minutes before class start.");
          return;
        }
        if (response.status === 423) {
          setSaveState("error");
          setSaveMessage("Register is locked and can no longer be edited.");
          return;
        }
        throw new Error(
          typeof payload?.error === "string" ? payload.error : "Unable to save register."
        );
      }

      setSaveState("saved");
      setSaveMessage("Register saved.");
      setLastSavedSignature(currentSignature);
    } catch (error) {
      setSaveState("error");
      setSaveMessage(error instanceof Error ? error.message : "Unable to save register.");
    }
  };

  return (
    <main className="mx-auto w-full max-w-6xl px-3 py-6 sm:px-5 sm:py-8">
      <section className="overflow-hidden rounded-none border border-[#ddd3eb] bg-white shadow-[0_12px_28px_rgba(35,24,52,0.06)]">
        <div className="border-b border-[#e9e1f2] bg-[linear-gradient(180deg,#fdfcff_0%,#f9f6fd_100%)] px-4 py-4 sm:px-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#726587]">
                Class register
              </p>
              <h1 className="mt-1 text-2xl font-extrabold tracking-[-0.01em] text-[#221833]">
                {titleLabel}
              </h1>
              <p className="mt-1 text-sm text-[#5e536f]">{contextLabel}</p>
              <p className="mt-1 text-[12px] font-medium text-[#6a5f7e]">
                <span className="text-[#2d203f]">{registerLabel}</span>
              </p>
              {isReadOnly ? (
                <p className="mt-2 inline-flex h-6 items-center rounded-none border border-[#d9d1e5] bg-[#f8f5fc] px-2.5 text-[11px] font-semibold text-[#5b4f6f]">
                  Register locked
                </p>
              ) : null}
            </div>
            <Link
              href="/admin?tab=register"
              className="inline-flex h-10 items-center gap-1.5 rounded-none border border-[#c7b4e5] bg-[#f7f2ff] px-3.5 text-sm font-semibold text-[#4f2390] shadow-[0_1px_0_rgba(255,255,255,0.8)_inset] transition hover:border-[#b398dd] hover:bg-[#f1e8ff] active:bg-[#ebddff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6e2ac0]/35"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back to classes
            </Link>
          </div>
        </div>

        <div className="grid gap-2 border-b border-[#ece6f5] bg-[#fcfbfe] px-4 py-3 sm:grid-cols-3 sm:gap-3 sm:px-6">
          <div className="rounded-none border border-[#e7e1f0] bg-[#faf8fc] px-3 py-2">
            <p className="text-[11px] uppercase tracking-[0.06em] text-[#807393]">Enrolled</p>
            <p className="mt-0.5 text-lg font-bold text-[#2b1f3c]">{enrolledCount}</p>
          </div>
          <div className="rounded-none border border-[#e7e1f0] bg-[#faf8fc] px-3 py-2">
            <p className="text-[11px] uppercase tracking-[0.06em] text-[#807393]">Present</p>
            <p className="mt-0.5 text-lg font-bold text-[#1f6a3f]">{presentCount}</p>
          </div>
          <div className="rounded-none border border-[#e7e1f0] bg-[#faf8fc] px-3 py-2">
            <p className="text-[11px] uppercase tracking-[0.06em] text-[#807393]">Absent</p>
            <p className="mt-0.5 text-lg font-bold text-[#9e2242]">{absentCount}</p>
          </div>
        </div>

        <div className="border-b border-[#ece6f5] px-4 py-3 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              {filterOptions.map((option) => {
                const isActive = activeFilter === option.key;
                return (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => setActiveFilter(option.key)}
                    className={[
                      "h-8 rounded-none border px-2.5 text-xs font-semibold transition",
                      isActive
                        ? "border-[#6e2ac0] bg-[#f3ecfc] text-[#4f2b80]"
                        : "border-[#ddd4ea] bg-white text-[#6f6384] hover:bg-[#f8f5fc]",
                    ].join(" ")}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={markAllPresent}
                disabled={isReadOnly}
                className={[
                  "h-8 rounded-none border px-2.5 text-xs font-semibold",
                  isReadOnly
                    ? "cursor-not-allowed border-[#d9d4e3] bg-[#f7f5fb] text-[#9b91ab]"
                    : "border-[#bdddc9] bg-[#ebf7f0] text-[#1d6a3e] hover:bg-[#e4f3ea]",
                ].join(" ")}
              >
                Mark all present
              </button>
              <button
                type="button"
                onClick={clearAll}
                disabled={isReadOnly}
                className={[
                  "h-8 rounded-none border px-2.5 text-xs font-semibold",
                  isReadOnly
                    ? "cursor-not-allowed border-[#d9d4e3] bg-[#f7f5fb] text-[#9b91ab]"
                    : "border-[#ddd4ea] bg-white text-[#6f6384] hover:bg-[#f8f5fc]",
                ].join(" ")}
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        <div className="px-4 py-2 sm:px-6 sm:py-3">
          <div className="hidden rounded-none border border-[#ebe4f5] bg-[#f8f4fd] px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#6f6384] md:grid md:grid-cols-[minmax(220px,1fr)_150px_340px] md:items-center">
            <span>Student</span>
            <span>Date of birth</span>
            <span>Attendance action</span>
          </div>

          <div className="mt-2 divide-y divide-[#ede7f6]">
            {filteredStudents.length === 0 ? (
              <div className="rounded-none border border-dashed border-[#dfd6eb] px-3 py-5 text-sm text-[#716586]">
                No students match this filter.
              </div>
            ) : (
              filteredStudents.map((student) => {
                const status = statuses[student.id] ?? "unmarked";
                const rowTintClass =
                  status === "present"
                    ? "bg-[#f6fbf8]"
                    : status === "absent"
                      ? "bg-[#fff9fb]"
                      : "bg-white";
                return (
                  <article
                    key={student.id}
                    className={[
                      "grid gap-2 rounded-none px-2 py-2.5 transition-colors duration-200 md:grid-cols-[minmax(220px,1fr)_150px_340px] md:items-center md:gap-3",
                      rowTintClass,
                    ].join(" ")}
                  >
                    <div className="flex min-w-0 items-center justify-between gap-2">
                      <p className="truncate text-[15px] font-semibold text-[#201734]">{student.fullName}</p>
                      {student.requiresPickup ? (
                        <span className="inline-flex h-6 shrink-0 items-center rounded-none border border-[#f1cfd8] bg-[#fff7f9] px-2 text-[10px] font-medium uppercase tracking-[0.03em] text-[#9e2242]">
                          Must be collected
                        </span>
                      ) : null}
                    </div>
                    <p className="text-[13px] text-[#6a5f7b]">{student.dateOfBirthLabel}</p>
                    <div className="grid h-8 w-full max-w-[340px] grid-cols-2 overflow-hidden rounded-none border border-[#ddd4ea] bg-white">
                      {attendanceActions.map((action, index) => {
                        const isActive = status === action.key;
                        const isPresent = action.key === "present";
                        const isUnmarked = status === "unmarked";
                        return (
                          <button
                            key={`${student.id}-${action.key}`}
                            type="button"
                            onClick={() => setStatus(student.id, action.key)}
                            disabled={isReadOnly}
                            className={[
                              "relative h-8 w-full overflow-hidden px-3 text-xs font-semibold transition-colors duration-200",
                              index === 0 ? "border-r border-[#ddd4ea]" : "",
                              isActive
                                ? isPresent
                                  ? "text-[#1a6a3d]"
                                  : "text-[#9e2242]"
                                : isUnmarked
                                  ? "bg-white text-[#6f6384] hover:bg-[#f8f5fc]"
                                  : "bg-[#fcfbfe] text-[#9389a6] hover:bg-[#f7f4fb]",
                              isReadOnly ? "cursor-not-allowed" : "",
                            ].join(" ")}
                          >
                            <span
                              aria-hidden
                              className={[
                                "absolute inset-0 transition-transform duration-200 ease-out",
                                isPresent
                                  ? "origin-right bg-[#e7f7ef]"
                                  : "origin-left bg-[#fdecef]",
                                isActive ? "scale-x-100" : "scale-x-0",
                              ].join(" ")}
                            />
                            <span className="relative z-10">{action.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </div>
      </section>

        {isBeforeSaveWindow && !isReadOnly ? (
          <div className="sticky bottom-0 z-20 mt-3 border border-[#efc5cf] bg-[#fff4f6] px-4 py-3 shadow-[0_-12px_24px_rgba(28,19,43,0.09)] sm:px-6">
            <p className="text-sm font-semibold text-[#9e2242]">
              Registration is currently closed. It opens 15 minutes before class starts.
            </p>
          </div>
        ) : (
          <div className="sticky bottom-0 z-20 mt-3 border border-[#d6cae8] bg-white px-4 py-3 shadow-[0_-12px_24px_rgba(28,19,43,0.09)] sm:px-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-[220px] flex-1">
              <div className="mb-1 flex items-center justify-between gap-2 text-xs text-[#706486]">
                <span>
                  <span className="font-semibold text-[#25193a]">{markedCount}</span> of{" "}
                  <span className="font-semibold text-[#25193a]">{totalStudents}</span> marked
                </span>
                <span className="font-semibold text-[#5f536f]">{progressPercent}%</span>
              </div>
                <div className="h-2 w-full overflow-hidden rounded-none bg-[#ece6f5]">
                  <div
                    className="h-full rounded-none transition-all duration-200 ease-out"
                    style={{ width: `${progressPercent}%`, backgroundColor: progressColor }}
                  />
                </div>
                {saveMessage ? (
                  <p
                    className={[
                      "mt-1 text-xs",
                      saveState === "saved" ? "text-[#1d6a3e]" : "text-[#9e2242]",
                    ].join(" ")}
                    role={saveState === "saved" ? "status" : "alert"}
                  >
                    {saveMessage}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={handleSave}
                disabled={
                  !isComplete ||
                  saveState === "saving" ||
                  isReadOnly ||
                  isBeforeSaveWindow ||
                  !hasUnsavedChanges
                }
                className={[
                  "inline-flex h-9 items-center rounded-none px-3 text-sm font-semibold text-white",
                  isComplete &&
                  saveState !== "saving" &&
                  !isReadOnly &&
                  !isBeforeSaveWindow &&
                  hasUnsavedChanges
                    ? "bg-[#6e2ac0] hover:bg-[#6125a8]"
                    : "cursor-not-allowed bg-[#b9aed0]",
                ].join(" ")}
              >
                {isReadOnly
                  ? "Register locked"
                  : isBeforeSaveWindow
                    ? "Save unavailable"
                    : saveState === "saving"
                      ? "Saving..."
                      : "Save register"}
              </button>
            </div>
          </div>
        )}
    </main>
  );
}
