"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const links = [
  { href: "/about", label: "About" },
  { href: "/team", label: "Team" },
  { href: "/news", label: "Club News" },
  { href: "/timetable", label: "Timetable" },
  { href: "/badge", label: "Badge" },
  { href: "/members", label: "Members" },
  { href: "/contact", label: "Contact" },
];

export default function Nav() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="border-b border-[#6c35c3]/20">
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
                    "relative px-1 py-1 text-[20px] font-semibold tracking-[-0.01em]",
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

      {isOpen ? (
        <div className="border-t border-black/5 bg-[#faf7fb] md:hidden">
          <div className="mx-auto max-w-5xl px-4 py-3">
            <div className="flex flex-col gap-2">
              {links.map((link) => {
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
                      "relative rounded-md px-3 py-3 text-[19px] font-semibold tracking-[-0.01em]",
                      "transition-colors duration-200",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6c35c3] focus-visible:ring-offset-2 focus-visible:ring-offset-[#faf7fb]",
                      isActive
                        ? "text-[#6c35c3] after:absolute after:left-1/2 after:bottom-[-9px] after:h-[2px] after:w-[calc(100%+14px)] after:-translate-x-1/2 after:rounded-full after:bg-[#6c35c3] after:opacity-100"
                        : "text-[#143271]",
                      "hover:text-[#6c35c3]",
                    ].join(" ")}
                    aria-current={isActive ? "page" : undefined}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </nav>
  );
}
