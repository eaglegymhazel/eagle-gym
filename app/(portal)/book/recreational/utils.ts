import type { ClassCardItem } from "./types";

export const WEEKDAY_ORDER = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

export const DAY_SHORT: Record<string, string> = {
  Monday: "Mon",
  Tuesday: "Tue",
  Wednesday: "Wed",
  Thursday: "Thu",
  Friday: "Fri",
  Saturday: "Sat",
  Sunday: "Sun",
};

export function weekdayToId(weekday: string): string {
  return `day-${weekday.toLowerCase().slice(0, 3)}`;
}

export function formatTime(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "--:--";
  const parts = trimmed.split(":");
  const hours = Number.parseInt(parts[0] ?? "", 10);
  const minutes = Number.parseInt(parts[1] ?? "", 10);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return trimmed;
  const normalizedHours = ((hours % 24) + 24) % 24;
  const period = normalizedHours >= 12 ? "pm" : "am";
  const hour12 = normalizedHours % 12 === 0 ? 12 : normalizedHours % 12;
  if (minutes === 0) return `${hour12}${period}`;
  return `${hour12}:${String(minutes).padStart(2, "0")}${period}`;
}

export function parseTimeToMinutes(value: string): number {
  const trimmed = value.trim();
  if (!trimmed) return Number.MAX_SAFE_INTEGER;
  const parts = trimmed.split(":");
  const hours = Number.parseInt(parts[0] ?? "", 10);
  const minutes = Number.parseInt(parts[1] ?? "", 10);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return Number.MAX_SAFE_INTEGER;
  return hours * 60 + minutes;
}

export function buildMeta(item: ClassCardItem): string {
  const durationPart =
    typeof item.durationMinutes === "number" ? `${item.durationMinutes} min` : null;
  const agePart =
    item.minAge != null && item.maxAge != null
      ? `Ages ${item.minAge}-${item.maxAge}`
      : null;
  if (durationPart && agePart) return `${durationPart} | ${agePart}`;
  return durationPart ?? agePart ?? "Class details";
}

export type AvailabilityVariant = "open" | "ok" | "low" | "full";

export function getAvailabilityState(spotsLeft: number | null): {
  label: string;
  variant: AvailabilityVariant;
} {
  if (spotsLeft == null) return { label: "Open", variant: "open" };
  if (spotsLeft <= 0) return { label: "Fully booked", variant: "full" };
  if (spotsLeft <= 3) return { label: `Only ${spotsLeft} left`, variant: "low" };
  return { label: `${spotsLeft} left`, variant: "ok" };
}
