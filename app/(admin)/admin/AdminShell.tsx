"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { createPortal } from "react-dom";
import * as Dialog from "@radix-ui/react-dialog";
import { ClipboardList, Clock3, Gift, Users } from "lucide-react";
import styles from "@/app/(portal)/(protected)/account/account.module.css";
import ChildPicker from "@/components/admin/ChildPicker";
import type { Child } from "@/components/admin/mockChildren";
import type { Session } from "@/components/admin/mockSessions";
import ClassRegisterPicker from "@/components/admin/ClassRegisterPicker";
import BirthdayPartyAvailabilityManager from "@/components/admin/BirthdayPartyAvailabilityManager";
import { buildUpcomingSessions, type RegisterClassTemplate } from "@/components/admin/sessionBuild";
import AdminNavItem from "@/components/admin/AdminNavItem";
import type { AdminWaitlistRow } from "@/lib/server/adminDashboard";
import type { AdminMissedPaymentRow } from "@/lib/server/adminMissedPayments";
import type { AdminBirthdayPartyBookingRow } from "@/lib/server/adminBirthdayPartyBookings";
import type { BirthdayPartyCalendarSlotSummary } from "@/lib/server/birthdayPartyBookings";

type AdminTabKey =
  | "students"
  | "register"
  | "class-cancellations"
  | "summer-camp-register"
  | "waiting"
  | "missed-payments"
  | "birthday-parties";

type NavItem = {
  key: AdminTabKey;
  label: string;
  icon: typeof Users;
};

type WaitingRow = {
  childId: string;
  classId: string;
  childName: string;
  className: string;
  accountEmail: string;
  accountTelNo: string;
  requestedOn: string;
};

type ClassBookingStudentRow = {
  bookingId: string;
  childId: string;
  classId: string;
  bookingType: string | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  createdAt: string | null;
  childFirstName: string | null;
  childLastName: string | null;
  accountId: string | null;
  accountFirstName: string | null;
  accountLastName: string | null;
  accountEmail: string | null;
  accountTelNo: string | null;
};

const navItems: NavItem[] = [
  { key: "students", label: "Student Management", icon: Users },
  { key: "register", label: "Class Register", icon: ClipboardList },
  { key: "class-cancellations", label: "Class Cancellations", icon: ClipboardList },
  { key: "summer-camp-register", label: "Summer Camp Register", icon: ClipboardList },
  { key: "waiting", label: "Waiting List", icon: Clock3 },
  { key: "missed-payments", label: "Missed Payments", icon: Clock3 },
  { key: "birthday-parties", label: "Birthday Parties", icon: Gift },
];

const WEEKDAY_ORDER = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

function normalizeWeekdayLabel(value: string | number | null) {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);
  return "";
}

function getWeekdaySortValue(value: string | number | null) {
  const normalized = normalizeWeekdayLabel(value);
  const index = WEEKDAY_ORDER.findIndex((weekday) => weekday === normalized);
  return index === -1 ? WEEKDAY_ORDER.length : index;
}

function formatClassTime(value: string | null) {
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

function formatClassTimeRange(startTime: string | null, endTime: string | null) {
  const formattedStart = formatClassTime(startTime);
  const formattedEnd = formatClassTime(endTime);
  if (formattedStart && formattedEnd) return `${formattedStart}-${formattedEnd}`;
  if (formattedStart) return formattedStart;
  if (formattedEnd) return formattedEnd;
  return "Time not set";
}

function formatClassCancellationLabel(row: RegisterClassTemplate) {
  const weekday = normalizeWeekdayLabel(row.weekday) || "Weekday not set";
  const startTime = formatClassTime(row.startTime);
  return startTime ? `${weekday} ${startTime}` : weekday;
}

export default function AdminShell({
  referenceNowIso,
  initialChildrenData,
  initialRegisterClasses,
  initialSummerCampRegisterSessions,
  initialWaitlistRows,
  initialMissedPaymentsRows,
  initialBirthdayPartyBookingsRows,
  initialBirthdayPartyCalendarSlots,
  initialChildrenLoadError,
  initialRegisterClassesError,
  initialSummerCampRegisterSessionsError,
  initialWaitlistLoadError,
  initialMissedPaymentsLoadError,
  initialBirthdayPartyBookingsLoadError,
  initialBirthdayPartyAvailabilityLoadError,
}: {
  referenceNowIso: string;
  initialChildrenData: Child[];
  initialRegisterClasses: RegisterClassTemplate[];
  initialSummerCampRegisterSessions: Session[];
  initialWaitlistRows: AdminWaitlistRow[];
  initialMissedPaymentsRows: AdminMissedPaymentRow[];
  initialBirthdayPartyBookingsRows: AdminBirthdayPartyBookingRow[];
  initialBirthdayPartyCalendarSlots: BirthdayPartyCalendarSlotSummary[];
  initialChildrenLoadError: string | null;
  initialRegisterClassesError: string | null;
  initialSummerCampRegisterSessionsError: string | null;
  initialWaitlistLoadError: string | null;
  initialMissedPaymentsLoadError: string | null;
  initialBirthdayPartyBookingsLoadError: string | null;
  initialBirthdayPartyAvailabilityLoadError: string | null;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reduceMotion = useReducedMotion();
  const mobileTriggerRef = useRef<HTMLButtonElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const drawerRef = useRef<HTMLElement | null>(null);
  const initialTab = useMemo<AdminTabKey>(() => {
    const tabParam = searchParams.get("tab");
    if (
      tabParam === "students" ||
      tabParam === "register" ||
      tabParam === "class-cancellations" ||
      tabParam === "summer-camp-register" ||
      tabParam === "waiting" ||
      tabParam === "missed-payments" ||
      tabParam === "birthday-parties"
    ) {
      return tabParam;
    }
    return "students";
  }, [searchParams]);

  const [tab, setTab] = useState<AdminTabKey>(initialTab);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [waitlistRowsState, setWaitlistRowsState] = useState<WaitingRow[]>(initialWaitlistRows);
  const [waitlistQuery, setWaitlistQuery] = useState("");
  const [waitlistClassFilter, setWaitlistClassFilter] = useState("all");
  const [waitlistSort, setWaitlistSort] = useState<"oldest" | "newest">("oldest");
  const [missedPaymentsQuery, setMissedPaymentsQuery] = useState("");
  const [missedPaymentsProgrammeFilter, setMissedPaymentsProgrammeFilter] = useState<
    "all" | "Recreational" | "Competition"
  >("all");
  const [missedPaymentsStatusFilter, setMissedPaymentsStatusFilter] = useState<
    "all" | "past_due" | "unpaid"
  >("all");
  const [missedPaymentsSort, setMissedPaymentsSort] = useState<"newest" | "oldest">("newest");
  const [waitlistActionError, setWaitlistActionError] = useState<string | null>(null);
  const [waitlistActionMessage, setWaitlistActionMessage] = useState<string | null>(null);
  const [waitlistRemovingKey, setWaitlistRemovingKey] = useState<string | null>(null);
  const [waitlistDeleteCandidate, setWaitlistDeleteCandidate] = useState<WaitingRow | null>(null);
  const [classCancellationClasses, setClassCancellationClasses] =
    useState<RegisterClassTemplate[]>(initialRegisterClasses);
  const [classCancellationProgrammeFilter, setClassCancellationProgrammeFilter] = useState<
    "all" | "Recreational" | "Competition"
  >("all");
  const [classCancellationWeekdayFilter, setClassCancellationWeekdayFilter] = useState("all");
  const [selectedCancellationClassId, setSelectedCancellationClassId] = useState<string | null>(null);
  const [classCancellationStudents, setClassCancellationStudents] = useState<ClassBookingStudentRow[]>([]);
  const [classCancellationLoading, setClassCancellationLoading] = useState(false);
  const [classCancellationError, setClassCancellationError] = useState<string | null>(null);
  const [classCancellationMessage, setClassCancellationMessage] = useState<string | null>(null);
  const [classCancellationCandidate, setClassCancellationCandidate] =
    useState<ClassBookingStudentRow | null>(null);
  const [classCancellationConfirmedStripeUpdate, setClassCancellationConfirmedStripeUpdate] =
    useState(false);
  const [classCancellationSubmitting, setClassCancellationSubmitting] = useState(false);
  const childrenData = initialChildrenData;
  const childrenLoadError = initialChildrenLoadError;
  const registerClasses = classCancellationClasses;
  const registerClassesError = initialRegisterClassesError;
  const summerCampRegisterSessions = initialSummerCampRegisterSessions;
  const summerCampRegisterSessionsError = initialSummerCampRegisterSessionsError;
  const waitlistLoadError = initialWaitlistLoadError;
  const missedPaymentsRows = initialMissedPaymentsRows;
  const missedPaymentsLoadError = initialMissedPaymentsLoadError;
  const birthdayPartyBookingsRows = initialBirthdayPartyBookingsRows;
  const birthdayPartyBookingsLoadError = initialBirthdayPartyBookingsLoadError;
  const birthdayPartyCalendarSlots = initialBirthdayPartyCalendarSlots;
  const birthdayPartyAvailabilityLoadError = initialBirthdayPartyAvailabilityLoadError;

  const registerSessions = useMemo(
    () => buildUpcomingSessions(registerClasses, 14, new Date(referenceNowIso)),
    [referenceNowIso, registerClasses]
  );

  const childPickerProps = {
    children: childrenData,
    recentChildren: childrenData.slice(0, 6).map((child) => child.id),
    onSelect: (child: Child) => {
      router.push(`/admin/students/${encodeURIComponent(child.id)}`);
    },
  };

  const cardTitle = useMemo(() => {
    if (tab === "students") return "Student Management";
    if (tab === "register") return "Class Register";
    if (tab === "class-cancellations") return "Class Cancellations";
    if (tab === "summer-camp-register") return "Summer Camp Register";
    if (tab === "missed-payments") return "Missed Payments";
    if (tab === "birthday-parties") return "Birthday Parties";
    return "Waiting List";
  }, [tab]);
  const isStudentTab = tab === "students";
  const isRegisterTab = tab === "register";
  const isClassCancellationsTab = tab === "class-cancellations";
  const isSummerCampRegisterTab = tab === "summer-camp-register";
  const isMissedPaymentsTab = tab === "missed-payments";
  const isBirthdayPartiesTab = tab === "birthday-parties";
  const isFlatContentTab =
    isStudentTab ||
    isRegisterTab ||
    isClassCancellationsTab ||
    isSummerCampRegisterTab ||
    isMissedPaymentsTab ||
    isBirthdayPartiesTab ||
    tab === "waiting";

  const formatWaitlistDate = (value: string) => {
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

  const formatDate = (value: string | null) => {
    if (!value) return "Unknown";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return new Intl.DateTimeFormat("en-GB", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    }).format(parsed);
  };

  const formatBirthdayTimeRange = (startTime: string, endTime: string) => {
    const formatOne = (value: string) => {
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
    };

    return `${formatOne(startTime)}-${formatOne(endTime)}`;
  };

  const getStripeSubscriptionUrl = (subscriptionId: string) =>
    `https://dashboard.stripe.com/subscriptions/${encodeURIComponent(subscriptionId)}`;

  const getStripeCustomerUrl = (customerId: string) =>
    `https://dashboard.stripe.com/customers/${encodeURIComponent(customerId)}`;

  const missedPaymentStatusOptions = useMemo(
    () =>
      Array.from(new Set(missedPaymentsRows.map((row) => row.status)))
        .filter((status): status is "past_due" | "unpaid" => status === "past_due" || status === "unpaid")
        .sort(),
    [missedPaymentsRows]
  );

  const filteredMissedPaymentsRows = useMemo(() => {
    const query = missedPaymentsQuery.trim().toLowerCase();
    const rows = missedPaymentsRows.filter((row) => {
      if (
        missedPaymentsProgrammeFilter !== "all" &&
        row.programme !== missedPaymentsProgrammeFilter
      ) {
        return false;
      }
      if (missedPaymentsStatusFilter !== "all" && row.status !== missedPaymentsStatusFilter) {
        return false;
      }
      if (!query) return true;
      return [
        row.programme,
        row.accountFullName,
        row.email,
        row.status,
        row.subscriptionId,
        row.customerId,
        row.invoiceId,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });

    rows.sort((a, b) => {
      const aTime = a.invoiceCreated ? Date.parse(a.invoiceCreated) : 0;
      const bTime = b.invoiceCreated ? Date.parse(b.invoiceCreated) : 0;
      return missedPaymentsSort === "oldest" ? aTime - bTime : bTime - aTime;
    });

    return rows;
  }, [
    missedPaymentsProgrammeFilter,
    missedPaymentsQuery,
    missedPaymentsRows,
    missedPaymentsSort,
    missedPaymentsStatusFilter,
  ]);

  const [birthdayPartyQuery, setBirthdayPartyQuery] = useState("");
  const [birthdayPartySubview, setBirthdayPartySubview] = useState<"bookings" | "availability">(
    "bookings"
  );

  const filteredBirthdayPartyRows = useMemo(() => {
    const query = birthdayPartyQuery.trim().toLowerCase();
    return birthdayPartyBookingsRows.filter((row) => {
      if (!query) return true;

      return [
        row.accountFullName,
        row.email,
        row.accTelNo,
        row.birthdayChildFullName,
        row.slotDate,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [birthdayPartyBookingsRows, birthdayPartyQuery]);

  const birthdayPartySummary = useMemo(() => {
    const nextPartyDate = filteredBirthdayPartyRows[0]?.slotDate ?? null;
    return {
      upcomingCount: filteredBirthdayPartyRows.length,
      nextPartyDate,
    };
  }, [filteredBirthdayPartyRows]);

  const missedPaymentsSummary = useMemo(() => {
    const summary = {
      totalRows: filteredMissedPaymentsRows.length,
      recreationalCount: 0,
      competitionCount: 0,
      pastDueCount: 0,
      unpaidCount: 0,
      affectedAccounts: new Set<string>(),
    };

    filteredMissedPaymentsRows.forEach((row) => {
      if (row.programme === "Recreational") summary.recreationalCount += 1;
      if (row.programme === "Competition") summary.competitionCount += 1;
      if (row.status === "past_due") summary.pastDueCount += 1;
      if (row.status === "unpaid") summary.unpaidCount += 1;
      if (row.email) summary.affectedAccounts.add(row.email.toLowerCase());
    });

    return {
      ...summary,
      affectedAccountCount: summary.affectedAccounts.size,
    };
  }, [filteredMissedPaymentsRows]);

  const classCancellationWeekdayOptions = useMemo(
    () =>
      Array.from(
        new Set(
          classCancellationClasses
            .map((row) => normalizeWeekdayLabel(row.weekday))
            .filter(Boolean)
        )
      )
        .sort((a, b) => getWeekdaySortValue(a) - getWeekdaySortValue(b)),
    [classCancellationClasses]
  );

  const filteredClassCancellationClasses = useMemo(() => {
    return classCancellationClasses
      .filter((row) => {
        if (
          classCancellationProgrammeFilter !== "all" &&
          row.programme !== classCancellationProgrammeFilter
        ) {
          return false;
        }
        if (
          classCancellationWeekdayFilter !== "all" &&
          normalizeWeekdayLabel(row.weekday) !== classCancellationWeekdayFilter
        ) {
          return false;
        }
        return row.programme === "Recreational" || row.programme === "Competition";
      })
      .sort((a, b) => {
        const weekdayCompare = getWeekdaySortValue(a.weekday) - getWeekdaySortValue(b.weekday);
        if (weekdayCompare !== 0) return weekdayCompare;
        const startCompare = (a.startTime ?? "").localeCompare(b.startTime ?? "");
        if (startCompare !== 0) return startCompare;
        return formatClassCancellationLabel(a).localeCompare(
          formatClassCancellationLabel(b),
          undefined,
          { sensitivity: "base" }
        );
      });
  }, [
    classCancellationClasses,
    classCancellationProgrammeFilter,
    classCancellationWeekdayFilter,
  ]);

  const selectedCancellationClass = useMemo(
    () =>
      selectedCancellationClassId
        ? classCancellationClasses.find((row) => row.id === selectedCancellationClassId) ?? null
        : null,
    [classCancellationClasses, selectedCancellationClassId]
  );

  const waitlistClassOptions = useMemo(
    () =>
      Array.from(new Set(waitlistRowsState.map((row) => row.className)))
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" })),
    [waitlistRowsState]
  );

  const filteredWaitlistRows = useMemo(() => {
    const query = waitlistQuery.trim().toLowerCase();
    const rows = waitlistRowsState.filter((row) => {
      if (waitlistClassFilter !== "all" && row.className !== waitlistClassFilter) return false;
      if (!query) return true;
      return [
        row.childName,
        row.className,
        row.accountEmail,
        row.accountTelNo,
        row.requestedOn,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });

    rows.sort((a, b) => {
      const aTime = Date.parse(a.requestedOn || "");
      const bTime = Date.parse(b.requestedOn || "");
      const aSafe = Number.isNaN(aTime) ? Number.MAX_SAFE_INTEGER : aTime;
      const bSafe = Number.isNaN(bTime) ? Number.MAX_SAFE_INTEGER : bTime;
      return waitlistSort === "oldest" ? aSafe - bSafe : bSafe - aSafe;
    });

    return rows;
  }, [waitlistClassFilter, waitlistQuery, waitlistRowsState, waitlistSort]);

  const removeFromWaitlist = async (row: WaitingRow) => {
    const rowKey = `${row.childId}-${row.classId}`;
    setWaitlistRemovingKey(rowKey);
    setWaitlistActionError(null);
    setWaitlistActionMessage(null);

    try {
      const response = await fetch("/api/admin/waitlist", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ childId: row.childId, classId: row.classId }),
      });

      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        throw new Error(payload?.error ?? "Could not remove waitlist entry.");
      }

      setWaitlistRowsState((prev) =>
        prev.filter((entry) => !(entry.childId === row.childId && entry.classId === row.classId))
      );
      setWaitlistActionMessage(`${row.childName} removed from waitlist.`);
      setWaitlistDeleteCandidate(null);
    } catch (error) {
      setWaitlistActionError(
        error instanceof Error ? error.message : "Could not remove waitlist entry."
      );
    } finally {
      setWaitlistRemovingKey(null);
    }
  };

  const loadClassCancellationStudents = async (classId: string) => {
    setSelectedCancellationClassId(classId);
    setClassCancellationLoading(true);
    setClassCancellationError(null);
    setClassCancellationMessage(null);
    setClassCancellationStudents([]);

    try {
      const response = await fetch(
        `/api/admin/class-bookings?classId=${encodeURIComponent(classId)}`,
        {
          method: "GET",
          cache: "no-store",
        }
      );
      const payload = (await response.json().catch(() => null)) as
        | { error?: string; students?: ClassBookingStudentRow[] }
        | null;

      if (!response.ok) {
        throw new Error(payload?.error ?? "Could not load class bookings.");
      }

      setClassCancellationStudents(payload?.students ?? []);
    } catch (error) {
      setClassCancellationError(
        error instanceof Error ? error.message : "Could not load class bookings."
      );
    } finally {
      setClassCancellationLoading(false);
    }
  };

  const cancelClassBooking = async (candidate: ClassBookingStudentRow) => {
    setClassCancellationSubmitting(true);
    setClassCancellationError(null);
    setClassCancellationMessage(null);

    try {
      const response = await fetch("/api/admin/class-bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: candidate.bookingId,
          confirmedStripeUpdate: true,
        }),
      });
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        throw new Error(payload?.error ?? "Could not cancel class booking.");
      }

      const childName = `${candidate.childFirstName ?? ""} ${candidate.childLastName ?? ""}`.trim();
      setClassCancellationStudents((prev) =>
        prev.filter((row) => row.bookingId !== candidate.bookingId)
      );
      setClassCancellationClasses((prev) =>
        prev.map((row) =>
          row.id === candidate.classId
            ? { ...row, enrolledCount: Math.max(0, row.enrolledCount - 1) }
            : row
        )
      );
      setClassCancellationCandidate(null);
      setClassCancellationConfirmedStripeUpdate(false);
      setClassCancellationMessage(
        `${childName || "Student"} removed from the active class booking list.`
      );
    } catch (error) {
      setClassCancellationError(
        error instanceof Error ? error.message : "Could not cancel class booking."
      );
    } finally {
      setClassCancellationSubmitting(false);
    }
  };

  useEffect(() => {
    if (!isMobileNavOpen) return;
    const triggerToRestore = mobileTriggerRef.current;
    restoreFocusRef.current = document.activeElement as HTMLElement | null;
    const drawer = drawerRef.current;
    const getFocusable = () =>
      drawer
        ? (Array.from(
            drawer.querySelectorAll<HTMLElement>(
              'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
            )
          ) as HTMLElement[])
        : [];

    const focusables = getFocusable();
    (focusables[0] ?? closeButtonRef.current)?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMobileNavOpen(false);
        return;
      }
      if (event.key !== "Tab") return;

      const activeFocusable = getFocusable();
      if (activeFocusable.length === 0) {
        event.preventDefault();
        return;
      }
      const first = activeFocusable[0];
      const last = activeFocusable[activeFocusable.length - 1];
      const current = document.activeElement as HTMLElement | null;
      if (!event.shiftKey && current === last) {
        event.preventDefault();
        first.focus();
      } else if (event.shiftKey && current === first) {
        event.preventDefault();
        last.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      const focusTarget = triggerToRestore ?? restoreFocusRef.current;
      focusTarget?.focus();
    };
  }, [isMobileNavOpen]);

  return (
    <div className={`${styles.page} select-text`}>
      <header className={styles.pageHeader}>
        <div className={styles.accent} aria-hidden="true" />
        <div className={`${styles.pageTitleRow} relative`}>
          <h1 className={styles.pageTitle}>Admin Dashboard</h1>
          <button
            ref={mobileTriggerRef}
            type="button"
            onClick={() => setIsMobileNavOpen(true)}
            className="absolute right-0 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-xl border border-black/10 bg-white text-[#2f2442] shadow-sm transition hover:bg-[#f7f4fb] active:bg-[#f1edf8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6e2ac0]/40 md:hidden"
            aria-label="Open admin navigation"
            aria-expanded={isMobileNavOpen}
          >
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5"
              aria-hidden="true"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M4 7h16" />
              <path d="M4 12h16" />
              <path d="M4 17h16" />
            </svg>
          </button>
        </div>
        <p className={styles.subheading}>
          Manage student records, class registers, and waiting lists
        </p>
      </header>

      <div className={styles.settings} style={{ gap: "16px" }}>
        <nav
          className={`${styles.settingsNav} hidden border-r border-[#6c35c3]/16 pr-4 md:block`}
          aria-label="Admin dashboard sections"
        >
          <ul>
            {navItems.map((item) => (
              <li key={item.key}>
                <button
                  type="button"
                  className={`${styles.navItem} ${
                    tab === item.key ? styles.navItemActive : ""
                  } cursor-pointer`}
                  aria-current={tab === item.key ? "page" : undefined}
                  onClick={() => setTab(item.key)}
                >
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <section className={`${styles.settingsContent} px-1 md:px-0`}>
          <div
            className={
              isFlatContentTab
                ? "w-full border-0 bg-white p-3"
                : styles.card
            }
          >
            <div className={isFlatContentTab ? "mb-3 border-b border-[#e6e0ee] pb-3" : styles.cardHeader}>
              <div>
                <h2 className={isFlatContentTab ? "text-base font-semibold text-[#2a203c]" : ""}>
                  {cardTitle}
                </h2>
              </div>
            </div>

            {tab === "students" ? (
              <div className="space-y-4">
                {childrenLoadError ? (
                  <div className={styles.errorBanner} role="alert">
                    <span>{childrenLoadError}</span>
                  </div>
                ) : null}
                {!childrenLoadError ? (
                  <ChildPicker {...childPickerProps} />
                ) : null}
              </div>
            ) : null}

            {tab === "register" ? (
              <>
                {registerClassesError ? (
                  <div className={styles.errorBanner} role="alert">
                    <span>{registerClassesError}</span>
                  </div>
                ) : null}
                {!registerClassesError ? (
                  <ClassRegisterPicker
                    sessions={registerSessions}
                    referenceNowIso={referenceNowIso}
                    onSelect={(session) => {
                      const registerDate = session.startAt.slice(0, 10);
                      router.push(
                        `/admin/register/${encodeURIComponent(session.classId)}?date=${encodeURIComponent(registerDate)}`
                      );
                    }}
                  />
                ) : null}
              </>
            ) : null}

            {tab === "class-cancellations" ? (
              <div className="space-y-4">
                {registerClassesError ? (
                  <div className={styles.errorBanner} role="alert">
                    <span>{registerClassesError}</span>
                  </div>
                ) : null}
                {classCancellationError ? (
                  <div className={styles.errorBanner} role="alert">
                    <span>{classCancellationError}</span>
                  </div>
                ) : null}
                {classCancellationMessage ? (
                  <div className="rounded-lg border border-[#d7c7ef] bg-[#f6f1ff] px-3 py-2 text-sm text-[#2a203c]">
                    {classCancellationMessage}
                  </div>
                ) : null}
                {!registerClassesError ? (
                  selectedCancellationClass ? (
                    <div className="space-y-4">
                      <div className="flex flex-col gap-3 rounded-xl border border-[#e6e0ee] bg-white p-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedCancellationClassId(null);
                                setClassCancellationStudents([]);
                                setClassCancellationError(null);
                                setClassCancellationMessage(null);
                              }}
                              className="inline-flex min-h-10 items-center justify-center rounded-lg border border-[#d9ccef] bg-[#faf7ff] px-3 text-sm font-semibold text-[#5b2ca7] transition hover:border-[#cbb6ea] hover:bg-[#f4eeff] hover:text-[#49228c]"
                            >
                              Back to class list
                            </button>
                            <h3 className="mt-3 text-lg font-black tracking-tight text-[#24193a]">
                              {formatClassCancellationLabel(selectedCancellationClass)}
                            </h3>
                            <p className="mt-1 text-sm text-[#5b526a]">
                              {selectedCancellationClass.programme} •{" "}
                              {normalizeWeekdayLabel(selectedCancellationClass.weekday) || "Weekday not set"} •{" "}
                              {formatClassTimeRange(
                                selectedCancellationClass.startTime,
                                selectedCancellationClass.endTime
                              )}
                            </p>
                          </div>
                          <div className="rounded-xl border border-[#e6e0ee] bg-[#faf7ff] px-4 py-3 text-sm text-[#2a203c]">
                            <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[#6c35c3]">
                              Active bookings
                            </p>
                            <p className="mt-1 text-2xl font-black tracking-tight text-[#24193a]">
                              {selectedCancellationClass.enrolledCount}
                            </p>
                          </div>
                        </div>
                        <p className="text-sm text-[#5b526a]">
                          Cancelled bookings are retained for history. Refunds and subscription changes must still be handled in Stripe.
                        </p>
                      </div>

                      {classCancellationLoading ? (
                        <p className="rounded-lg border border-[#e6e0ee] bg-white px-3 py-5 text-sm text-[#2a203c]/75">
                          Loading active class bookings...
                        </p>
                      ) : classCancellationStudents.length > 0 ? (
                        <div className="space-y-3">
                          <div className="hidden overflow-hidden rounded-xl border border-[#e6e0ee] md:block">
                            <table className="min-w-full border-collapse">
                              <thead className="bg-[#f6f1ff]">
                                <tr className="text-left text-xs uppercase tracking-[0.08em] text-[#2a203c]/75">
                                  <th className="px-3 py-2 font-semibold">Student</th>
                                  <th className="px-3 py-2 font-semibold">Parent / account</th>
                                  <th className="px-3 py-2 font-semibold">Phone</th>
                                  <th className="px-3 py-2 font-semibold">Stripe</th>
                                  <th className="px-3 py-2 text-right font-semibold">Action</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-[#ece6f4] bg-white text-sm text-[#2a203c]">
                                {classCancellationStudents.map((row) => {
                                  const childName =
                                    `${row.childFirstName ?? ""} ${row.childLastName ?? ""}`.trim() || "Unknown";
                                  const accountName =
                                    `${row.accountFirstName ?? ""} ${row.accountLastName ?? ""}`.trim() || "Unknown";

                                  return (
                                    <tr key={row.bookingId}>
                                      <td className="px-3 py-3 font-semibold">{childName}</td>
                                      <td className="px-3 py-3">
                                        <p className="font-semibold text-[#24193a]">{accountName}</p>
                                        <p className="mt-0.5 text-[#5b526a] break-all">
                                          {row.accountEmail || "No email address"}
                                        </p>
                                      </td>
                                      <td className="px-3 py-3">
                                        {row.accountTelNo || <span className="text-[#2a203c]/55">Not set</span>}
                                      </td>
                                      <td className="px-3 py-3">
                                        {row.stripeCustomerId ? (
                                          <a
                                            href={getStripeCustomerUrl(row.stripeCustomerId)}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex min-h-9 items-center justify-center rounded-lg border border-[#d9ccef] bg-[#faf7ff] px-3 text-xs font-semibold text-[#5b2ca7] transition hover:border-[#cbb6ea] hover:bg-[#f4eeff] hover:text-[#49228c]"
                                          >
                                            View customer
                                          </a>
                                        ) : (
                                          <span className="text-[#2a203c]/55">No Stripe customer</span>
                                        )}
                                      </td>
                                      <td className="px-3 py-3 text-right">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setClassCancellationCandidate(row);
                                            setClassCancellationConfirmedStripeUpdate(false);
                                            setClassCancellationError(null);
                                          }}
                                          className="inline-flex min-h-9 cursor-pointer items-center justify-center rounded-lg border border-[#dfcfe9] bg-white px-3 text-xs font-semibold text-[#6a1f35] transition hover:bg-[#fff4f7]"
                                        >
                                          Cancel booking
                                        </button>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>

                          <div className="space-y-2 md:hidden">
                            {classCancellationStudents.map((row) => {
                              const childName =
                                `${row.childFirstName ?? ""} ${row.childLastName ?? ""}`.trim() || "Unknown";
                              const accountName =
                                `${row.accountFirstName ?? ""} ${row.accountLastName ?? ""}`.trim() || "Unknown";

                              return (
                                <div key={row.bookingId} className="rounded-xl border border-[#e6e0ee] bg-white p-3">
                                  <div className="space-y-1.5 text-sm text-[#2a203c]">
                                    <p className="font-semibold">{childName}</p>
                                    <p className="font-semibold text-[#24193a]">{accountName}</p>
                                    <p>{row.accountEmail || "No email address"}</p>
                                    <p>{row.accountTelNo || "Phone not set"}</p>
                                  </div>
                                  <div className="mt-3 grid grid-cols-1 gap-2">
                                    {row.stripeCustomerId ? (
                                      <a
                                        href={getStripeCustomerUrl(row.stripeCustomerId)}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex min-h-10 items-center justify-center rounded-lg border border-[#d9ccef] bg-[#faf7ff] px-3 text-sm font-semibold text-[#5b2ca7] transition hover:border-[#cbb6ea] hover:bg-[#f4eeff] hover:text-[#49228c]"
                                      >
                                        View customer
                                      </a>
                                    ) : null}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setClassCancellationCandidate(row);
                                        setClassCancellationConfirmedStripeUpdate(false);
                                        setClassCancellationError(null);
                                      }}
                                      className="inline-flex min-h-10 items-center justify-center rounded-lg border border-[#dfcfe9] bg-white px-3 text-sm font-semibold text-[#6a1f35] transition hover:bg-[#fff4f7]"
                                    >
                                      Cancel booking
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <p className="rounded-lg border border-[#e6e0ee] bg-white px-3 py-5 text-sm text-[#2a203c]/75">
                          No active class bookings were found for this class.
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="rounded-xl border border-[#e6e0ee] bg-white p-3">
                        <div className="grid w-full grid-cols-1 gap-2 xl:grid-cols-[220px_220px_minmax(0,1fr)]">
                          <select
                            value={classCancellationProgrammeFilter}
                            onChange={(event) =>
                              setClassCancellationProgrammeFilter(
                                event.target.value as "all" | "Recreational" | "Competition"
                              )
                            }
                            className="h-10 rounded-lg border border-[#d7c7ef] bg-white px-3 text-sm text-[#2a203c] outline-none ring-[#6e2ac0]/25 transition focus:ring-2"
                          >
                            <option value="all">All programmes</option>
                            <option value="Recreational">Recreational</option>
                            <option value="Competition">Competition</option>
                          </select>
                          <select
                            value={classCancellationWeekdayFilter}
                            onChange={(event) => setClassCancellationWeekdayFilter(event.target.value)}
                            className="h-10 rounded-lg border border-[#d7c7ef] bg-white px-3 text-sm text-[#2a203c] outline-none ring-[#6e2ac0]/25 transition focus:ring-2"
                          >
                            <option value="all">All weekdays</option>
                            {classCancellationWeekdayOptions.map((weekday) => (
                              <option key={weekday} value={weekday}>
                                {weekday}
                              </option>
                            ))}
                          </select>
                          <div className="flex items-center text-sm text-[#2a203c]/80">
                            Showing {filteredClassCancellationClasses.length} class
                            {filteredClassCancellationClasses.length === 1 ? "" : "es"}.
                          </div>
                        </div>
                      </div>

                      {filteredClassCancellationClasses.length > 0 ? (
                        <div className="space-y-3">
                          {filteredClassCancellationClasses.map((row) => (
                            <button
                              key={row.id}
                              type="button"
                              onClick={() => void loadClassCancellationStudents(row.id)}
                              className="group relative w-full overflow-hidden rounded-xl border border-[#e6e0ee] bg-white p-4 text-left transition hover:border-[#cbb6ea]"
                            >
                              <span
                                aria-hidden
                                className="pointer-events-none absolute inset-0 origin-left scale-x-0 bg-[#f0e8fb] transition-transform duration-300 ease-out group-hover:scale-x-100"
                              />
                              <span
                                aria-hidden
                                className="pointer-events-none absolute inset-y-2 left-0 z-[1] w-[2px] rounded-full bg-[#6e2ac0] opacity-0 transition-opacity duration-200 group-hover:opacity-75"
                              />
                              <div className="relative z-[1] grid gap-3 lg:grid-cols-[220px_220px_120px]">
                                <div>
                                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#6f6287]">
                                    Programme
                                  </p>
                                  <p className="mt-1 font-semibold text-[#24193a]">{row.programme}</p>
                                </div>
                                <div>
                                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#6f6287]">
                                    Day / time
                                  </p>
                                  <p className="mt-1 font-semibold text-[#24193a]">
                                    {normalizeWeekdayLabel(row.weekday) || "Weekday not set"}
                                  </p>
                                  <p className="mt-0.5 text-sm text-[#5b526a]">
                                    {formatClassTimeRange(row.startTime, row.endTime)}
                                  </p>
                                </div>
                                <div className="lg:text-right">
                                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#6f6287]">
                                    Active
                                  </p>
                                  <p className="mt-1 font-semibold text-[#24193a]">{row.enrolledCount}</p>
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p className="rounded-lg border border-[#e6e0ee] bg-white px-3 py-5 text-sm text-[#2a203c]/75">
                          No class bookings match your current filters.
                        </p>
                      )}
                    </div>
                  )
                ) : null}
              </div>
            ) : null}

            {tab === "summer-camp-register" ? (
              <>
                {summerCampRegisterSessionsError ? (
                  <div className={styles.errorBanner} role="alert">
                    <span>{summerCampRegisterSessionsError}</span>
                  </div>
                ) : null}
                {!summerCampRegisterSessionsError ? (
                  <ClassRegisterPicker
                    sessions={summerCampRegisterSessions}
                    referenceNowIso={referenceNowIso}
                    heading="Upcoming camp days"
                    showHistorical={false}
                    programmeOptions={["all"]}
                    onSelect={(session) => {
                      const registerDate = session.startAt.slice(0, 10);
                      router.push(
                        `/admin/summer-camp-register/${encodeURIComponent(registerDate)}?slug=${encodeURIComponent(session.classId)}`
                      );
                    }}
                  />
                ) : null}
              </>
            ) : null}

            {tab === "waiting" ? (
              <div className="space-y-4">
                {waitlistLoadError ? (
                  <div className={styles.errorBanner} role="alert">
                    <span>{waitlistLoadError}</span>
                  </div>
                ) : null}
                {waitlistActionError ? (
                  <div className={styles.errorBanner} role="alert">
                    <span>{waitlistActionError}</span>
                  </div>
                ) : null}
                {waitlistActionMessage ? (
                  <div className="rounded-lg border border-[#d7c7ef] bg-[#f6f1ff] px-3 py-2 text-sm text-[#2a203c]">
                    {waitlistActionMessage}
                  </div>
                ) : null}
                {!waitlistLoadError ? (
                  waitlistRowsState.length > 0 ? (
                    <div className="space-y-3">
                      <div className="flex flex-col gap-2 rounded-xl border border-[#e6e0ee] bg-white p-3 md:flex-row md:items-center md:justify-between">
                        <div className="grid w-full grid-cols-1 gap-2 md:grid-cols-[minmax(0,1fr)_220px_220px]">
                          <input
                            type="text"
                            value={waitlistQuery}
                            onChange={(event) => setWaitlistQuery(event.target.value)}
                            placeholder="Search child, class, email or phone"
                            className="h-10 rounded-lg border border-[#d7c7ef] bg-white px-3 text-sm text-[#2a203c] outline-none ring-[#6e2ac0]/25 transition focus:ring-2"
                          />
                          <select
                            value={waitlistClassFilter}
                            onChange={(event) => setWaitlistClassFilter(event.target.value)}
                            className="h-10 rounded-lg border border-[#d7c7ef] bg-white px-3 text-sm text-[#2a203c] outline-none ring-[#6e2ac0]/25 transition focus:ring-2"
                          >
                            <option value="all">All classes</option>
                            {waitlistClassOptions.map((className) => (
                              <option key={className} value={className}>
                                {className}
                              </option>
                            ))}
                          </select>
                          <select
                            value={waitlistSort}
                            onChange={(event) =>
                              setWaitlistSort(event.target.value === "newest" ? "newest" : "oldest")
                            }
                            className="h-10 rounded-lg border border-[#d7c7ef] bg-white px-3 text-sm text-[#2a203c] outline-none ring-[#6e2ac0]/25 transition focus:ring-2"
                          >
                            <option value="oldest">Oldest first</option>
                            <option value="newest">Newest first</option>
                          </select>
                        </div>
                      </div>

                      <p className="text-sm text-[#2a203c]/80">
                        Showing {filteredWaitlistRows.length} of {waitlistRowsState.length} entries.
                      </p>

                      <div className="hidden overflow-hidden rounded-xl border border-[#e6e0ee] md:block">
                        <table className="min-w-full border-collapse">
                          <thead className="bg-[#f6f1ff]">
                            <tr className="text-left text-xs uppercase tracking-[0.08em] text-[#2a203c]/75">
                              <th className="px-3 py-2 font-semibold">Student</th>
                              <th className="px-3 py-2 font-semibold">Class</th>
                              <th className="px-3 py-2 font-semibold">Date added</th>
                              <th className="px-3 py-2 font-semibold">Email</th>
                              <th className="px-3 py-2 font-semibold">Phone</th>
                              <th className="px-3 py-2 text-right font-semibold">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#ece6f4] bg-white text-sm text-[#2a203c]">
                            {filteredWaitlistRows.map((row) => {
                              const rowKey = `${row.childId}-${row.classId}`;
                              const isRemoving = waitlistRemovingKey === rowKey;
                              return (
                                <tr key={`${rowKey}-${row.requestedOn}`}>
                                  <td className="px-3 py-3 font-semibold">{row.childName}</td>
                                  <td className="px-3 py-3">{row.className}</td>
                                  <td className="px-3 py-3">{formatWaitlistDate(row.requestedOn)}</td>
                                  <td className="px-3 py-3">
                                    {row.accountEmail || <span className="text-[#2a203c]/55">Not set</span>}
                                  </td>
                                  <td className="px-3 py-3">
                                    {row.accountTelNo || <span className="text-[#2a203c]/55">Not set</span>}
                                  </td>
                                  <td className="px-3 py-3 text-right">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setWaitlistActionError(null);
                                        setWaitlistDeleteCandidate(row);
                                      }}
                                      disabled={isRemoving}
                                      className="inline-flex h-9 cursor-pointer items-center justify-center rounded-lg border border-[#dfcfe9] bg-white px-3 text-xs font-semibold text-[#6a1f35] transition hover:bg-[#fff4f7] disabled:cursor-not-allowed disabled:opacity-55"
                                    >
                                      {isRemoving ? "Removing..." : "Remove"}
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      <div className="space-y-2 md:hidden">
                        {filteredWaitlistRows.map((row) => {
                          const rowKey = `${row.childId}-${row.classId}`;
                          const isRemoving = waitlistRemovingKey === rowKey;
                          return (
                            <div key={`${rowKey}-${row.requestedOn}`} className="rounded-xl border border-[#e6e0ee] bg-white p-3">
                              <div className="space-y-1.5 text-sm text-[#2a203c]">
                                <p className="font-semibold">{row.childName}</p>
                                <p>{row.className}</p>
                                <p>{formatWaitlistDate(row.requestedOn)}</p>
                                <p>{row.accountEmail || "Email not set"}</p>
                                <p>{row.accountTelNo || "Phone not set"}</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setWaitlistActionError(null);
                                  setWaitlistDeleteCandidate(row);
                                }}
                                disabled={isRemoving}
                                className="mt-3 inline-flex h-9 cursor-pointer items-center justify-center rounded-lg border border-[#dfcfe9] bg-white px-3 text-xs font-semibold text-[#6a1f35] transition hover:bg-[#fff4f7] disabled:cursor-not-allowed disabled:opacity-55"
                              >
                                {isRemoving ? "Removing..." : "Remove"}
                              </button>
                            </div>
                          );
                        })}
                      </div>

                      {filteredWaitlistRows.length === 0 ? (
                        <p className="rounded-lg border border-[#e6e0ee] bg-white px-3 py-5 text-sm text-[#2a203c]/75">
                          No waitlist entries match your current filters.
                        </p>
                      ) : null}
                    </div>
                  ) : (
                    <p className="text-sm text-[#2a203c]/75">No children are currently on the waiting list.</p>
                  )
                ) : null}
              </div>
            ) : null}

            {tab === "missed-payments" ? (
              <div className="space-y-4">
                {missedPaymentsLoadError ? (
                  <div className={styles.errorBanner} role="alert">
                    <span>{missedPaymentsLoadError}</span>
                  </div>
                ) : null}
                {!missedPaymentsLoadError ? (
                  missedPaymentsRows.length > 0 ? (
                    <div className="space-y-3">
                      <div className="rounded-xl border border-[#e6e0ee] bg-white p-3 text-sm text-[#2a203c]/78">
                        This view is pulled directly from both Stripe accounts and grouped at
                        account/email level rather than child level.
                      </div>

                      <div className="grid gap-3 md:grid-cols-1 xl:grid-cols-4">
                        <div className="rounded-xl border border-[#e6e0ee] bg-white p-4">
                          <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[#6c35c3]">
                            Affected accounts
                          </p>
                          <p className="mt-2 text-2xl font-black tracking-tight text-[#24193a]">
                            {missedPaymentsSummary.affectedAccountCount}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 rounded-xl border border-[#e6e0ee] bg-white p-3">
                        <div className="grid w-full grid-cols-1 gap-2 xl:grid-cols-[minmax(0,1fr)_220px_180px_180px]">
                          <input
                            type="text"
                            value={missedPaymentsQuery}
                            onChange={(event) => setMissedPaymentsQuery(event.target.value)}
                            placeholder="Search email, subscription, invoice or customer"
                            className="h-10 rounded-lg border border-[#d7c7ef] bg-white px-3 text-sm text-[#2a203c] outline-none ring-[#6e2ac0]/25 transition focus:ring-2"
                          />
                          <select
                            value={missedPaymentsProgrammeFilter}
                            onChange={(event) =>
                              setMissedPaymentsProgrammeFilter(
                                event.target.value as "all" | "Recreational" | "Competition"
                              )
                            }
                            className="h-10 rounded-lg border border-[#d7c7ef] bg-white px-3 text-sm text-[#2a203c] outline-none ring-[#6e2ac0]/25 transition focus:ring-2"
                          >
                            <option value="all">All programmes</option>
                            <option value="Recreational">Recreational</option>
                            <option value="Competition">Competition</option>
                          </select>
                          <select
                            value={missedPaymentsStatusFilter}
                            onChange={(event) =>
                              setMissedPaymentsStatusFilter(
                                event.target.value as "all" | "past_due" | "unpaid"
                              )
                            }
                            className="h-10 rounded-lg border border-[#d7c7ef] bg-white px-3 text-sm text-[#2a203c] outline-none ring-[#6e2ac0]/25 transition focus:ring-2"
                          >
                            <option value="all">All statuses</option>
                            {missedPaymentStatusOptions.map((status) => (
                              <option key={status} value={status}>
                                {status.replaceAll("_", " ")}
                              </option>
                            ))}
                          </select>
                          <select
                            value={missedPaymentsSort}
                            onChange={(event) =>
                              setMissedPaymentsSort(event.target.value as "newest" | "oldest")
                            }
                            className="h-10 rounded-lg border border-[#d7c7ef] bg-white px-3 text-sm text-[#2a203c] outline-none ring-[#6e2ac0]/25 transition focus:ring-2"
                          >
                            <option value="newest">Newest invoice first</option>
                            <option value="oldest">Oldest invoice first</option>
                          </select>
                        </div>

                        <p className="text-sm text-[#2a203c]/80">
                          Showing {filteredMissedPaymentsRows.length} of {missedPaymentsRows.length} late subscriptions.
                        </p>
                      </div>

                      <div className="hidden overflow-hidden rounded-xl border border-[#e6e0ee] md:block">
                        <table className="min-w-full border-collapse">
                          <thead className="bg-[#f6f1ff]">
                            <tr className="text-left text-xs uppercase tracking-[0.08em] text-[#2a203c]/75">
                              <th className="px-3 py-2 font-semibold">Programme</th>
                              <th className="px-3 py-2 font-semibold">Account</th>
                              <th className="px-3 py-2 font-semibold">Payment status</th>
                              <th className="px-3 py-2 font-semibold">Subscription</th>
                              <th className="px-3 py-2 font-semibold">Latest invoice</th>
                              <th className="px-3 py-2 font-semibold">Next attempt</th>
                              <th className="px-3 py-2 font-semibold">Stripe</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#ece6f4] bg-white text-sm text-[#2a203c]">
                            {filteredMissedPaymentsRows.map((row) => (
                              <tr key={row.id}>
                                <td className="px-3 py-3 font-semibold">{row.programme}</td>
                                <td className="px-3 py-3">
                                  <p className="font-semibold text-[#24193a]">{row.accountFullName}</p>
                                  <p className="mt-0.5 text-[#5b526a]">
                                    {row.accTelNo || "No contact number"}
                                  </p>
                                  <p className="mt-0.5 text-[#5b526a]">{row.email}</p>
                                </td>
                                <td className="px-3 py-3 uppercase">{row.status.replaceAll("_", " ")}</td>
                                <td className="px-3 py-3 uppercase">
                                  {row.subscriptionState.replaceAll("_", " ")}
                                </td>
                                <td className="px-3 py-3">{formatDate(row.invoiceCreated)}</td>
                                <td className="px-3 py-3">
                                  {formatDate(row.nextPaymentAttempt)}
                                </td>
                                <td className="px-3 py-3">
                                  <div className="flex flex-col items-start gap-1.5">
                                    <a
                                      href={getStripeSubscriptionUrl(row.subscriptionId)}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="inline-flex min-h-9 items-center rounded-lg border border-[#d9ccef] bg-[#faf7ff] px-3 text-xs font-semibold text-[#5b2ca7] transition hover:border-[#cbb6ea] hover:bg-[#f4eeff] hover:text-[#49228c]"
                                    >
                                      View subscription
                                    </a>
                                    <a
                                      href={getStripeCustomerUrl(row.customerId)}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="inline-flex min-h-9 items-center rounded-lg border border-[#d9ccef] bg-[#faf7ff] px-3 text-xs font-semibold text-[#5b2ca7] transition hover:border-[#cbb6ea] hover:bg-[#f4eeff] hover:text-[#49228c]"
                                    >
                                      View customer
                                    </a>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div className="space-y-2 md:hidden">
                        {filteredMissedPaymentsRows.map((row) => (
                          <div key={row.id} className="rounded-xl border border-[#e6e0ee] bg-white p-3">
                            <div className="space-y-1.5 text-sm text-[#2a203c]">
                              <p className="font-semibold">{row.programme}</p>
                              <p className="font-semibold text-[#24193a]">{row.accountFullName}</p>
                              <p>{row.accTelNo || "No contact number"}</p>
                              <p>{row.email}</p>
                              <p className="uppercase">Payment: {row.status.replaceAll("_", " ")}</p>
                              <p className="uppercase">
                                Subscription: {row.subscriptionState.replaceAll("_", " ")}
                              </p>
                              <p>Invoice: {formatDate(row.invoiceCreated)}</p>
                              <p>Next attempt: {formatDate(row.nextPaymentAttempt)}</p>
                              <div className="grid grid-cols-1 gap-2 pt-2 sm:grid-cols-2">
                                <a
                                  href={getStripeSubscriptionUrl(row.subscriptionId)}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex min-h-10 items-center justify-center rounded-lg border border-[#d9ccef] bg-[#faf7ff] px-3 text-sm font-semibold text-[#5b2ca7] transition hover:border-[#cbb6ea] hover:bg-[#f4eeff] hover:text-[#49228c]"
                                >
                                  View subscription
                                </a>
                                <a
                                  href={getStripeCustomerUrl(row.customerId)}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex min-h-10 items-center justify-center rounded-lg border border-[#d9ccef] bg-[#faf7ff] px-3 text-sm font-semibold text-[#5b2ca7] transition hover:border-[#cbb6ea] hover:bg-[#f4eeff] hover:text-[#49228c]"
                                >
                                  View customer
                                </a>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {filteredMissedPaymentsRows.length === 0 ? (
                        <p className="rounded-lg border border-[#e6e0ee] bg-white px-3 py-5 text-sm text-[#2a203c]/75">
                          No missed payments match your current filters.
                        </p>
                      ) : null}
                    </div>
                  ) : (
                    <p className="text-sm text-[#2a203c]/75">
                      No late or missed subscription payments found in the configured Stripe accounts.
                    </p>
                  )
                ) : null}
              </div>
            ) : null}

            {tab === "birthday-parties" ? (
              <div className="space-y-4">
                <div className="inline-flex flex-wrap gap-2 rounded-xl border border-[#e6e0ee] bg-white p-1">
                  <button
                    type="button"
                    onClick={() => setBirthdayPartySubview("bookings")}
                    className={[
                      "rounded-lg px-3 py-2 text-sm font-semibold transition",
                      birthdayPartySubview === "bookings"
                        ? "bg-[#6c35c3] text-white"
                        : "text-[#5b2ca7] hover:bg-[#faf7ff]",
                    ].join(" ")}
                  >
                    Upcoming parties
                  </button>
                  <button
                    type="button"
                    onClick={() => setBirthdayPartySubview("availability")}
                    className={[
                      "rounded-lg px-3 py-2 text-sm font-semibold transition",
                      birthdayPartySubview === "availability"
                        ? "bg-[#6c35c3] text-white"
                        : "text-[#5b2ca7] hover:bg-[#faf7ff]",
                    ].join(" ")}
                  >
                    Manage availability
                  </button>
                </div>

                {birthdayPartyBookingsLoadError ? (
                  <div className={styles.errorBanner} role="alert">
                    <span>{birthdayPartyBookingsLoadError}</span>
                  </div>
                ) : null}
                {!birthdayPartyBookingsLoadError && birthdayPartySubview === "bookings" ? (
                  birthdayPartyBookingsRows.length > 0 ? (
                    <div className="space-y-3">
                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="rounded-xl border border-[#e6e0ee] bg-white p-4">
                          <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[#6c35c3]">
                            Upcoming parties
                          </p>
                          <p className="mt-2 text-2xl font-black tracking-tight text-[#24193a]">
                            {birthdayPartySummary.upcomingCount}
                          </p>
                        </div>
                        <div className="rounded-xl border border-[#e6e0ee] bg-white p-4">
                          <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[#6c35c3]">
                            Next party date
                          </p>
                          <p className="mt-2 text-lg font-black tracking-tight text-[#24193a]">
                            {formatDate(birthdayPartySummary.nextPartyDate)}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 rounded-xl border border-[#e6e0ee] bg-white p-3">
                        <div className="grid w-full grid-cols-1 gap-2">
                          <input
                            type="text"
                            value={birthdayPartyQuery}
                            onChange={(event) => setBirthdayPartyQuery(event.target.value)}
                            placeholder="Search account, child, email or phone"
                            className="h-10 rounded-lg border border-[#d7c7ef] bg-white px-3 text-sm text-[#2a203c] outline-none ring-[#6e2ac0]/25 transition focus:ring-2"
                          />
                        </div>

                        <p className="text-sm text-[#2a203c]/80">
                          Showing {filteredBirthdayPartyRows.length} of {birthdayPartyBookingsRows.length} upcoming birthday party bookings.
                        </p>
                      </div>

                      <div className="space-y-3">
                        {filteredBirthdayPartyRows.map((row) => (
                          <button
                            key={row.id}
                            type="button"
                            onClick={() => router.push(`/admin/birthday-parties/${encodeURIComponent(row.id)}`)}
                            className="group relative w-full overflow-hidden rounded-xl border border-[#e6e0ee] bg-white p-4 text-left transition hover:border-[#cbb6ea]"
                          >
                            <span
                              aria-hidden
                              className="pointer-events-none absolute inset-0 origin-left scale-x-0 bg-[#f0e8fb] transition-transform duration-300 ease-out group-hover:scale-x-100"
                            />
                            <span
                              aria-hidden
                              className="pointer-events-none absolute inset-y-2 left-0 z-[1] w-[2px] rounded-full bg-[#6e2ac0] opacity-0 transition-opacity duration-200 group-hover:opacity-75"
                            />
                            <div className="relative z-[1] grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.1fr)_120px]">
                              <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#6f6287]">
                                  Party date
                                </p>
                                <p className="mt-1 font-semibold text-[#24193a]">{formatDate(row.slotDate)}</p>
                                <p className="mt-0.5 text-sm text-[#5b526a]">
                                  {formatBirthdayTimeRange(row.startTime, row.endTime)}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#6f6287]">
                                  Birthday child
                                </p>
                                <p className="mt-1 font-semibold text-[#24193a]">{row.birthdayChildFullName}</p>
                                <p className="mt-0.5 text-sm text-[#5b526a]">
                                  DOB: {formatDate(row.birthdayChildDateOfBirth)}
                                </p>
                                <p className="mt-1 text-sm text-[#5b526a]">
                                  Turning{" "}
                                  {typeof row.ageTurningAtParty === "number" ? row.ageTurningAtParty : "Unknown"}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#6f6287]">
                                  Account
                                </p>
                                <p className="mt-1 font-semibold text-[#24193a]">{row.accountFullName}</p>
                                <p className="mt-0.5 text-sm text-[#5b526a]">
                                  {row.accTelNo || "No contact number"}
                                </p>
                                <p className="mt-0.5 text-sm text-[#5b526a] break-all">
                                  {row.email || "No email address"}
                                </p>
                              </div>
                              <div className="lg:text-right">
                                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#6f6287]">
                                  Party size
                                </p>
                                <p className="mt-1 font-semibold text-[#24193a]">{row.partySize}</p>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>

                      {filteredBirthdayPartyRows.length === 0 ? (
                        <p className="rounded-lg border border-[#e6e0ee] bg-white px-3 py-5 text-sm text-[#2a203c]/75">
                          No birthday party bookings match your current filters.
                        </p>
                      ) : null}
                    </div>
                  ) : (
                    <p className="text-sm text-[#2a203c]/75">
                      There are no upcoming birthday party bookings right now.
                    </p>
                  )
                ) : null}

                {birthdayPartySubview === "availability" && !birthdayPartyAvailabilityLoadError ? (
                  <BirthdayPartyAvailabilityManager initialSlots={birthdayPartyCalendarSlots} />
                ) : birthdayPartySubview === "availability" ? (
                  <div className={styles.errorBanner} role="alert">
                    <span>{birthdayPartyAvailabilityLoadError}</span>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </section>
      </div>

      {typeof window !== "undefined"
        ? createPortal(
            <AnimatePresence>
              {isMobileNavOpen ? (
                <div className="fixed inset-0 z-[90] md:hidden" aria-hidden={false}>
                  <motion.button
                    type="button"
                    onClick={() => setIsMobileNavOpen(false)}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: reduceMotion ? 0.1 : 0.2 }}
                    className="absolute inset-0 bg-black/45"
                    aria-label="Close admin navigation"
                  />

                  <motion.aside
                    ref={drawerRef}
                    initial={reduceMotion ? { opacity: 0 } : { x: "100%" }}
                    animate={reduceMotion ? { opacity: 1 } : { x: 0 }}
                    exit={reduceMotion ? { opacity: 0 } : { x: "100%" }}
                    transition={{
                      duration: reduceMotion ? 0.12 : 0.22,
                      ease: "easeOut",
                    }}
                    className="absolute top-0 right-0 flex h-full w-[min(320px,86vw)] max-w-[420px] flex-col border-l border-black/[0.08] bg-white px-4 pb-4 pt-5 shadow-[-12px_0_40px_rgba(0,0,0,0.2)] sm:w-[min(380px,86vw)] sm:px-5 sm:pt-6"
                    role="dialog"
                    aria-modal="true"
                    aria-label="Admin navigation"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-base font-semibold text-[#1f1a25]">Admin Portal</p>
                      <button
                        ref={closeButtonRef}
                        type="button"
                        onClick={() => setIsMobileNavOpen(false)}
                        className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-black/[0.08] text-black/75 transition hover:bg-black/[0.08] active:bg-black/[0.12] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6e2ac0]/40"
                        aria-label="Close admin navigation"
                      >
                        <svg
                          viewBox="0 0 24 24"
                          className="h-5 w-5"
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
                    </div>

                    <div className="flex flex-col gap-3">
                      {navItems.map((item) => {
                        const isActive = tab === item.key;
                        return (
                          <AdminNavItem
                            key={`drawer-${item.key}`}
                            label={item.label}
                            icon={item.icon}
                            isActive={isActive}
                            onSelect={() => {
                              setTab(item.key);
                              setIsMobileNavOpen(false);
                            }}
                          />
                        );
                      })}
                    </div>
                  </motion.aside>
                </div>
              ) : null}
            </AnimatePresence>,
            document.body,
          )
        : null}

      <Dialog.Root
        open={classCancellationCandidate !== null}
        onOpenChange={(open) => {
          if (!open && !classCancellationSubmitting) {
            setClassCancellationCandidate(null);
            setClassCancellationConfirmedStripeUpdate(false);
          }
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[100] bg-black/45" />
          <Dialog.Content className="fixed inset-x-3 top-1/2 z-[101] max-h-[86vh] -translate-y-1/2 overflow-hidden border border-[#d8ceeb] bg-white shadow-2xl sm:left-1/2 sm:right-auto sm:w-[min(560px,calc(100vw-32px))] sm:-translate-x-1/2">
            <div className="border-b border-[#e8e0f2] px-4 py-4 sm:px-5">
              <div>
                <Dialog.Title className="text-lg font-bold text-[#24193a]">
                  Cancel class booking
                </Dialog.Title>
                <Dialog.Description className="mt-1 text-sm text-[#5f5177]">
                  This updates the booking in Eagle Gymnastics only. Refunds and subscription changes must be handled separately in Stripe.
                </Dialog.Description>
              </div>
            </div>

            <div className="space-y-4 px-4 py-4 sm:px-5">
              <p className="text-sm text-[#342744]">
                Remove{" "}
                <span className="font-semibold text-[#24193a]">
                  {classCancellationCandidate
                    ? `${classCancellationCandidate.childFirstName ?? ""} ${classCancellationCandidate.childLastName ?? ""}`.trim() ||
                      "this student"
                    : "this student"}
                </span>{" "}
                from{" "}
                <span className="font-semibold text-[#24193a]">
                  {selectedCancellationClass?.className ?? "this class"}
                </span>
                ?
              </p>
              <p className="text-sm text-[#6c607d]">
                The booking record will be retained and marked as cancelled with an admin removal reason.
              </p>

              <label className="flex items-start gap-3 rounded-xl border border-[#e6e0ee] bg-[#faf7ff] p-3 text-sm text-[#2a203c]">
                <input
                  type="checkbox"
                  checked={classCancellationConfirmedStripeUpdate}
                  onChange={(event) =>
                    setClassCancellationConfirmedStripeUpdate(event.target.checked)
                  }
                  className="mt-0.5 h-4 w-4 rounded border-[#cdbfe0] text-[#6c35c3] focus:ring-[#6c35c3]"
                />
                <span>
                  I confirm that Stripe payments and subscriptions have already been updated separately.
                </span>
              </label>
            </div>

            <div className="border-t border-[#e8e0f2] px-4 py-4 sm:px-5">
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Dialog.Close asChild>
                  <button
                    type="button"
                    disabled={classCancellationSubmitting}
                    className="h-10 border border-[#ddd4ea] bg-white px-4 text-sm font-semibold text-[#6f6384] hover:bg-[#faf7ff] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Keep booking
                  </button>
                </Dialog.Close>
                <button
                  type="button"
                  onClick={() => {
                    if (!classCancellationCandidate || !classCancellationConfirmedStripeUpdate) {
                      return;
                    }
                    void cancelClassBooking(classCancellationCandidate);
                  }}
                  disabled={
                    !classCancellationCandidate ||
                    !classCancellationConfirmedStripeUpdate ||
                    classCancellationSubmitting
                  }
                  className={[
                    "h-10 border px-4 text-sm font-semibold transition",
                    classCancellationCandidate &&
                    classCancellationConfirmedStripeUpdate &&
                    !classCancellationSubmitting
                      ? "cursor-pointer border-[#d93636] bg-[#d93636] text-white hover:bg-[#bd2d2d]"
                      : "cursor-not-allowed border-[#eadada] bg-[#f8f6fb] text-[#b79a9a]",
                  ].join(" ")}
                >
                  {classCancellationSubmitting ? "Cancelling..." : "Cancel booking"}
                </button>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <Dialog.Root
        open={waitlistDeleteCandidate !== null}
        onOpenChange={(open) => {
          if (!open && !waitlistRemovingKey) {
            setWaitlistDeleteCandidate(null);
            setWaitlistActionError(null);
          }
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[100] bg-black/45" />
          <Dialog.Content className="fixed inset-x-3 top-1/2 z-[101] max-h-[86vh] -translate-y-1/2 overflow-hidden border border-[#d8ceeb] bg-white shadow-2xl sm:left-1/2 sm:right-auto sm:w-[min(520px,calc(100vw-32px))] sm:-translate-x-1/2">
            <div className="border-b border-[#e8e0f2] px-4 py-4 sm:px-5">
              <div>
                <Dialog.Title className="text-lg font-bold text-[#24193a]">
                  Remove waitlist entry
                </Dialog.Title>
                <Dialog.Description className="mt-1 text-sm text-[#5f5177]">
                  This will remove the student from the waiting list for this class.
                </Dialog.Description>
              </div>
            </div>

            <div className="px-4 py-4 sm:px-5">
              <p className="text-sm text-[#342744]">
                Remove{" "}
                <span className="font-semibold text-[#24193a]">
                  {waitlistDeleteCandidate?.childName ?? "this student"}
                </span>{" "}
                from{" "}
                <span className="font-semibold text-[#24193a]">
                  {waitlistDeleteCandidate?.className ?? "this class"}
                </span>
                ?
              </p>
              <p className="mt-2 text-sm text-[#6c607d]">
                Warning, this action is permanent and cannot be undone.
              </p>
            </div>

            <div className="border-t border-[#e8e0f2] px-4 py-4 sm:px-5">
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Dialog.Close asChild>
                  <button
                    type="button"
                    disabled={waitlistRemovingKey !== null}
                    className="h-10 border border-[#ddd4ea] bg-white px-4 text-sm font-semibold text-[#6f6384] hover:bg-[#faf7ff] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Cancel
                  </button>
                </Dialog.Close>
                <button
                  type="button"
                  onClick={() => {
                    if (!waitlistDeleteCandidate) return;
                    void removeFromWaitlist(waitlistDeleteCandidate);
                  }}
                  disabled={!waitlistDeleteCandidate || waitlistRemovingKey !== null}
                  className={[
                    "h-10 border px-4 text-sm font-semibold transition",
                    waitlistDeleteCandidate && waitlistRemovingKey === null
                      ? "cursor-pointer border-[#d93636] bg-[#d93636] text-white hover:bg-[#bd2d2d]"
                      : "cursor-not-allowed border-[#eadada] bg-[#f8f6fb] text-[#b79a9a]",
                  ].join(" ")}
                >
                  {waitlistRemovingKey !== null ? "Removing..." : "Remove entry"}
                </button>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

    </div>
  );
}
