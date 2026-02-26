import type { ClassCardItem } from "../types";
import { getAvailabilityState } from "../utils";
import { Check, Plus, XCircle } from "lucide-react";

type ClassRowProps = {
  weekday: string;
  item: ClassCardItem;
  selected: boolean;
  onToggle: (item: ClassCardItem) => void;
};

export default function ClassRow({
  weekday,
  item,
  selected,
  onToggle,
}: ClassRowProps) {
  const blocked = item.isFull && !selected;
  const isDisplayClass = item.name.toLowerCase().includes("display");
  const availability = getAvailabilityState(item.spotsLeft);
  const checkboxId = `class-toggle-${item.id}`;
  const startTime = formatStartTime(item.startTime);
  const timeParts = splitTime(startTime);
  const endTime = buildEndTimeLabel(
    item.startTime,
    item.durationMinutes,
    item.endTime
  );
  const endTimeParts = splitTime(endTime ?? "");
  const nextClassDateLabel = buildNextClassDateLabel(weekday, item.startTime);

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
  const availabilityTextClass =
    availability.variant === "full" || availability.variant === "critical"
      ? "text-[#b91c1c]"
      : availability.variant === "low"
      ? "text-[#b45309]"
      : "text-[#15803d]";
  const capacityPercent = getCapacityPercent(item.spotsLeft, item.capacity);
  const capacityFillClass = getCapacityFillClass(item.spotsLeft);
  const timeTextClass = selected ? "text-white" : "text-[#161321]";
  const periodTextClass = selected ? "text-white/90" : "text-[#5e556f]";
  const nextClassTextClass = selected ? "text-[#4c3f62]" : "text-[#5e556f]";
  const specialBadgeClass = selected
    ? "border-white/50 bg-white/20 text-white"
    : "border-[#f4d978] bg-[#fff8dc] text-[#6a4a00]";

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
      className={`group relative grid min-h-[98px] grid-cols-[minmax(0,1fr)_112px] grid-rows-[auto_auto] items-center gap-x-3 gap-y-1 overflow-hidden rounded-2xl border border-[#e7e1f1] bg-white px-3 py-2.5 shadow-[0_10px_24px_-20px_rgba(34,24,56,0.36)] transition-[background-color,border-color,box-shadow,transform] duration-200 ease-out motion-reduce:transition-none active:scale-[0.99] motion-reduce:active:scale-100 sm:px-3 lg:min-h-[92px] lg:grid-cols-[84px_minmax(0,1fr)_128px] lg:grid-rows-1 ${
        blocked
          ? "cursor-not-allowed border-[#ece7f4] bg-[#f5f4f8] opacity-92"
          : selected
          ? "cursor-pointer border-transparent bg-white shadow-[0_12px_28px_-18px_rgba(58,32,96,0.4)]"
          : "cursor-pointer hover:-translate-y-[1px] hover:border-[#d4c5ea] hover:bg-[#fcfbff] hover:shadow-[0_14px_30px_-18px_rgba(46,28,76,0.38)] focus-visible:ring-2 focus-visible:ring-[#6c35c3]/30"
      } ${isDisplayClass ? "min-h-[114px] lg:min-h-[100px]" : ""}`}
    >
      {isDisplayClass ? (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-0 top-0 z-20 h-8 w-8 bg-[#facc15] [clip-path:polygon(0_0,100%_0,0_100%)] lg:h-9 lg:w-9"
        />
      ) : null}
      {isDisplayClass ? (
        <span
          className={`pointer-events-none absolute left-4 top-2 z-20 inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold leading-none ${specialBadgeClass}`}
          aria-hidden="true"
        >
          Display class • Special pricing
        </span>
      ) : null}

      <span
        className={`pointer-events-none absolute inset-0 rounded-2xl bg-[linear-gradient(90deg,#6c35c3_0%,#7a49cf_34%,#9f79dc_58%,#d8c6f1_78%,#ffffff_100%)] transition-transform duration-400 ease-out motion-reduce:transition-none ${
          selected ? "scale-x-100 opacity-80" : "scale-x-0 opacity-0"
        } origin-left`}
        aria-hidden="true"
      />

      <input
        id={checkboxId}
        type="checkbox"
        checked={selected}
        disabled={blocked}
        onChange={toggleSelection}
        aria-label={selected ? `Deselect class` : `Select class`}
        aria-describedby={availabilityId}
        className="sr-only"
      />
      <span id={availabilityId} className="sr-only">
        {buildSpacesText(item.spotsLeft)}
      </span>

      <div className={`relative z-10 row-start-1 col-start-1 flex h-full min-w-0 items-center pr-1 text-left tabular-nums transition-colors duration-300 lg:row-span-1 lg:pr-6 ${
        isDisplayClass ? "pt-5 lg:pt-3" : ""
      }`}>
        <p className={`flex items-baseline gap-1.5 leading-none transition-colors duration-300 ${timeTextClass}`}>
          <span className="inline-flex items-baseline">
            <span className="text-[30px] font-bold tracking-[-0.02em]">
              {timeParts.hour}
            </span>
            <span className="text-[22px] font-semibold tracking-[-0.015em]">
              :{timeParts.minute}
            </span>
          </span>
          <span
            className={`pl-0.5 text-[10px] font-semibold tracking-[0.12em] transition-colors duration-300 ${periodTextClass}`}
          >
            {timeParts.period}
          </span>
          {endTime ? (
            <>
              <span className={`pl-1 text-[14px] font-semibold ${periodTextClass}`}>-</span>
              <span className={`inline-flex items-baseline ${periodTextClass}`}>
                <span className="text-[16px] font-semibold">{endTimeParts.hour}</span>
                <span className="text-[14px] font-semibold">:{endTimeParts.minute}</span>
              </span>
              <span className={`pl-0.5 text-[9px] font-semibold tracking-[0.1em] ${periodTextClass}`}>
                {endTimeParts.period}
              </span>
            </>
          ) : null}
        </p>
      </div>

      <div className="relative z-10 col-start-1 row-start-2 mt-1 flex items-center gap-2 pl-1 pr-2 lg:hidden">
        <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-[#e5e7eb]">
          <span
            className={`block h-full rounded-full transition-[width] duration-300 ease-out ${capacityFillClass}`}
            style={{ width: `${capacityPercent}%` }}
            aria-hidden="true"
          />
        </div>
        <span
          className={`shrink-0 text-[11px] font-semibold ${availabilityTextClass} ${
            selected
              ? "rounded-full bg-white/85 px-2 py-0.5 shadow-[0_0_0_1px_rgba(255,255,255,0.7)]"
              : ""
          }`}
        >
          {buildSpacesText(item.spotsLeft)}
        </span>
      </div>

      <div className="relative z-10 hidden col-start-2 row-start-1 lg:flex lg:w-full lg:max-w-[380px] lg:justify-self-center lg:flex-col lg:justify-center lg:gap-1.5">
        <span
          className={`self-center text-[11px] font-semibold ${availabilityTextClass} ${
            selected
              ? "rounded-full bg-white/85 px-2 py-0.5 shadow-[0_0_0_1px_rgba(255,255,255,0.7)]"
              : ""
          }`}
        >
          {buildSpacesText(item.spotsLeft)}
        </span>
        <div className="h-1.5 min-w-0 overflow-hidden rounded-full bg-[#e5e7eb]">
          <span
            className={`block h-full rounded-full transition-[width] duration-300 ease-out ${capacityFillClass}`}
            style={{ width: `${capacityPercent}%` }}
            aria-hidden="true"
          />
        </div>
      </div>

      <div className="relative z-10 row-span-2 row-start-1 col-start-2 flex h-full w-[112px] flex-col items-end justify-between py-0.5 lg:col-start-3 lg:w-full">
        <p className={`whitespace-nowrap text-right text-[10px] font-medium leading-none ${nextClassTextClass}`}>
          Next class: {nextClassDateLabel}
        </p>
        {blocked ? (
          <span className="inline-flex h-8 w-[104px] items-center justify-center gap-1 rounded-full border border-[#e2dfe9] bg-[#f5f4f8] px-3 text-xs font-semibold text-[#706d7a]">
            <XCircle className="h-3.5 w-3.5" aria-hidden="true" />
            Booked out
          </span>
        ) : (
          <button
            type="button"
            onClick={handleSelectControlClick}
            aria-pressed={selected}
            className={`inline-flex h-8 w-[104px] items-center justify-center gap-1.5 rounded-full border px-3 text-xs font-semibold transition-all duration-180 motion-reduce:transition-none focus-within:ring-2 focus-within:ring-[#6c35c3]/35 ${
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
  return `${time.hour}:${String(time.minute).padStart(2, "0")} ${time.period}`;
}

function splitTime(value: string): { hour: string; minute: string; period: string } {
  const match = value.match(/^(\d{1,2}:\d{2})\s*(AM|PM)$/i);
  if (!match) return { hour: value, minute: "", period: "" };
  const [hour = match[1], minute = "00"] = match[1].split(":");
  return { hour, minute, period: match[2].toUpperCase() };
}


function buildSpacesText(spotsLeft: number | null): string {
  if (spotsLeft == null) return "Spaces unknown";
  const safeSpaces = Math.max(0, spotsLeft);
  return `${safeSpaces} ${safeSpaces === 1 ? "space" : "spaces"} left`;
}

function getCapacityPercent(
  spotsLeft: number | null,
  capacity: number | null
): number {
  if (
    typeof spotsLeft !== "number" ||
    typeof capacity !== "number" ||
    !Number.isFinite(spotsLeft) ||
    !Number.isFinite(capacity) ||
    capacity <= 0
  ) {
    return 0;
  }

  const clampedSpots = Math.min(Math.max(spotsLeft, 0), capacity);
  return (clampedSpots / capacity) * 100;
}

function getCapacityFillClass(spotsLeft: number | null): string {
  if (spotsLeft === 1) return "bg-[#ef4444]";
  if (typeof spotsLeft === "number" && spotsLeft > 0 && spotsLeft < 5) {
    return "bg-[#f59e0b]";
  }
  return "bg-[#22c55e]";
}

function buildEndTimeLabel(
  startTime: string,
  durationMinutes: number | null,
  endTime: string | null
): string | null {
  let normalizedEnd = "";

  const computedEnd = addMinutesToTime(startTime, durationMinutes);
  if (computedEnd) {
    normalizedEnd = computedEnd;
  } else if (endTime) {
    normalizedEnd = formatStartTime(endTime);
  }

  if (!normalizedEnd) return null;
  return normalizedEnd;
}

function addMinutesToTime(
  value: string,
  durationMinutes: number | null
): string | null {
  if (
    typeof durationMinutes !== "number" ||
    !Number.isFinite(durationMinutes) ||
    durationMinutes <= 0
  ) {
    return null;
  }

  const parsed = parseClockTime(value);
  if (!parsed) return null;

  const baseMinutes = parsed.hour24 * 60 + parsed.minute;
  const nextMinutes = (baseMinutes + durationMinutes) % (24 * 60);
  const hour24 = Math.floor(nextMinutes / 60);
  const minute = nextMinutes % 60;
  const period: "AM" | "PM" = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;

  return `${hour12}:${String(minute).padStart(2, "0")} ${period}`;
}

function buildNextClassDateLabel(weekday: string, startTime: string): string {
  const dayMap: Record<string, number> = {
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
  };

  const targetDay = dayMap[weekday.trim().toLowerCase()];
  if (targetDay == null) {
    return "Unknown";
  }

  const now = new Date();
  const nowDay = now.getDay();
  const daysUntil = (targetDay - nowDay + 7) % 7;

  const parsedStart = parseClockTime(startTime);
  const candidate = new Date(now);
  candidate.setHours(0, 0, 0, 0);
  candidate.setDate(candidate.getDate() + daysUntil);

  if (parsedStart) {
    candidate.setHours(parsedStart.hour24, parsedStart.minute, 0, 0);
  }

  if (daysUntil === 0 && candidate <= now) {
    candidate.setDate(candidate.getDate() + 7);
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(candidate);
}
