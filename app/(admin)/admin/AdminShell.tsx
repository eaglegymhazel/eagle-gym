"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { createPortal } from "react-dom";
import { CalendarDays, ClipboardList, Clock3, Gift, LayoutDashboard, Users } from "lucide-react";
import styles from "@/app/(portal)/(protected)/account/account.module.css";
import type { Child } from "@/components/admin/mockChildren";
import type { Session } from "@/components/admin/mockSessions";
import type { RegisterClassTemplate } from "@/components/admin/sessionBuild";
import AdminNavItem from "@/components/admin/AdminNavItem";
import type { AdminWaitlistRow } from "@/lib/server/adminDashboard";
import type { AdminMissedPaymentRow } from "@/lib/server/adminMissedPayments";
import type { AdminBirthdayPartyBookingRow } from "@/lib/server/adminBirthdayPartyBookings";
import type { BirthdayPartyCalendarSlotSummary } from "@/lib/server/birthdayPartyBookings";
import type {
  AdminCalendarEventFilterOptions,
  AdminCalendarEventRow,
} from "@/lib/server/adminCalendarEvents";

type AdminTabKey =
  | "home"
  | "students"
  | "register"
  | "summer-camp-register"
  | "waiting"
  | "missed-payments"
  | "birthday-parties"
  | "calendar-events";

type StudentDirectoryView = "current" | "archived";

type NavItem = {
  key: AdminTabKey;
  label: string;
  icon: typeof Users;
  description?: string;
};

const navItems: NavItem[] = [
  { key: "home", label: "Admin Home", icon: LayoutDashboard },
  {
    key: "students",
    label: "Student Management",
    icon: Users,
    description: "Search student records, review profile details, update class bookings, and manage admin-only student settings.",
  },
  {
    key: "register",
    label: "Class Register",
    icon: ClipboardList,
    description: "Open weekly class registers to mark attendance and review who is booked into each recreational class.",
  },
  {
    key: "summer-camp-register",
    label: "Summer Camp Register",
    icon: ClipboardList,
    description: "View summer camp sessions, check booked children, and record attendance for each camp date.",
  },
  {
    key: "waiting",
    label: "Waiting List",
    icon: Clock3,
    description: "Review waiting list requests and keep track of families waiting for suitable class spaces.",
  },
  {
    key: "missed-payments",
    label: "Missed Payments",
    icon: Clock3,
    description: "Check failed or missing payment records so account issues can be followed up quickly.",
  },
  {
    key: "birthday-parties",
    label: "Birthday Parties",
    icon: Gift,
    description: "Manage party bookings, view booking details, and check availability for birthday party slots.",
  },
  {
    key: "calendar-events",
    label: "Calendar Events",
    icon: CalendarDays,
    description: "Add, edit, and filter recreational and competition calendar dates shown across the public site.",
  },
];

const CalendarEventsPanel = dynamic(() => import("./CalendarEventsPanel"), {
  loading: () => <AdminPanelSkeleton />,
});
const BirthdayPartiesPanel = dynamic(() => import("./BirthdayPartiesPanel"), {
  loading: () => <AdminPanelSkeleton />,
});
const StudentsPanel = dynamic(() => import("./StudentsPanel"), {
  loading: () => <AdminPanelSkeleton />,
});
const RegisterPanel = dynamic(() => import("./RegisterPanel"), {
  loading: () => <AdminPanelSkeleton />,
});
const SummerCampRegisterPanel = dynamic(() => import("./SummerCampRegisterPanel"), {
  loading: () => <AdminPanelSkeleton />,
});
const MissedPaymentsPanel = dynamic(() => import("./MissedPaymentsPanel"), {
  loading: () => <AdminPanelSkeleton />,
});
const WaitlistPanel = dynamic(() => import("./WaitlistPanel"), {
  loading: () => <AdminPanelSkeleton />,
});

function AdminPanelSkeleton() {
  return (
    <div className="space-y-4 py-2">
      <div className="grid gap-3 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={`admin-skeleton-card-${index}`}
            className="h-24 animate-pulse rounded-xl border border-[#e6e0ee] bg-gradient-to-r from-[#f7f3fb] via-[#f1e9fb] to-[#f7f3fb]"
          />
        ))}
      </div>
      <div className="rounded-xl border border-[#e6e0ee] bg-white p-4">
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={`admin-skeleton-row-${index}`}
              className="h-12 animate-pulse rounded-lg bg-gradient-to-r from-[#f7f3fb] via-[#f1e9fb] to-[#f7f3fb]"
            />
          ))}
        </div>
      </div>
    </div>
  );
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
  initialCalendarEventsRows,
  initialCalendarEventsHasMore,
  initialCalendarEventsNextOffset,
  initialCalendarEventsFilterOptions,
  initialChildrenLoadError,
  initialRegisterClassesError,
  initialSummerCampRegisterSessionsError,
  initialWaitlistLoadError,
  initialMissedPaymentsLoadError,
  initialBirthdayPartyBookingsLoadError,
  initialBirthdayPartyAvailabilityLoadError,
  initialCalendarEventsLoadError,
}: {
  referenceNowIso: string;
  initialChildrenData: Child[];
  initialRegisterClasses: RegisterClassTemplate[];
  initialSummerCampRegisterSessions: Session[];
  initialWaitlistRows: AdminWaitlistRow[];
  initialMissedPaymentsRows: AdminMissedPaymentRow[];
  initialBirthdayPartyBookingsRows: AdminBirthdayPartyBookingRow[];
  initialBirthdayPartyCalendarSlots: BirthdayPartyCalendarSlotSummary[];
  initialCalendarEventsRows: AdminCalendarEventRow[];
  initialCalendarEventsHasMore: boolean;
  initialCalendarEventsNextOffset: number;
  initialCalendarEventsFilterOptions: AdminCalendarEventFilterOptions;
  initialChildrenLoadError: string | null;
  initialRegisterClassesError: string | null;
  initialSummerCampRegisterSessionsError: string | null;
  initialWaitlistLoadError: string | null;
  initialMissedPaymentsLoadError: string | null;
  initialBirthdayPartyBookingsLoadError: string | null;
  initialBirthdayPartyAvailabilityLoadError: string | null;
  initialCalendarEventsLoadError: string | null;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reduceMotion = useReducedMotion();
  const mobileTriggerRef = useRef<HTMLButtonElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const drawerRef = useRef<HTMLElement | null>(null);
  const [mobileNavSlot, setMobileNavSlot] = useState<HTMLElement | null>(null);
  const initialTab = useMemo<AdminTabKey>(() => {
    const tabParam = searchParams.get("tab");
    if (
      tabParam === "students" ||
      tabParam === "register" ||
      tabParam === "summer-camp-register" ||
      tabParam === "waiting" ||
      tabParam === "missed-payments" ||
      tabParam === "birthday-parties" ||
      tabParam === "calendar-events" ||
      tabParam === "home"
    ) {
      return tabParam;
    }
    return "home";
  }, [searchParams]);
  const initialStudentDirectoryView = useMemo<StudentDirectoryView>(
    () => (searchParams.get("studentView") === "archived" ? "archived" : "current"),
    [searchParams]
  );

  const [tab, setTab] = useState<AdminTabKey>(initialTab);
  const [studentDirectoryView, setStudentDirectoryView] =
    useState<StudentDirectoryView>(initialStudentDirectoryView);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isTabTransitionPending, startTabTransition] = useTransition();
  const [pendingTab, setPendingTab] = useState<AdminTabKey | null>(null);
  const childrenData = initialChildrenData;
  const childrenLoadError = initialChildrenLoadError;
  const registerClasses = initialRegisterClasses;
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
  const calendarEventsRows = initialCalendarEventsRows;
  const calendarEventsLoadError = initialCalendarEventsLoadError;

  useEffect(() => {
    setTab(initialTab);
    setPendingTab(null);
  }, [initialTab]);

  useEffect(() => {
    setStudentDirectoryView(initialStudentDirectoryView);
  }, [initialStudentDirectoryView]);

  useEffect(() => {
    setMobileNavSlot(document.getElementById("admin-mobile-nav-slot"));
  }, []);

  const navigateToTab = (nextTab: AdminTabKey) => {
    if (nextTab === tab && pendingTab == null) {
      return;
    }

    setTab(nextTab);
    setPendingTab(nextTab);
    startTabTransition(() => {
      router.push(nextTab === "home" ? "/admin" : `/admin?tab=${nextTab}`);
    });
  };
  const isTabLoading = isTabTransitionPending && pendingTab === tab;
  const changeStudentDirectoryView = (nextView: StudentDirectoryView) => {
    setStudentDirectoryView(nextView);
    router.replace(
      nextView === "archived"
        ? "/admin?tab=students&studentView=archived"
        : "/admin?tab=students"
    );
  };

  const cardTitle = useMemo(() => {
    if (tab === "home") return "Admin Portal";
    if (tab === "students") return "Student Management";
    if (tab === "register") return "Class Register";
    if (tab === "summer-camp-register") return "Summer Camp Register";
    if (tab === "missed-payments") return "Missed Payments";
    if (tab === "birthday-parties") return "Birthday Parties";
    if (tab === "calendar-events") return "Calendar Events";
    return "Waiting List";
  }, [tab]);
  const isStudentTab = tab === "students";
  const isRegisterTab = tab === "register";
  const isSummerCampRegisterTab = tab === "summer-camp-register";
  const isMissedPaymentsTab = tab === "missed-payments";
  const isBirthdayPartiesTab = tab === "birthday-parties";
  const isCalendarEventsTab = tab === "calendar-events";
  const isFlatContentTab =
    tab === "home" ||
    isStudentTab ||
    isRegisterTab ||
    isSummerCampRegisterTab ||
    isMissedPaymentsTab ||
    isBirthdayPartiesTab ||
    isCalendarEventsTab ||
    tab === "waiting";
  const adminToolItems = navItems.filter((item) => item.key !== "home");

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

  const mobileNavTrigger = (
      <button
        ref={mobileTriggerRef}
        type="button"
        onClick={() => setIsMobileNavOpen(true)}
        className="inline-flex h-11 min-w-[82px] items-center justify-center gap-1.5 rounded-xl border border-black/10 bg-white px-3 text-[#2f2442] shadow-sm transition hover:bg-[#f7f4fb] active:bg-[#f1edf8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6e2ac0]/40 sm:min-w-[92px] sm:gap-2 sm:px-4 xl:hidden"
        aria-label="Open admin navigation"
        aria-expanded={isMobileNavOpen}
      >
        <span className="text-xs font-bold sm:text-sm">Menu</span>
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
  );

  return (
    <div className={`${styles.page} select-text`}>
      {mobileNavSlot ? createPortal(mobileNavTrigger, mobileNavSlot) : null}

      <header className={styles.pageHeader}>
        <div className={styles.accent} aria-hidden="true" />
        <div className={styles.pageTitleRow}>
          <h1 className={styles.pageTitle}>Admin Dashboard</h1>
        </div>
        <p className={styles.subheading}>
          Manage student records, class registers, and waiting lists
        </p>
      </header>

      <div
        className={`${styles.settings} !grid-cols-[minmax(0,1fr)] xl:!grid-cols-[minmax(240px,280px)_minmax(0,1fr)]`}
        style={{ gap: "16px" }}
      >
        <nav
          className={`${styles.settingsNav} hidden border-r border-[#6c35c3]/16 pr-4 xl:block`}
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
                  onClick={() => navigateToTab(item.key)}
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
            {tab !== "home" ? (
              <div className={isFlatContentTab ? "mb-3 border-b border-[#e6e0ee] pb-3" : styles.cardHeader}>
                <div>
                  <h2 className={isFlatContentTab ? "text-base font-semibold text-[#2a203c]" : ""}>
                    {cardTitle}
                  </h2>
                </div>
              </div>
            ) : null}

            {isTabLoading ? (
              <AdminPanelSkeleton />
            ) : (
              <>
            {tab === "home" ? (
              <div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {adminToolItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={`home-${item.key}`}
                        type="button"
                        onClick={() => navigateToTab(item.key)}
                        className="group relative min-h-40 overflow-hidden rounded-xl border border-[#e6e0ee] bg-white p-4 text-left transition hover:border-[#cbb6ea] hover:bg-[#fcfaff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6e2ac0]/35"
                      >
                        <span
                          aria-hidden
                          className="pointer-events-none absolute inset-y-3 left-0 w-[3px] rounded-r-full bg-[#6e2ac0] opacity-0 transition-opacity group-hover:opacity-100"
                        />
                        <span className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[#e2d8f0] bg-[#faf7ff] text-[#6e2ac0]">
                          <Icon className="h-4 w-4" aria-hidden="true" />
                        </span>
                        <span className="block text-sm font-semibold text-[#24193a]">
                          {item.label}
                        </span>
                        {item.description ? (
                          <span className="mt-2 block text-xs leading-5 text-[#6f6384]">
                            {item.description}
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {tab === "students" ? (
              <StudentsPanel
                childrenData={childrenData}
                loadError={childrenLoadError}
                directoryView={studentDirectoryView}
                onChangeDirectoryView={changeStudentDirectoryView}
                onSelectChild={(child) => {
                  router.push(`/admin/students/${encodeURIComponent(child.id)}`);
                }}
              />
            ) : null}

            {tab === "register" ? (
              <RegisterPanel
                referenceNowIso={referenceNowIso}
                registerClasses={registerClasses}
                loadError={registerClassesError}
              />
            ) : null}

            {tab === "summer-camp-register" ? (
              <SummerCampRegisterPanel
                referenceNowIso={referenceNowIso}
                sessions={summerCampRegisterSessions}
                loadError={summerCampRegisterSessionsError}
              />
            ) : null}

            {tab === "waiting" ? (
              <WaitlistPanel
                initialRows={initialWaitlistRows}
                loadError={waitlistLoadError}
              />
            ) : null}

            {tab === "missed-payments" ? (
              <MissedPaymentsPanel
                rows={missedPaymentsRows}
                loadError={missedPaymentsLoadError}
              />
            ) : null}

            {tab === "birthday-parties" ? (
              <BirthdayPartiesPanel
                bookingRows={birthdayPartyBookingsRows}
                calendarSlots={birthdayPartyCalendarSlots}
                bookingsLoadError={birthdayPartyBookingsLoadError}
                availabilityLoadError={birthdayPartyAvailabilityLoadError}
              />
            ) : null}

            {tab === "calendar-events" ? (
              <CalendarEventsPanel
                initialEvents={calendarEventsRows}
                initialHasMore={initialCalendarEventsHasMore}
                initialNextOffset={initialCalendarEventsNextOffset}
                initialFilterOptions={initialCalendarEventsFilterOptions}
                loadError={calendarEventsLoadError}
              />
            ) : null}
              </>
            )}
          </div>
        </section>
      </div>

      {typeof window !== "undefined"
        ? createPortal(
            <AnimatePresence>
              {isMobileNavOpen ? (
                <div className="fixed inset-0 z-[90] xl:hidden" aria-hidden={false}>
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
                              navigateToTab(item.key);
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

    </div>
  );
}
