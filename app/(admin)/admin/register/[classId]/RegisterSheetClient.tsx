"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, CameraOff, User, Users } from "lucide-react";

type AttendanceState = "unmarked" | "present" | "absent";

type RegisterStudent = {
  id: string;
  fullName: string;
  requiresPickup: boolean;
  hasMedicalAlert: boolean;
  photographyAllowed: boolean;
};

type PaymentFollowUpStudent = {
  id: string;
  fullName: string;
  accountFullName: string;
  accountEmail: string;
  accountTelNo: string;
  statuses: string[];
  programmes: Array<"Recreational" | "Competition">;
  latestInvoiceCreated: string | null;
  nextPaymentAttempt: string | null;
  totalAmountDue: number | null;
  subscriptionId: string | null;
  customerId: string | null;
};

type BirthdayStudent = {
  id: string;
  fullName: string;
  dateOfBirth: string;
  ageTurning: number | null;
};

type RegisterSheetClientProps = {
  classId: string;
  sessionDate: string;
  titleLabel: string;
  contextLabel: string;
  registerLabel: string;
  enrolledCount: number;
  students: RegisterStudent[];
  paymentFollowUps?: PaymentFollowUpStudent[];
  birthdayStudents?: BirthdayStudent[];
  initialStatuses?: Record<string, Exclude<AttendanceState, "unmarked">>;
  initialCollected?: Record<string, boolean>;
  isLocked?: boolean;
  isBeforeSaveWindow?: boolean;
  sectionLabel?: string;
  backHref?: string;
  backLabel?: string;
  saveEndpoint?: string;
  savePayload?: Record<string, unknown>;
  allowPartialSave?: boolean;
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

function buildRegisterSignature(
  students: RegisterStudent[],
  statuses: Record<string, AttendanceState | Exclude<AttendanceState, "unmarked">>,
  collected: Record<string, boolean>
): string {
  return students
    .map(
      (student) =>
        `${student.id}:${statuses[student.id] ?? "unmarked"}:${collected[student.id] ? "1" : "0"}`
    )
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
  paymentFollowUps = [],
  birthdayStudents = [],
  initialStatuses = {},
  initialCollected = {},
  isLocked = false,
  isBeforeSaveWindow = false,
  sectionLabel = "Class register",
  backHref = "/admin?tab=register",
  backLabel = "Back to classes",
  saveEndpoint = "/api/admin/register/save",
  savePayload,
  allowPartialSave = false,
}: RegisterSheetClientProps) {
  const [statuses, setStatuses] = useState<Record<string, AttendanceState>>(initialStatuses);
  const [collected, setCollected] = useState<Record<string, boolean>>(initialCollected);
  const [activeFilter, setActiveFilter] = useState<FilterState>("all");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"register" | "payment-follow-up" | "birthdays">("register");
  const [lastSavedSignature, setLastSavedSignature] = useState<string>(() =>
    buildRegisterSignature(students, initialStatuses, initialCollected)
  );
  const isReadOnly = isLocked;

  useEffect(() => {
    setStatuses(initialStatuses);
    setCollected(initialCollected);
    setSaveState("idle");
    setSaveMessage(null);
    setActiveTab("register");
    setLastSavedSignature(buildRegisterSignature(students, initialStatuses, initialCollected));
  }, [classId, sessionDate, initialStatuses, initialCollected, students]);

  const formatDateTime = (value: string | null) => {
    if (!value) return "Unknown";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return new Intl.DateTimeFormat("en-GB", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(parsed);
  };

  const formatDate = (value: string) => {
    const parsed = new Date(`${value}T12:00:00`);
    if (Number.isNaN(parsed.getTime())) return value;
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(parsed);
  };

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
  const canSaveProgress = allowPartialSave || isComplete;
  const getStripeCustomerUrl = (customerId: string) =>
    `https://dashboard.stripe.com/customers/${encodeURIComponent(customerId)}`;
  const progressPercent =
    totalStudents > 0 ? Math.round((markedCount / totalStudents) * 100) : 0;
  const progressHue = Math.round((progressPercent / 100) * 130);
  const progressColor = `hsl(${progressHue} 70% 45%)`;
  const currentSignature = useMemo(
    () => buildRegisterSignature(students, statuses, collected),
    [students, statuses, collected]
  );
  const hasUnsavedChanges = currentSignature !== lastSavedSignature;

  const filteredStudents = useMemo(() => {
    if (activeFilter === "all") return students;
    return students.filter((student) => (statuses[student.id] ?? "unmarked") === activeFilter);
  }, [activeFilter, statuses, students]);

  const setStatus = (studentId: string, next: AttendanceState) => {
    if (isReadOnly) return;
    setStatuses((prev) => {
      const nextStatuses = {
        ...prev,
        [studentId]: next,
      };
      return nextStatuses;
    });
    if (next !== "present") {
      setCollected((prev) => {
        if (!prev[studentId]) return prev;
        const nextCollected = { ...prev };
        delete nextCollected[studentId];
        return nextCollected;
      });
    }
    if (saveState !== "idle") {
      setSaveState("idle");
      setSaveMessage(null);
    }
  };

  const setCollectedStatus = (studentId: string, isCollected: boolean) => {
    if (isReadOnly) return;
    setCollected((prev) => ({
      ...prev,
      [studentId]: isCollected,
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
    setCollected({});
    setSaveState("idle");
    setSaveMessage(null);
  };

  const handleSave = async () => {
    if (!canSaveProgress || saveState === "saving" || isReadOnly || isBeforeSaveWindow) return;
    setSaveState("saving");
    setSaveMessage(null);

    const entries = students
      .filter((student) => (statuses[student.id] ?? "unmarked") !== "unmarked")
      .map((student) => ({
        childId: student.id,
        isPresent: statuses[student.id] === "present",
        isCollected: collected[student.id] === true ? true : null,
      }));

    try {
      const response = await fetch(saveEndpoint, {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...(savePayload ?? {
            classId,
            sessionDate,
          }),
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
      setSaveMessage(isComplete ? "Register saved." : "Register progress saved.");
      setLastSavedSignature(currentSignature);
    } catch (error) {
      setSaveState("error");
      setSaveMessage(error instanceof Error ? error.message : "Unable to save register.");
    }
  };

  return (
    <main className="mx-auto w-full max-w-6xl px-3 py-6 sm:px-5 sm:py-8">
      <div className="mb-3 grid grid-cols-2 gap-1.5 sm:flex sm:flex-wrap sm:items-end">
        <button
          type="button"
          onClick={() => setActiveTab("register")}
          className={[
            "inline-flex h-11 items-center justify-center border px-4 text-sm font-semibold transition sm:justify-start sm:px-5",
            activeTab === "register"
              ? "border-[#6e2ac0] bg-[#f3ecfc] text-[#4f2b80]"
              : "border-[#ddd4ea] bg-white text-[#6f6384] hover:bg-[#f8f5fc]",
          ].join(" ")}
        >
          Register
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("payment-follow-up")}
          className={[
            "inline-flex h-11 items-center justify-center border px-4 text-sm font-semibold transition sm:justify-start sm:px-5",
            activeTab === "payment-follow-up"
              ? "border-[#6e2ac0] bg-[#f3ecfc] text-[#4f2b80]"
              : "border-[#ddd4ea] bg-white text-[#6f6384] hover:bg-[#f8f5fc]",
          ].join(" ")}
        >
          Payment Follow-up
          {paymentFollowUps.length > 0 ? (
            <span className="ml-2 inline-flex min-w-5 items-center justify-center rounded-full bg-[#fff4f6] px-1.5 text-[10px] font-bold text-[#9e2242]">
              {paymentFollowUps.length}
            </span>
          ) : null}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("birthdays")}
          className={[
            "inline-flex h-11 items-center justify-center border px-4 text-sm font-semibold transition sm:justify-start sm:px-5",
            "col-span-2 sm:col-span-1",
            activeTab === "birthdays"
              ? "border-[#6e2ac0] bg-[#f3ecfc] text-[#4f2b80]"
              : "border-[#ddd4ea] bg-white text-[#6f6384] hover:bg-[#f8f5fc]",
          ].join(" ")}
        >
          Birthdays
          {birthdayStudents.length > 0 ? (
            <span className="ml-2 inline-flex min-w-5 items-center justify-center rounded-full bg-[#fff4f6] px-1.5 text-[10px] font-bold text-[#9e2242]">
              {birthdayStudents.length}
            </span>
          ) : null}
        </button>
      </div>

      <section className="overflow-hidden rounded-none border border-[#ddd3eb] bg-white shadow-[0_12px_28px_rgba(35,24,52,0.06)]">
        <div className="border-b border-[#e9e1f2] bg-[linear-gradient(180deg,#fdfcff_0%,#f9f6fd_100%)] px-4 py-4 sm:px-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#726587]">
                {sectionLabel}
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
              href={backHref}
              className="inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-none border border-[#c7b4e5] bg-[#f7f2ff] px-3.5 text-sm font-semibold text-[#4f2390] shadow-[0_1px_0_rgba(255,255,255,0.8)_inset] transition hover:border-[#b398dd] hover:bg-[#f1e8ff] active:bg-[#ebddff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6e2ac0]/35"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              {backLabel}
            </Link>
          </div>
        </div>

        {activeTab === "register" ? (
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
        ) : null}

        {activeTab === "register" ? (
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
        ) : null}

        {activeTab === "register" ? (
        <div className="px-4 py-2 sm:px-6 sm:py-3">
          <div className="hidden rounded-none border border-[#ebe4f5] bg-[#f8f4fd] px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#6f6384] md:grid md:grid-cols-[minmax(220px,1fr)_340px_220px] md:items-center">
            <span>Student</span>
            <span>Attendance action</span>
            <span>Collected</span>
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
                      "grid gap-2 rounded-none px-2 py-2.5 transition-colors duration-200 md:grid-cols-[minmax(220px,1fr)_340px_220px] md:items-center md:gap-3",
                      rowTintClass,
                    ].join(" ")}
                  >
                    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
                      <div className="min-w-0 inline-flex items-center gap-2">
                        <p className="truncate text-[15px] font-semibold text-[#201734]">{student.fullName}</p>
                        {student.hasMedicalAlert ? (
                          <span
                            className="inline-flex h-5 w-5 shrink-0 items-center justify-center"
                            title="Medical information on file"
                            aria-label="Medical information on file"
                          >
                            <svg
                              viewBox="0 0 24 24"
                              className="h-4.5 w-4.5"
                              aria-hidden="true"
                            >
                              <circle cx="12" cy="12" r="11" fill="#ffffff" stroke="#111111" strokeWidth="1.6" />
                              <rect x="10.2" y="5.8" width="3.6" height="12.4" fill="#ef1b1b" />
                              <rect x="5.8" y="10.2" width="12.4" height="3.6" fill="#ef1b1b" />
                            </svg>
                          </span>
                        ) : null}
                        {!student.photographyAllowed ? (
                          <span
                            className="inline-flex h-5 w-5 shrink-0 items-center justify-center text-[#c81e3a]"
                            title="Photography is not permitted"
                            aria-label="Photography is not permitted"
                          >
                            <CameraOff className="h-4.5 w-4.5" aria-hidden="true" />
                          </span>
                        ) : null}
                      </div>
                      <Link
                        href={`/admin/students/${encodeURIComponent(student.id)}`}
                        className="inline-flex h-7 items-center justify-self-end rounded-none border border-[#cdbce8] bg-[#f7f2ff] px-2 text-[11px] font-semibold text-[#4f2390] transition hover:border-[#b398dd] hover:bg-[#f1e8ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6e2ac0]/35"
                      >
                        View Profile
                      </Link>
                    </div>
                    <div className="grid h-8 w-full max-w-[340px] grid-cols-2 overflow-hidden rounded-none border border-[#ddd4ea] bg-white">
                      {attendanceActions.map((action, index) => {
                        const isActive = status === action.key;
                        const isPresent = action.key === "present";
                        const isUnmarked = status === "unmarked";
                        return (
                          <button
                            key={`${student.id}-${action.key}`}
                            type="button"
                            onClick={() =>
                              setStatus(student.id, isActive ? "unmarked" : action.key)
                            }
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
                              isReadOnly
                                ? "cursor-not-allowed"
                                : "cursor-pointer hover:shadow-[inset_0_0_0_1px_rgba(110,42,192,0.2)]",
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
                    <div className="flex items-center">
                      {student.requiresPickup ? (
                        <div className="inline-flex items-center gap-2">
                          <span
                            className={[
                              "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-none border",
                              "border-[#f1cfd8] bg-[#fff7f9] text-[#9e2242]",
                            ].join(" ")}
                            title="Requires collection by parent/guardian"
                            aria-label="Requires collection by parent or guardian"
                          >
                            <Users className="h-3.5 w-3.5" aria-hidden="true" />
                          </span>
                          <label className="inline-flex cursor-pointer select-none items-center gap-2 text-xs font-semibold text-[#5e536f]">
                            <input
                              type="checkbox"
                              checked={collected[student.id] === true}
                              onChange={(event) => setCollectedStatus(student.id, event.target.checked)}
                              disabled={isReadOnly || status !== "present"}
                              className="h-4 w-4 rounded-none border border-[#cfc4e0] text-[#6e2ac0] focus:ring-[#6e2ac0]/35 disabled:cursor-not-allowed disabled:opacity-60"
                            />
                            Collected
                          </label>
                        </div>
                      ) : (
                        <div className="inline-flex items-center">
                          <span
                            className={[
                              "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-none border",
                              "border-[#bde3ca] bg-[#edf9f2] text-[#1d6a3e]",
                            ].join(" ")}
                            title="Can leave independently"
                            aria-label="Can leave independently"
                          >
                            <User className="h-3.5 w-3.5" aria-hidden="true" />
                          </span>
                        </div>
                      )}
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </div>
        ) : activeTab === "payment-follow-up" ? (
        <div className="px-4 py-4 sm:px-6">
          {paymentFollowUps.length === 0 ? (
            <div className="rounded-none border border-dashed border-[#dfd6eb] px-3 py-5 text-sm text-[#716586]">
              No students in this register currently have overdue payments on their account.
            </div>
          ) : (
            <div className="space-y-3">
              <div className="rounded-none border border-[#ece6f5] bg-[#fcfbfe] px-3 py-3 text-sm text-[#5e536f]">
                These students belong to accounts with overdue Stripe payments. This section is
                read-only and is provided only as a follow-up prompt for coaches or admin.
              </div>
              <div className="divide-y divide-[#ede7f6] border border-[#ece6f5]">
                {paymentFollowUps.map((student) => (
                  <article
                    key={student.id}
                    className="grid gap-3 bg-white px-3 py-3 md:grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)_180px_180px_180px]"
                  >
                    <div className="min-w-0">
                      <p className="text-[11px] uppercase tracking-[0.06em] text-[#807393]">
                        Student
                      </p>
                      <p className="mt-1 text-[15px] font-semibold text-[#201734]">{student.fullName}</p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] uppercase tracking-[0.06em] text-[#807393]">
                        Parent or guardian
                      </p>
                      <p className="mt-1 text-sm font-medium text-[#2b1f3c]">
                        {student.accountFullName}
                      </p>
                      <p className="mt-1 text-sm text-[#5e536f]">
                        {student.accountEmail || "No account email"}
                      </p>
                      <p className="mt-1 text-xs uppercase tracking-[0.06em] text-[#7b2437]">
                        {student.statuses.map((status) => status.replaceAll("_", " ")).join(" / ")}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.06em] text-[#807393]">Phone</p>
                      <p className="mt-1 text-sm font-medium text-[#2b1f3c]">
                        {student.accountTelNo || "Not set"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.06em] text-[#807393]">Latest invoice</p>
                      <p className="mt-1 text-sm font-medium text-[#2b1f3c]">
                        {formatDateTime(student.latestInvoiceCreated)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.06em] text-[#807393]">Stripe</p>
                      <div className="mt-1 flex flex-col items-start gap-1.5">
                        {student.customerId ? (
                          <a
                            href={getStripeCustomerUrl(student.customerId)}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex min-h-9 items-center rounded-lg border border-[#d9ccef] bg-[#faf7ff] px-3 text-xs font-semibold text-[#5b2ca7] transition hover:border-[#cbb6ea] hover:bg-[#f4eeff] hover:text-[#49228c]"
                          >
                            View customer
                          </a>
                        ) : null}
                        {!student.customerId ? (
                          <p className="text-sm text-[#5e536f]">Stripe links unavailable</p>
                        ) : null}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}
        </div>
        ) : (
        <div className="px-4 py-4 sm:px-6">
          {birthdayStudents.length === 0 ? (
            <div className="rounded-none border border-dashed border-[#dfd6eb] px-3 py-5 text-sm text-[#716586]">
              No students in this register have a birthday on this class date.
            </div>
          ) : (
            <div className="space-y-3">
              <div className="rounded-none border border-[#ece6f5] bg-[#fcfbfe] px-3 py-3 text-sm text-[#5e536f]">
                These students have a birthday on this class date. This section is read-only and is
                provided only as a quick prompt for coaches or admin.
              </div>
              <div className="divide-y divide-[#ede7f6] border border-[#ece6f5]">
                {birthdayStudents.map((student) => (
                  <article
                    key={student.id}
                    className="grid gap-3 bg-white px-3 py-3 md:grid-cols-[minmax(0,1fr)_220px_180px]"
                  >
                    <div className="min-w-0">
                      <p className="text-[11px] uppercase tracking-[0.06em] text-[#807393]">
                        Student
                      </p>
                      <p className="mt-1 text-[15px] font-semibold text-[#201734]">{student.fullName}</p>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.06em] text-[#807393]">
                        Date of birth
                      </p>
                      <p className="mt-1 text-sm font-medium text-[#2b1f3c]">
                        {formatDate(student.dateOfBirth)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.06em] text-[#807393]">
                        Turning
                      </p>
                      <p className="mt-1 text-sm font-semibold text-[#6e2ac0]">
                        {student.ageTurning ?? "Unknown"}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}
        </div>
        )}
      </section>

      {activeTab === "register" ? (
        isBeforeSaveWindow && !isReadOnly ? (
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
                  !canSaveProgress ||
                  saveState === "saving" ||
                  isReadOnly ||
                  isBeforeSaveWindow ||
                  !hasUnsavedChanges
                }
                className={[
                  "inline-flex h-9 items-center rounded-none px-3 text-sm font-semibold text-white",
                  saveState === "saved" && !hasUnsavedChanges
                    ? "cursor-not-allowed bg-[#1f8f4d]"
                    : "",
                  canSaveProgress &&
                  saveState !== "saving" &&
                  !isReadOnly &&
                  !isBeforeSaveWindow &&
                  hasUnsavedChanges &&
                  saveState !== "saved"
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
                      : saveState === "saved" && !hasUnsavedChanges
                        ? "Saved"
                      : allowPartialSave && !isComplete
                        ? "Save progress"
                        : "Save register"}
              </button>
            </div>
          </div>
        )
      ) : null}
    </main>
  );
}
