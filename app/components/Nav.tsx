"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { BookOpen, CalendarDays, ChevronDown, IdCard, Info, Mail, type LucideIcon } from "lucide-react";
import { useAuth } from "./auth/AuthProvider";

type NavItem = {
  key: string;
  href: string;
  label: string;
  icon: LucideIcon;
  type: "link" | "about";
  matchPrefix?: string;
};

const aboutItems = [
  { href: "/about", label: "About the Club" },
  { href: "/team", label: "Coaches" },
  { href: "/news", label: "News" },
] as const satisfies ReadonlyArray<{
  href: string;
  label: string;
}>;

const navItems: NavItem[] = [
  { key: "classes", href: "/timetable", label: "Classes", icon: CalendarDays, type: "link" as const },
  { key: "book", href: "/book", label: "Book", icon: BookOpen, type: "link" as const, matchPrefix: "/book" },
  { key: "members", href: "/members", label: "Members", icon: IdCard, type: "link" as const },
  { key: "about", href: "/about", label: "About", icon: Info, type: "about" as const },
  { key: "contact", href: "/contact", label: "Contact", icon: Mail, type: "link" as const },
];

type MobileRightLink = {
  href: string;
  label: string;
};

export default function Nav({
  disableMobileMenu = false,
  mobileRightLink,
}: {
  disableMobileMenu?: boolean;
  mobileRightLink?: MobileRightLink;
}) {
  const { user } = useAuth();
  const pathname = usePathname();
  const isRecreationalBooking = pathname?.startsWith("/book/recreational");
  const isLoggedIn = Boolean(user?.email);
  const resolvedNavItems = useMemo(
    () =>
      navItems.map((item) =>
        item.key === "book"
          ? { ...item, href: isLoggedIn ? "/book" : "/login", matchPrefix: "/book" }
          : { ...item, matchPrefix: item.matchPrefix ?? item.href }
      ),
    [isLoggedIn]
  );
  const isAboutActive = useMemo(
    () => aboutItems.some((item) => pathname?.startsWith(item.href)),
    [pathname]
  );
  const [isOpen, setIsOpen] = useState(false);
  const [isMobileAboutOpen, setIsMobileAboutOpen] = useState(false);
  const navRef = useRef<HTMLElement | null>(null);
  const drawerRef = useRef<HTMLElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const reduceMotion = useReducedMotion();
  const closeMobileMenu = () => {
    setIsOpen(false);
    setIsMobileAboutOpen(false);
  };

  useEffect(() => {
    if (!isOpen) return;
    const triggerToRestore = triggerRef.current;
    restoreFocusRef.current = document.activeElement as HTMLElement | null;
    const drawer = drawerRef.current;
    const getFocusable = () =>
      drawer
        ? Array.from(
            drawer.querySelectorAll<HTMLElement>(
              'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
            )
          )
        : [];

    const focusables = getFocusable();
    (focusables[0] ?? closeRef.current)?.focus();

    const handlePointerDownOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      const clickedInsideNav = !!navRef.current?.contains(target);
      const clickedInsideDrawer = !!drawerRef.current?.contains(target);
      if (!clickedInsideNav && !clickedInsideDrawer) {
        closeMobileMenu();
      }
    };

    const handleWindowScroll = () => {
      closeMobileMenu();
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeMobileMenu();
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

    document.addEventListener("mousedown", handlePointerDownOutside);
    document.addEventListener("touchstart", handlePointerDownOutside, {
      passive: true,
    });
    window.addEventListener("scroll", handleWindowScroll, { passive: true });
    document.addEventListener("keydown", handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("mousedown", handlePointerDownOutside);
      document.removeEventListener("touchstart", handlePointerDownOutside);
      window.removeEventListener("scroll", handleWindowScroll);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      const focusTarget = triggerToRestore ?? restoreFocusRef.current;
      focusTarget?.focus();
    };
  }, [isOpen]);

  return (
    <nav ref={navRef} className="relative">
      <div className="mx-auto flex h-[50px] max-w-5xl items-center justify-center px-4 md:h-[58px] md:px-6">
        <div
          className={`flex w-full items-center justify-center ${
            isRecreationalBooking ? "text-[#143271]/85" : "text-[#143271]"
          }`}
          style={{
            fontFamily:
              '"Baloo 2", "Comic Sans MS", "Comic Neue", cursive, sans-serif',
          }}
        >
          <div
            className="hidden items-center justify-center lg:flex"
            style={{ columnGap: "clamp(16px, 2vw, 32px)" }}
          >
            {resolvedNavItems.map((item) => {
              const isActive =
                item.type === "about"
                  ? isAboutActive
                  : item.matchPrefix === "/"
                    ? pathname === "/"
                    : pathname?.startsWith(item.matchPrefix ?? item.href);

              if (item.type === "about") {
                return (
                  <div key={item.key} className="group relative">
                    <button
                      type="button"
                      className={[
                        "relative inline-flex cursor-pointer items-center gap-1 whitespace-nowrap px-1 py-1 uppercase tracking-[0.06em]",
                        isRecreationalBooking
                          ? "text-[15px] font-medium"
                          : "text-[16px] font-semibold",
                        "transition-colors duration-200",
                        "after:absolute after:left-1/2 after:bottom-[-9px] after:h-[2px] after:w-0 after:-translate-x-1/2 after:rounded-full after:bg-[#6c35c3] after:opacity-0 after:transition-[width,opacity] after:duration-200",
                        "hover:text-[#6c35c3] hover:after:w-[calc(100%+14px)] hover:after:opacity-100",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6c35c3] focus-visible:ring-offset-2 focus-visible:ring-offset-[#faf7fb]",
                        isActive
                          ? "text-[#6c35c3] after:w-[calc(100%+14px)] after:opacity-100"
                          : "text-[#143271]",
                      ].join(" ")}
                      aria-haspopup="menu"
                      aria-expanded={isActive}
                    >
                      {item.label}
                      <ChevronDown className="h-4 w-4" aria-hidden="true" />
                    </button>
                    <div className="pointer-events-none absolute left-1/2 top-full z-50 min-w-[240px] -translate-x-1/2 pt-3 opacity-0 transition duration-150 group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100">
                      <div className="overflow-hidden rounded-xl bg-white shadow-[0_26px_42px_-28px_rgba(31,20,50,0.6)]">
                        <div className="p-1.5">
                        {aboutItems.map((aboutItem) => {
                          const isAboutItemActive = pathname?.startsWith(aboutItem.href);
                          return (
                            <Link
                              key={aboutItem.href}
                              href={aboutItem.href}
                              className={[
                                "block rounded-lg px-3 py-2.5 text-sm font-semibold transition",
                                isAboutItemActive
                                  ? "bg-[#efe6ff] text-[#5b2ca7]"
                                  : "text-[#143271] hover:bg-[#f7f2ff] hover:text-[#5b2ca7]",
                              ].join(" ")}
                            >
                              {aboutItem.label}
                            </Link>
                          );
                        })}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <Link
                  key={item.key}
                  href={item.href}
                  className={[
                    "relative whitespace-nowrap px-1 py-1 uppercase tracking-[0.06em]",
                    isRecreationalBooking
                      ? "text-[15px] font-medium"
                      : "text-[16px] font-semibold",
                    "transition-colors duration-200",
                    "after:absolute after:left-1/2 after:bottom-[-9px] after:h-[2px] after:w-0 after:-translate-x-1/2 after:rounded-full after:bg-[#6c35c3] after:opacity-0 after:transition-[width,opacity] after:duration-200",
                    "hover:text-[#6c35c3] hover:after:w-[calc(100%+14px)] hover:after:opacity-100",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6c35c3] focus-visible:ring-offset-2 focus-visible:ring-offset-[#faf7fb]",
                    isActive
                      ? "text-[#6c35c3] after:w-[calc(100%+14px)] after:opacity-100"
                      : "text-[#143271]",
                  ].join(" ")}
                  aria-current={isActive ? "page" : undefined}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>

        {disableMobileMenu ? (
          mobileRightLink ? (
            <Link
              href={mobileRightLink.href}
              className="absolute right-4 inline-flex h-9 items-center rounded-md border border-[#d9cdef] bg-white px-3 text-[11px] font-semibold uppercase tracking-[0.04em] text-[#4d2d79] transition hover:bg-[#f8f3ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6c35c3]/40 lg:hidden"
            >
              {mobileRightLink.label}
            </Link>
          ) : null
        ) : (
          <button
            ref={triggerRef}
            type="button"
            aria-label="Toggle navigation"
            aria-expanded={isOpen}
            onClick={() => {
              setIsMobileAboutOpen(false);
              setIsOpen((prev) => !prev);
            }}
            className="absolute right-4 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-black/10 bg-white text-[#2f2442] shadow-sm transition hover:bg-[#f7f4fb] active:bg-[#f1edf8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6c35c3]/40 lg:hidden"
          >
            <span className="sr-only">Menu</span>
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5"
              aria-hidden="true"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              {isOpen ? (
                <>
                  <path d="M6 6l12 12" />
                  <path d="M18 6l-12 12" />
                </>
              ) : (
                <>
                  <path d="M4 7h16" />
                  <path d="M4 12h16" />
                  <path d="M4 17h16" />
                </>
              )}
            </svg>
          </button>
        )}
      </div>

      {!disableMobileMenu && typeof window !== "undefined"
        ? createPortal(
            <AnimatePresence>
              {isOpen ? (
                <div className="fixed inset-0 z-[90] lg:hidden" aria-hidden={false}>
                  <motion.button
                    type="button"
                    onClick={closeMobileMenu}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: reduceMotion ? 0.1 : 0.2 }}
                    className="absolute inset-0 bg-black/45"
                    aria-label="Close navigation menu"
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
                    aria-label="Navigation menu"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-base font-semibold text-[#1f1a25]">Navigation</p>
                      <button
                        ref={closeRef}
                        type="button"
                        onClick={closeMobileMenu}
                        className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-black/[0.08] text-black/75 transition hover:bg-black/[0.08] active:bg-black/[0.12] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6e2ac0]/40"
                        aria-label="Close navigation menu"
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
                      {resolvedNavItems.map((item) => {
                        const isActive =
                          item.type === "about"
                            ? isAboutActive
                            : item.matchPrefix === "/"
                              ? pathname === "/"
                              : pathname?.startsWith(item.matchPrefix);
                        const Icon = item.icon;

                        if (item.type === "about") {
                          return (
                            <div key={item.key} className="overflow-hidden rounded-[13px] bg-white">
                              <button
                                type="button"
                                onClick={() => setIsMobileAboutOpen((prev) => !prev)}
                                className={[
                                  "group relative flex min-h-12 w-full items-center justify-between gap-3 rounded-[13px] px-3.5 py-2.5 text-[15px] transition-colors duration-200",
                                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6e2ac0] focus-visible:ring-offset-2",
                                  isAboutActive
                                    ? "bg-[rgba(110,42,192,0.08)] font-semibold text-[#6e2ac0]"
                                    : "font-medium text-black/80 hover:bg-black/[0.04] active:bg-black/[0.08]",
                                ].join(" ")}
                                aria-expanded={isMobileAboutOpen}
                                aria-controls="mobile-about-submenu"
                              >
                                <span className="flex items-center gap-3">
                                  <span
                                    aria-hidden
                                    className={[
                                      "absolute left-1 top-1 bottom-1 w-1 rounded-full transition-opacity",
                                      isAboutActive ? "bg-[#6e2ac0] opacity-100" : "bg-[#6e2ac0] opacity-0",
                                    ].join(" ")}
                                  />
                                  <Icon
                                    className={[
                                      "h-5 w-5 shrink-0 transition-colors duration-200",
                                      isAboutActive ? "text-[#6e2ac0]" : "text-black/65",
                                    ].join(" ")}
                                    aria-hidden="true"
                                  />
                                  {item.label}
                                </span>
                                <ChevronDown
                                  className={[
                                    "h-4 w-4 transition-transform duration-200",
                                    isMobileAboutOpen ? "rotate-180" : "rotate-0",
                                  ].join(" ")}
                                  aria-hidden="true"
                                />
                              </button>

                              {isMobileAboutOpen ? (
                                <div
                                  id="mobile-about-submenu"
                                  className="mb-1 mt-0.5 bg-[#fbf9ff] px-2 py-2"
                                >
                                  {aboutItems.map((aboutItem) => {
                                    const isAboutItemActive = pathname?.startsWith(aboutItem.href);
                                    return (
                                      <Link
                                        key={aboutItem.href}
                                        href={aboutItem.href}
                                        onClick={closeMobileMenu}
                                        className={[
                                          "block rounded-lg px-3 py-2.5 text-sm font-semibold transition",
                                          isAboutItemActive
                                            ? "bg-[#efe6ff] text-[#5b2ca7]"
                                            : "text-[#143271] hover:bg-[#f3edff] hover:text-[#5b2ca7]",
                                        ].join(" ")}
                                        aria-current={isAboutItemActive ? "page" : undefined}
                                      >
                                        {aboutItem.label}
                                      </Link>
                                    );
                                  })}
                                </div>
                              ) : null}
                            </div>
                          );
                        }

                        return (
                          <Link
                            key={item.key}
                            href={item.href}
                            onClick={closeMobileMenu}
                            className={[
                              "group relative flex min-h-12 items-center gap-3 rounded-[13px] px-3.5 py-2.5 text-[15px] transition-colors duration-200",
                              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6e2ac0] focus-visible:ring-offset-2",
                              isActive
                                ? "bg-[rgba(110,42,192,0.08)] font-semibold text-[#6e2ac0]"
                                : "font-medium text-black/80 hover:bg-black/[0.04] active:bg-black/[0.08]",
                            ].join(" ")}
                            aria-current={isActive ? "page" : undefined}
                          >
                            <span
                              aria-hidden
                              className={[
                                "absolute left-1 top-1 bottom-1 w-1 rounded-full transition-opacity",
                                isActive ? "bg-[#6e2ac0] opacity-100" : "bg-[#6e2ac0] opacity-0",
                              ].join(" ")}
                            />
                            <Icon
                              className={[
                                "h-5 w-5 shrink-0 transition-colors duration-200",
                                isActive ? "text-[#6e2ac0]" : "text-black/65",
                              ].join(" ")}
                              aria-hidden="true"
                            />
                            {item.label}
                          </Link>
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
    </nav>
  );
}
