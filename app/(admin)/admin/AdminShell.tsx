"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { createPortal } from "react-dom";
import * as Dialog from "@radix-ui/react-dialog";
import { ClipboardList, Clock3, Users } from "lucide-react";
import styles from "@/app/(portal)/(protected)/account/account.module.css";
import ChildPicker from "@/components/admin/ChildPicker";
import type { Child } from "@/components/admin/mockChildren";
import ClassRegisterPicker from "@/components/admin/ClassRegisterPicker";
import { buildUpcomingSessions, type RegisterClassTemplate } from "@/components/admin/sessionBuild";
import AdminNavItem from "@/components/admin/AdminNavItem";
import type { AdminWaitlistRow } from "@/lib/server/adminDashboard";

type AdminTabKey = "students" | "register" | "waiting";

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

const navItems: NavItem[] = [
  { key: "students", label: "Student Management", icon: Users },
  { key: "register", label: "Class Register", icon: ClipboardList },
  { key: "waiting", label: "Waiting List", icon: Clock3 },
];

export default function AdminShell({
  initialChildrenData,
  initialRegisterClasses,
  initialWaitlistRows,
  initialChildrenLoadError,
  initialRegisterClassesError,
  initialWaitlistLoadError,
}: {
  initialChildrenData: Child[];
  initialRegisterClasses: RegisterClassTemplate[];
  initialWaitlistRows: AdminWaitlistRow[];
  initialChildrenLoadError: string | null;
  initialRegisterClassesError: string | null;
  initialWaitlistLoadError: string | null;
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
  const [waitlistRowsState, setWaitlistRowsState] = useState<WaitingRow[]>(initialWaitlistRows);
  const [waitlistQuery, setWaitlistQuery] = useState("");
  const [waitlistClassFilter, setWaitlistClassFilter] = useState("all");
  const [waitlistSort, setWaitlistSort] = useState<"oldest" | "newest">("oldest");
  const [waitlistActionError, setWaitlistActionError] = useState<string | null>(null);
  const [waitlistActionMessage, setWaitlistActionMessage] = useState<string | null>(null);
  const [waitlistRemovingKey, setWaitlistRemovingKey] = useState<string | null>(null);
  const [waitlistDeleteCandidate, setWaitlistDeleteCandidate] = useState<WaitingRow | null>(null);
  const childrenData = initialChildrenData;
  const childrenLoadError = initialChildrenLoadError;
  const registerClasses = initialRegisterClasses;
  const registerClassesError = initialRegisterClassesError;
  const waitlistLoadError = initialWaitlistLoadError;

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
  const isFlatContentTab = isStudentTab || isRegisterTab || tab === "waiting";

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
