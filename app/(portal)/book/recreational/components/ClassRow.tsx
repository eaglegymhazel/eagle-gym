import type { ClassCardItem } from "../types";
import { getAvailabilityState } from "../utils";
import { Check, Clock, Plus, XCircle } from "lucide-react";

type ClassRowProps = {
  item: ClassCardItem;
  selected: boolean;
  onToggle: (item: ClassCardItem) => void;
};

export default function ClassRow({ item, selected, onToggle }: ClassRowProps) {
  const blocked = item.isFull && !selected;
  const availability = getAvailabilityState(item.spotsLeft);
  const checkboxId = `class-toggle-${item.id}`;
  const sessionInfo = getSessionInfo(item.name);
  const startTimeLabel = formatStartTime(item.startTime);
  const isGenericTitle = sessionInfo.title === "Recreational Gymnastics";

  const toggleSelection = () => {
    if (blocked) return;
    onToggle(item);
  };
  const handleSelectControlClick = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    event.preventDefault();
    event.stopPropagation();
    toggleSelection();
  };

  const availabilityId = `availability-${item.id}`;
  const availabilityLineClass =
    availability.variant === "full"
      ? "bg-[#f2f1f5] text-[#555360]"
      : availability.variant === "low"
      ? "bg-[#ffe4d7] text-[#8a2f10] ring-1 ring-[#f2c4ad]"
      : availability.variant === "ok"
      ? "bg-[#e8f6eb] text-[#1f5b2b]"
      : "bg-[#f3f1f8] text-[#4c3e66]";

  return (
    <div
      role="button"
      tabIndex={blocked ? -1 : 0}
      aria-disabled={blocked}
      aria-pressed={selected}
      onClick={toggleSelection}
      onKeyDown={(event) => {
        if (blocked) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onToggle(item);
        }
      }}
      className={`group relative grid grid-cols-[auto_1fr_auto] items-center gap-4 rounded-2xl border px-2.5 py-2.5 shadow-[0_3px_10px_-9px_rgba(28,20,45,0.18)] transition-colors transition-shadow duration-200 ease-out motion-reduce:transition-none active:scale-[0.99] motion-reduce:active:scale-100 sm:px-3 ${
        blocked
          ? "cursor-not-allowed border-[#e8e4ee] bg-[#f5f4f8] opacity-92"
          : selected
          ? "cursor-pointer border-[#d7cedf] bg-[#f9f7fc] shadow-[0_6px_14px_-11px_rgba(45,25,86,0.2)] ring-1 ring-[#e2d9eb]"
          : "cursor-pointer border-[#e5e1ea] bg-[#ffffff] hover:border-[#d7cedf] hover:bg-[#faf9fc] hover:shadow-[0_7px_16px_-12px_rgba(38,24,66,0.2)] focus-visible:ring-2 focus-visible:ring-[#6c35c3]/30"
      }`}
    >
      <span
        className={`absolute inset-y-1.5 left-0 w-1.5 rounded-r-full transition-colors duration-180 motion-reduce:transition-none ${
          selected ? "bg-[#7a6a93]" : "bg-transparent group-hover:bg-[#cfc2e2]"
        }`}
        aria-hidden="true"
      />

      <input
        id={checkboxId}
        type="checkbox"
        checked={selected}
        disabled={blocked}
        onChange={toggleSelection}
        aria-label={selected ? `Deselect ${sessionInfo.title}` : `Select ${sessionInfo.title}`}
        aria-describedby={availabilityId}
        className="sr-only"
      />

      <div
        className={`relative w-28 shrink-0 rounded-xl border px-2.5 py-2 tabular-nums transition-colors duration-200 ease-out motion-reduce:transition-none ${
          selected
            ? "border-[#cfbbe9] bg-[#efe8fb]"
            : blocked
            ? "border-[#ece8f2] bg-[#f6f4f9]"
            : "border-[#e7e0ee] bg-[#f7f4fb] group-hover:border-[#d8cfdf] group-hover:bg-[#f2eef8]"
        }`}
      >
        <span
          className="absolute inset-y-1.5 left-1.5 w-[2px] rounded-full bg-[#dfd0f4]"
          aria-hidden="true"
        />
        <Clock className="absolute left-2.5 top-2 h-3 w-3 text-[#7a65a6]/70" aria-hidden="true" />
        <p className="pl-4.5 text-[15px] font-black leading-tight tracking-tight text-[#1f1a25] sm:text-[16px]">
          {startTimeLabel}
        </p>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-1.5">
          <p
            className={`truncate text-sm text-[#15131c] sm:text-[15px] ${
              isGenericTitle ? "font-semibold" : "font-bold"
            }`}
          >
            {sessionInfo.title}
          </p>
          {sessionInfo.tag ? (
            <span className="shrink-0 rounded-full bg-[#f4eefe] px-1.5 py-0.5 text-[10px] font-semibold text-[#6a43a6] ring-1 ring-[#e4d6f7]">
              {sessionInfo.tag}
            </span>
          ) : null}
        </div>
        <p className="truncate text-xs font-medium text-[#2E2A33]/72">
          {buildRowMeta(item.durationMinutes)}
        </p>
        <span
          id={availabilityId}
          className={`mt-1 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${availabilityLineClass}`}
        >
          {buildSpacesLabel(item.spotsLeft)}
        </span>
      </div>

      <div className="ml-1 flex shrink-0 flex-col items-end gap-1.5">
        {blocked ? (
          <span className="inline-flex h-8 min-w-[102px] items-center justify-center gap-1 rounded-full border border-[#e2dfe9] bg-[#f5f4f8] px-3 text-xs font-semibold text-[#706d7a]">
            <XCircle className="h-3.5 w-3.5" aria-hidden="true" />
            Booked out
          </span>
        ) : (
          <button
            type="button"
            onClick={handleSelectControlClick}
            aria-pressed={selected}
            className={`inline-flex h-8 min-w-[102px] items-center justify-center gap-1.5 rounded-full border px-3 text-xs font-semibold transition-all duration-180 motion-reduce:transition-none focus-within:ring-2 focus-within:ring-[#6c35c3]/35 ${
              selected
                ? "border-[#c4b3dc] bg-white text-[#4c3f62] shadow-[0_0_0_2px_rgba(124,106,147,0.14)]"
                : "border-[#d4c7e6] bg-white text-[#4c3f62] hover:border-[#c4b3dc] hover:bg-[#f7f4fb]"
            }`}
          >
            {selected ? (
              <>
                <Check className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Selected</span>
              </>
            ) : (
              <>
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Select</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

function getSessionInfo(name: string): {
  title: string;
  tag: string | null;
} {
  const trimmed = name.trim();
  if (!trimmed) {
    return { title: "Recreational Gymnastics", tag: null };
  }

  const tag =
    /\bdisplay\b/i.test(trimmed)
      ? "Display"
      : /\bone[\s-]?off\b|\bdrop[\s-]?in\b/i.test(trimmed)
      ? "One-off"
      : /\bblock\b|\bterm\b/i.test(trimmed)
      ? "Block"
      : /\bweekly\b/i.test(trimmed)
      ? "Weekly"
      : null;

  const stripped = trimmed
    .replace(/\(([^)]*?\d[^)]*?)\)/gi, " ")
    .replace(/\b\d{1,2}\s*(?:yrs?|years?)\s*\d{1,2}\s*(?:yrs?|years?)\b/gi, " ")
    .replace(/\b\d{1,2}\s*(?:yrs?|years?)?\s*(?:-|to|\u2013)\s*\d{1,2}\s*(?:yrs?|years?)?\b/gi, " ")
    .replace(
      /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|tues|wed|thu|thur|thurs|fri|sat|sun)\b/gi,
      " "
    )
    .replace(/\b\d{1,2}(:\d{2})?\s?(am|pm)?\b/gi, " ")
    .replace(/[-|_/]+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();

  if (!stripped || stripped.length < 3) {
    return { title: "Recreational Gymnastics", tag };
  }
  if (/^recreational(\s+(class|session))?$/i.test(stripped)) {
    return { title: "Recreational Gymnastics", tag };
  }

  return { title: stripped, tag };
}

function parseClockTime(value: string): { hour24: number; minute: number } | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parts = trimmed.split(":");
  const hour24 = Number.parseInt(parts[0] ?? "", 10);
  const minute = Number.parseInt(parts[1] ?? "", 10);
  if (Number.isNaN(hour24) || Number.isNaN(minute)) return null;
  if (hour24 < 0 || hour24 > 23 || minute < 0 || minute > 59) return null;
  return { hour24, minute };
}

function to12Hour(value: string): { hour: number; minute: number; period: "AM" | "PM" } | null {
  const parsed = parseClockTime(value);
  if (!parsed) return null;
  const period: "AM" | "PM" = parsed.hour24 >= 12 ? "PM" : "AM";
  const hour = parsed.hour24 % 12 === 0 ? 12 : parsed.hour24 % 12;
  return { hour, minute: parsed.minute, period };
}

function formatStartTime(value: string): string {
  const time = to12Hour(value);
  if (!time) return value;
  if (time.minute === 0) return `${time.hour} ${time.period}`;
  return `${time.hour}:${String(time.minute).padStart(2, "0")} ${time.period}`;
}

function buildRowMeta(durationMinutes: number | null): string {
  const duration = typeof durationMinutes === "number" && durationMinutes > 0 ? `${durationMinutes} min` : null;
  return duration ?? "Session details";
}

function buildSpacesLabel(spotsLeft: number | null): string {
  if (spotsLeft == null) return "Open";
  if (spotsLeft <= 0) return "Fully booked";
  if (spotsLeft <= 3) return `Only ${spotsLeft} ${spotsLeft === 1 ? "spot" : "spots"} left`;
  return `${spotsLeft} ${spotsLeft === 1 ? "spot" : "spots"} left`;
}
