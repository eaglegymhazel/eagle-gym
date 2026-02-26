"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { createPortal } from "react-dom";
import { ClipboardList, Clock3, Users } from "lucide-react";
import styles from "@/app/(portal)/(protected)/account/account.module.css";
import ChildPicker from "@/components/admin/ChildPicker";
import type { Child } from "@/components/admin/mockChildren";
import ClassRegisterPicker from "@/components/admin/ClassRegisterPicker";
import { buildUpcomingSessions, type RegisterClassTemplate } from "@/components/admin/sessionBuild";
import AdminNavItem from "@/components/admin/AdminNavItem";

type AdminTabKey = "students" | "register" | "waiting";

type NavItem = {
  key: AdminTabKey;
  label: string;
  icon: typeof Users;
};

type WaitingRow = {
  childName: string;
  className: string;
  requestedOn: string;
};

const navItems: NavItem[] = [
  { key: "students", label: "Student Management", icon: Users },
  { key: "register", label: "Class Register", icon: ClipboardList },
  { key: "waiting", label: "Waiting List", icon: Clock3 },
];

const waitingList: WaitingRow[] = [
  { childName: "Noah Taylor", className: "Tuesday Recreational", requestedOn: "2026-02-14" },
  { childName: "Sophia Williams", className: "Thursday Tumbling", requestedOn: "2026-02-20" },
  { childName: "Lucas Davis", className: "Saturday Development", requestedOn: "2026-02-22" },
];

export default function AdminShell({
  initialChildrenData,
  initialRegisterClasses,
  initialChildrenLoadError,
  initialRegisterClassesError,
}: {
  initialChildrenData: Child[];
  initialRegisterClasses: RegisterClassTemplate[];
  initialChildrenLoadError: string | null;
  initialRegisterClassesError: string | null;
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
    if (tabParam === "students" || tabParam === "register" || tabParam === "waiting") {
      return tabParam;
    }
    return "students";
  }, [searchParams]);

  const [tab, setTab] = useState<AdminTabKey>(initialTab);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const childrenData = initialChildrenData;
  const childrenLoadError = initialChildrenLoadError;
  const registerClasses = initialRegisterClasses;
  const registerClassesError = initialRegisterClassesError;

  const registerSessions = useMemo(
    () => buildUpcomingSessions(registerClasses, 14),
    [registerClasses]
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
    return "Waiting List";
  }, [tab]);
  const isStudentTab = tab === "students";
  const isRegisterTab = tab === "register";
  const isFlatContentTab = isStudentTab || isRegisterTab;

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
    <div className={styles.page}>
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

            {tab === "waiting" ? (
              <dl className={styles.details}>
                {waitingList.map((row) => (
                  <div key={`${row.childName}-${row.className}`} className={styles.detailRow}>
                    <dt>{row.childName}</dt>
                    <dd>
                      {row.className} | Requested {row.requestedOn}
                    </dd>
                  </div>
                ))}
              </dl>
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
    </div>
  );
}
