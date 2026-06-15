export const DISPLAY_CLASS_MONTHLY_PRICE = 51.65;
export const DISPLAY_CLASS_STRIPE_PRICE_ID = "price_1SD2bGJWV6yLYkEko1wFZ6qX";

type RecreationalClassIdentity = {
  name?: string | null;
  weekday?: string | number | null;
  startTime?: string | null;
  endTime?: string | null;
};

function normalizeText(value: string | null | undefined): string {
  return value?.trim().toLowerCase().replace(/\s+/g, " ") ?? "";
}

function normalizeWeekday(value: string | number | null | undefined): string {
  if (typeof value === "number") {
    if (value === 5) return "friday";
    return "";
  }

  const normalized = normalizeText(value);
  return normalized === "fri" ? "friday" : normalized;
}

function normalizeTime(value: string | null | undefined): string {
  const match = value?.trim().match(/^(\d{1,2}):(\d{2})/);
  if (!match) return "";
  return `${match[1].padStart(2, "0")}:${match[2]}`;
}

export function isDisplayClass(item: RecreationalClassIdentity): boolean {
  return (
    normalizeText(item.name).includes("display") &&
    normalizeWeekday(item.weekday) === "friday" &&
    normalizeTime(item.startTime) === "18:30" &&
    normalizeTime(item.endTime) === "20:00"
  );
}

export function hasMixedDisplayClassSelection(
  items: RecreationalClassIdentity[]
): boolean {
  const displayCount = items.filter(isDisplayClass).length;
  return displayCount > 0 && displayCount < items.length;
}
