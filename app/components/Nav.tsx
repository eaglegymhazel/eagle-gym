"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const links = [
  { href: "/about", label: "About" },
  { href: "/team", label: "Team" },
  { href: "/news", label: "Club News" },
  { href: "/timetable", label: "Timetable" },
  { href: "/badge", label: "Badge" },
  { href: "/members", label: "Members" },
  { href: "/contact", label: "Contact" },
];
const mobileLinks = [{ href: "/", label: "Home" }, ...links];

export default function Nav() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const navRef = useRef<HTMLElement | null>(null);
  const drawerRef = useRef<HTMLElement | null>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDownOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      const clickedInsideNav = !!navRef.current?.contains(target);
      const clickedInsideDrawer = !!drawerRef.current?.contains(target);
      if (!clickedInsideNav && !clickedInsideDrawer) {
        setIsOpen(false);
      }
    };

    const handleWindowScroll = () => {
      setIsOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDownOutside);
    document.addEventListener("touchstart", handlePointerDownOutside, {
      passive: true,
    });
    window.addEventListener("scroll", handleWindowScroll, { passive: true });

    return () => {
      document.removeEventListener("mousedown", handlePointerDownOutside);
      document.removeEventListener("touchstart", handlePointerDownOutside);
      window.removeEventListener("scroll", handleWindowScroll);
    };
  }, [isOpen]);

  return (
    <nav ref={navRef} className="relative border-b border-[#6c35c3]/20">
      <div className="mx-auto flex h-[50px] max-w-5xl items-center justify-center px-4 md:h-[58px] md:px-6">
        <div
          className="flex w-full items-center justify-center text-[#143271]"
          style={{
            fontFamily:
              '"Baloo 2", "Comic Sans MS", "Comic Neue", cursive, sans-serif',
          }}
        >
          <div
            className="hidden items-center justify-center md:flex -translate-y-[5px]"
            style={{ columnGap: "clamp(16px, 2vw, 32px)" }}
          >
            {links.map((link) => {
              const isActive =
                link.href === "/"
                  ? pathname === "/"
                  : pathname?.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={[
                    "relative px-1 py-1 text-[16px] font-semibold uppercase tracking-[0.06em]",
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
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>

        <button
          type="button"
          aria-label="Toggle navigation"
          aria-expanded={isOpen}
          onClick={() => setIsOpen((prev) => !prev)}
          className="absolute right-4 inline-flex h-11 w-11 items-center justify-center rounded-full text-[#143271] transition-colors duration-200 hover:text-[#6c35c3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6c35c3] focus-visible:ring-offset-2 focus-visible:ring-offset-[#faf7fb] md:hidden"
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
      </div>

      {typeof window !== "undefined"
        ? createPortal(
            <AnimatePresence>
              {isOpen ? (
                <div className="fixed inset-0 z-[90] md:hidden" aria-hidden={false}>
                  <motion.button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: reduceMotion ? 0.1 : 0.18 }}
                    className="absolute inset-0 bg-[#120a22]/40 backdrop-blur-[1px]"
                    aria-label="Close navigation menu"
                  />

                  <motion.aside
                    ref={drawerRef}
                    initial={reduceMotion ? { opacity: 0 } : { x: "100%" }}
                    animate={reduceMotion ? { opacity: 1 } : { x: 0 }}
                    exit={reduceMotion ? { opacity: 0 } : { x: "100%" }}
                    transition={{
                      duration: reduceMotion ? 0.12 : 0.24,
                      ease: "easeOut",
                    }}
                    className="absolute top-0 right-0 flex h-full w-[82vw] max-w-[340px] flex-col bg-[#6c35c3] px-6 pb-7 pt-6 shadow-[-24px_0_42px_-24px_rgba(15,10,30,0.55)]"
                    role="dialog"
                    aria-modal="true"
                    aria-label="Navigation menu"
                  >
                    <div className="mb-5 flex justify-end">
                      <button
                        type="button"
                        onClick={() => setIsOpen(false)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/25 text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
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

                    <div className="flex flex-col gap-1">
                      {mobileLinks.map((link) => {
                        const isActive =
                          link.href === "/"
                            ? pathname === "/"
                            : pathname?.startsWith(link.href);
                        return (
                          <Link
                            key={link.href}
                            href={link.href}
                            onClick={() => setIsOpen(false)}
                            className={[
                              "rounded-lg px-3 py-3 text-lg font-semibold tracking-[0.06em] uppercase transition",
                              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80",
                              isActive
                                ? "bg-white/15 text-white"
                                : "text-white/95 hover:bg-white/10",
                            ].join(" ")}
                            aria-current={isActive ? "page" : undefined}
                          >
                            {link.label}
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
