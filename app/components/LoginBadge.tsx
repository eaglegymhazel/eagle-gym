"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "./auth/AuthProvider";

export default function LoginBadge() {
  const { user, loading } = useAuth();
  const [open, setOpen] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();

  const isLoggedIn = !!user?.email;
  const href = isLoggedIn ? "/account" : "/login";
  const label = isLoggedIn ? user?.email ?? "Account" : "Login";
  const truncatedLabel = useMemo(() => {
    if (!label) return "Account";
    const [prefix, domain] = label.split("@");
    if (!domain) return label;
    return `${prefix}@${domain}`;
  }, [label]);

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
        className="inline-flex h-9 max-w-[220px] items-center gap-2 rounded-full border border-[#d4c7e6] bg-white px-3 text-sm font-semibold text-[#2f2442] shadow-[0_6px_14px_-12px_rgba(33,24,50,0.45)] transition hover:border-[#c6b7dd] hover:bg-[#faf8fd] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6c35c3]/35"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className="flex-1 truncate text-left">
          {loading ? "Account" : truncatedLabel}
        </span>
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className={[
            "h-4 w-4 text-[#6a5a86] transition-transform duration-150",
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
              {truncatedLabel}
            </div>
          </div>
          <ul className="flex flex-col">
            <li>
              <Link
                href="/account"
                className="flex min-h-[40px] items-center gap-3 px-4 py-2.5 text-sm font-medium text-[#302545] hover:bg-[#f7f3fc] focus-visible:outline-none focus-visible:bg-[#f7f3fc] focus-visible:ring-2 focus-visible:ring-[#6c35c3]/35"
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
                className="flex min-h-[40px] w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-medium text-[#c5315a] hover:bg-[#fff2f6] focus-visible:outline-none focus-visible:bg-[#fff2f6] focus-visible:ring-2 focus-visible:ring-[#6c35c3]/35 disabled:cursor-not-allowed disabled:opacity-60"
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
