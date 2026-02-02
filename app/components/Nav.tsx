"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/about", label: "About" },
  { href: "/team", label: "Team" },
  { href: "/news", label: "Competition News" },
  { href: "/timetable", label: "Timetable" },
  { href: "/Badge", label: "Badge" },
  { href: "/contact", label: "Contact" },
];

export default function Nav() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-black/5">
      <div className="mx-auto max-w-5xl px-6 py-4">
        <div
          className="flex flex-wrap items-center justify-center gap-x-3 gap-y-3 text-[#7436e6]"
          style={{
            fontFamily:
              '"Baloo 2", "Comic Sans MS", "Comic Neue", cursive, sans-serif',
          }}
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
                  "relative z-0 px-3 py-2 text-xl font-bold tracking-wide sm:text-2xl",
                  "transition-all duration-300",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7436e6] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f7f2ff]",
                  "hover:-translate-y-1 hover:scale-110 hover:text-[#de59b6]",
                  isActive ? "text-[#5a22cf]" : "text-[#7436e6]",
                ].join(" ")}
                aria-current={isActive ? "page" : undefined}
              >
                <span className="relative z-10">{link.label}</span>
                {isActive ? (
                  <span className="pointer-events-none absolute inset-x-0 -bottom-1 z-0 h-5">
                    <svg
                      viewBox="0 0 120 18"
                      className="h-full w-full"
                      preserveAspectRatio="none"
                      aria-hidden="true"
                    >
                      <path
                        d="M2 10 C6 6, 12 14, 18 10 S30 6, 36 10 48 14, 54 10 66 6, 72 10 84 14, 90 10 102 6, 118 12"
                        stroke="#de59b6"
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill="none"
                        opacity="0.85"
                      />
                      <path
                        d="M2 13 C7 8, 13 16, 19 12 S31 8, 37 12 49 16, 55 12 67 8, 73 12 85 16, 91 12 103 8, 118 14"
                        stroke="#de59b6"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill="none"
                        opacity="0.55"
                      />
                      <path
                        d="M4 15 C10 12, 14 18, 20 14 S34 12, 40 14 52 18, 58 14 70 12, 76 14 88 18, 94 14 106 12, 118 16"
                        stroke="#de59b6"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill="none"
                        opacity="0.35"
                      />
                    </svg>
                  </span>
                ) : null}
              </Link>
            );
          })}

        </div>
      </div>
    </nav>
  );
}
