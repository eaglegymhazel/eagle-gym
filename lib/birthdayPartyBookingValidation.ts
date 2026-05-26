export const BIRTHDAY_PARTY_MIN_CHILDREN = 1;
export const BIRTHDAY_PARTY_MAX_CHILDREN = 35;
export const BIRTHDAY_CHILD_MINIMUM_AGE_YEARS = 4;
const LONDON_TZ = "Europe/London";

function getDatePartsInTimeZone(
  date: Date,
  timeZone = LONDON_TZ
): { year: number; month: number; day: number } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  return {
    year: Number.parseInt(
      parts.find((part) => part.type === "year")?.value ?? "1970",
      10
    ),
    month: Number.parseInt(
      parts.find((part) => part.type === "month")?.value ?? "1",
      10
    ),
    day: Number.parseInt(
      parts.find((part) => part.type === "day")?.value ?? "1",
      10
    ),
  };
}

function toDateKey(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getBirthdayChildMaxDate(
  referenceDate = new Date(),
  timeZone = LONDON_TZ
): string {
  const { year, month, day } = getDatePartsInTimeZone(referenceDate, timeZone);
  const maxDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0, 0));
  maxDate.setUTCFullYear(
    maxDate.getUTCFullYear() - BIRTHDAY_CHILD_MINIMUM_AGE_YEARS
  );
  return toDateKey(maxDate);
}

export function isBirthdayChildOldEnough(
  dateOfBirth: string,
  referenceDate = new Date(),
  timeZone = LONDON_TZ
): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)) return false;
  return dateOfBirth <= getBirthdayChildMaxDate(referenceDate, timeZone);
}

export function parseBirthdayPartySize(value: unknown): number | null {
  const raw =
    typeof value === "number"
      ? Number.isInteger(value)
        ? value
        : NaN
      : typeof value === "string"
        ? /^\d+$/.test(value.trim())
          ? Number.parseInt(value.trim(), 10)
          : NaN
        : NaN;

  if (!Number.isFinite(raw)) {
    return null;
  }

  const normalized = Math.trunc(raw);
  if (
    normalized < BIRTHDAY_PARTY_MIN_CHILDREN ||
    normalized > BIRTHDAY_PARTY_MAX_CHILDREN
  ) {
    return null;
  }

  return normalized;
}
