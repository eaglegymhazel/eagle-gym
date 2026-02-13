"use client";

import { useEffect, useRef, useState } from "react";

type ChildItem = {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
};

type BookingChildPickerProps = {
  childId: string;
  children: ChildItem[];
  onSelectChild: (childId: string) => void;
};

export default function BookingChildPicker({
  childId,
  children,
  onSelectChild,
}: BookingChildPickerProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;

    const handleClick = (event: MouseEvent) => {
      if (!containerRef.current) return;
      if (containerRef.current.contains(event.target as Node)) return;
      setOpen(false);
    };

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  const activeChild =
    children.find((child) => child.id === childId) ?? children[0];
  const activeName = activeChild
    ? `${activeChild.firstName ?? ""} ${activeChild.lastName ?? ""}`.trim()
    : "selected child";
  const otherChildren = children.filter((child) => child.id !== childId);
  const hasOtherChildren = otherChildren.length > 0;

  return (
    <div className="relative inline-block" ref={containerRef}>
      <button
        type="button"
        onClick={() => hasOtherChildren && setOpen((prev) => !prev)}
        disabled={!hasOtherChildren}
        className={`inline-flex items-center rounded-full border border-[#6c35c3]/25 bg-white/85 px-4 py-1.5 text-sm font-semibold uppercase tracking-[0.18em] text-[#2a203c]/70 shadow-[0_12px_28px_-18px_rgba(31,26,37,0.5)] backdrop-blur ${
          hasOtherChildren ? "cursor-pointer" : "cursor-default"
        }`}
      >
        Booking for{" "}
        <span className="ml-1 font-bold text-[#2a203c]">
          {activeName || "selected child"}
        </span>
        {hasOtherChildren && (
          <span className="ml-2 text-[#2a203c]/60" aria-hidden="true">
            ▾
          </span>
        )}
      </button>

      {open && hasOtherChildren && (
        <div className="absolute left-0 top-full z-30 mt-2 w-full min-w-full rounded-[24px] border border-[#e7def3] bg-white/95 p-2 text-left text-sm shadow-[0_16px_32px_rgba(24,12,40,0.24),_0_6px_12px_rgba(24,12,40,0.18)] backdrop-blur animate-[dropdown-enter_180ms_ease-out]">
          {otherChildren.length === 0 ? (
            <div className="px-3 py-2 text-sm font-semibold text-[#6c35c3]/70">
              No other children
            </div>
          ) : (
            otherChildren.map((child) => {
            const name = `${child.firstName ?? ""} ${child.lastName ?? ""}`.trim();
            return (
              <button
                key={child.id}
                type="button"
                onClick={() => {
                  setOpen(false);
                  onSelectChild(child.id);
                }}
                className="group flex w-full items-center rounded-xl px-3 py-1.5 text-left text-sm font-semibold text-[#2a203c] transition hover:bg-[#faf7ff]"
              >
                <span className="mr-3 h-5 w-[3px] rounded-full bg-[#6c35c3] opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
                {name || "Unnamed child"}
              </button>
            );
          })
          )}
        </div>
      )}
      <style jsx>{`
        @keyframes dropdown-enter {
          0% {
            opacity: 0;
            transform: translateY(-4px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
