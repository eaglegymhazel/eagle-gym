"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "./auth/AuthProvider";

export default function LoginBadge() {
  const { user, loading, isAdmin } = useAuth();
  const [open, setOpen] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();

  const isLoggedIn = !!user?.email;
  const href = isLoggedIn ? "/account" : "/login";
  const label = isLoggedIn ? user?.email ?? "Account" : "Login";

  const menuItemClass =
    "relative flex min-h-[40px] items-center gap-3 overflow-hidden px-4 py-2.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6c35c3]/35 before:absolute before:inset-0 before:bg-[#6c35c3]/8 before:origin-left before:scale-x-0 before:transition-transform before:duration-200 after:absolute after:left-0 after:top-2 after:bottom-2 after:w-[3px] after:rounded-full after:bg-[#6e2ac0] after:opacity-0 after:transition-opacity after:duration-200 hover:before:scale-x-100 hover:after:opacity-100 focus-visible:before:scale-x-100 focus-visible:after:opacity-100 [&>*]:relative [&>*]:z-10";

  const clearCloseTimer = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  const scheduleClose = () => {
    clearCloseTimer();
    closeTimerRef.current = setTimeout(() => setOpen(false), 200);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape") {
      setOpen(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  if (!isLoggedIn) {
    return (
      <Link
        href={href}
        className="inline-flex items-center gap-2 whitespace-nowrap text-[#312643] underline-offset-4 hover:underline"
        aria-label="Go to login"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="11" width="18" height="11" rx="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
        <span>{loading ? "Login" : label}</span>
      </Link>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative inline-block"
      onMouseEnter={() => {
        clearCloseTimer();
        setOpen(true);
      }}
      onMouseLeave={scheduleClose}
      onFocus={() => {
        clearCloseTimer();
        setOpen(true);
      }}
      onBlur={scheduleClose}
      onKeyDown={handleKeyDown}
    >
      <button
        type="button"
        className="group inline-flex h-12 w-[126px] items-center gap-2 rounded-full border border-[#d8cbea] bg-white/95 px-2 pr-2.5 text-[#2f2442] shadow-[0_8px_22px_-16px_rgba(46,24,78,0.6)] transition duration-200 hover:-translate-y-px hover:border-[#c5b2df] hover:bg-white hover:shadow-[0_12px_26px_-16px_rgba(46,24,78,0.55)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6c35c3]/35 sm:w-[180px] sm:gap-2.5 sm:px-2.5 sm:pr-3 xl:w-[190px]"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#f0e8fb] text-[#6630b5] transition group-hover:bg-[#e9dcf9] sm:h-8 sm:w-8">
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="h-3.5 w-3.5 sm:h-4 sm:w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </span>
        <span className="min-w-0 flex-1 text-left">
          <span className="block text-[12px] font-bold leading-[15px] text-[#2a0c4f]">
            My account
          </span>
          <span className="block truncate text-[10px] font-medium leading-[14px] text-[#77698b]">
            {loading ? "Loading..." : label}
          </span>
        </span>
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className={[
            "h-3.5 w-3.5 shrink-0 text-[#7a6a91] transition-transform duration-150 group-hover:text-[#5e3c87]",
            open ? "rotate-180" : "rotate-0",
          ].join(" ")}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      <div
        className={[
          "absolute right-0 top-full mt-2 min-w-[220px] origin-top-right pt-2 transition-all duration-150 ease-out",
          open
            ? "opacity-100 translate-y-0 scale-100"
            : "pointer-events-none opacity-0 -translate-y-1 scale-95",
        ].join(" ")}
        role="menu"
      >
        <div className="relative overflow-hidden rounded-2xl border border-[#ddd3eb] bg-white shadow-[0_16px_34px_-20px_rgba(31,20,50,0.45)]">
          {open ? (
            <Image
              src="/brand/ringdeco.png"
              alt=""
              width={128}
              height={128}
              aria-hidden="true"
              className="pointer-events-none absolute -top-[14px] -right-[30px] h-16 w-auto opacity-85"
            />
          ) : null}
          <div className="px-4 pt-3 pb-2 text-xs text-[#7a6b93]">
            <div>Signed in as</div>
            <div className="truncate text-sm font-semibold text-[#241b35]">
              {label}
            </div>
          </div>
          <ul className="flex flex-col">
            <li>
              <Link
                href="/account"
                className={`${menuItemClass} text-[#302545]`}
                role="menuitem"
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="h-4 w-4 text-[#77658f]"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <span>Account</span>
              </Link>
            </li>
            {isAdmin ? (
              <>
                <li>
                  <Link
                    href="/admin"
                    className={`${menuItemClass} text-[#302545]`}
                    role="menuitem"
                  >
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 24 24"
                      className="h-4 w-4 text-[#77658f]"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M12 3l7 3v6c0 5-3.5 8-7 9-3.5-1-7-4-7-9V6l7-3z" />
                      <path d="M9.5 12.5l1.7 1.7 3.3-3.3" />
                    </svg>
                    <span>Admin Portal</span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/studio"
                    className={`${menuItemClass} text-[#302545]`}
                    role="menuitem"
                  >
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 24 24"
                      className="h-4 w-4 text-[#77658f]"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4h13A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5z" />
                      <path d="M8 8.5h8" />
                      <path d="M8 12h8" />
                      <path d="M8 15.5h5" />
                    </svg>
                    <span>Studio</span>
                  </Link>
                </li>
              </>
            ) : null}
            <li className="my-2 border-t border-[#eee7f6]" />
            <li>
              <button
                type="button"
                onClick={async () => {
                  if (logoutLoading) return;
                  setLogoutLoading(true);
                  try {
                    await supabase.auth.signOut();
                    setOpen(false);
                    router.replace("/login");
                  } finally {
                    setLogoutLoading(false);
                  }
                }}
                className={`${menuItemClass} w-full text-left text-[#c5315a] before:bg-[#c5315a]/10 after:bg-[#c5315a] disabled:cursor-not-allowed disabled:opacity-60`}
                role="menuitem"
                disabled={logoutLoading}
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="h-4 w-4 text-[#c5315a]"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <path d="M16 17l5-5-5-5" />
                  <path d="M21 12H9" />
                </svg>
                <span>Log out</span>
              </button>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
