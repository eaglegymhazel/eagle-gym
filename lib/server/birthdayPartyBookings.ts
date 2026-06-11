import "server-only";

import { supabaseAdmin } from "@/lib/admin";

const LONDON_TZ = "Europe/London";
const SLOT_GENERATION_DAYS = 730;
const MINIMUM_BOOKING_LEAD_DAYS = 6;
const HOLD_MINUTES = 30;
const BASE_PRICE_PENCE = 15000;
const INCLUDED_CHILDREN = 12;
const EXTRA_CHILD_PRICE_PENCE = 1000;

type BirthdayPartyScheduleRuleRow = {
  id: string;
  weekday: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
  effective_from: string;
  effective_to: string | null;
  max_children: number | null;
};

type BirthdayPartyBlockedDateRow = {
  slot_date: string;
  start_time: string;
  end_time: string;
  reason: string | null;
};

type BirthdayPartyBookingRow = {
  id: string;
  accountId: string;
  slot_date: string;
  start_time: string;
  end_time: string;
  status: string;
  holdExpiresAt: string | null;
};

type AccountDetailsRow = {
  id: string;
  accFirstName: string | null;
  accLastName: string | null;
  email: string | null;
  accTelNo: string | null;
  accEmergencyTelNo: string | null;
};

export type BirthdayPartySlotSummary = {
  slotDate: string;
  startTime: string;
  endTime: string;
  isBlocked: boolean;
  blockedReason: string | null;
};

export type BirthdayPartyCalendarSlotSummary = BirthdayPartySlotSummary & {
  id: string;
  isAvailable: boolean;
};

export type BirthdayPartyAccountSummary = {
  fullName: string;
  email: string;
  telNo: string;
  emergencyTelNo: string;
};

export type BirthdayPartyPriceBreakdown = {
  partySize: number;
  basePricePence: number;
  extraChildrenCount: number;
  extraChildrenPricePence: number;
  totalAmountPence: number;
};

function getLondonDateParts(date: Date): { year: number; month: number; day: number } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: LONDON_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  return {
    year: Number.parseInt(parts.find((part) => part.type === "year")?.value ?? "1970", 10),
    month: Number.parseInt(parts.find((part) => part.type === "month")?.value ?? "1", 10),
    day: Number.parseInt(parts.find((part) => part.type === "day")?.value ?? "1", 10),
  };
}

function getLondonToday(): Date {
  const { year, month, day } = getLondonDateParts(new Date());
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0, 0));
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function toDateKey(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getUtcWeekday(date: Date): number {
  return date.getUTCDay();
}

export function hasBirthdayPartyBookingLeadTime(
  slotDate: string,
  now = new Date()
): boolean {
  const { year, month, day } = getLondonDateParts(now);
  const today = new Date(Date.UTC(year, month - 1, day, 12, 0, 0, 0));
  const earliestBookableDate = addDays(today, MINIMUM_BOOKING_LEAD_DAYS);
  const parsedSlotDate = new Date(`${slotDate}T12:00:00Z`);

  return (
    !Number.isNaN(parsedSlotDate.getTime()) &&
    parsedSlotDate >= earliestBookableDate
  );
}

function toSlotId(slotDate: string, startTime: string, endTime: string): string {
  return `${slotDate}|${startTime}|${endTime}`;
}

function fromSlotId(slotId: string): { slotDate: string; startTime: string; endTime: string } | null {
  const [slotDate, startTime, endTime] = slotId.split("|");
  if (!slotDate || !startTime || !endTime) return null;
  return { slotDate, startTime, endTime };
}

function formatDateForDisplay(dateValue: string): string {
  const date = new Date(`${dateValue}T12:00:00Z`);
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function formatTimeForDisplay(timeValue: string): string {
  const [hourRaw, minuteRaw] = timeValue.split(":");
  const hour = Number.parseInt(hourRaw ?? "", 10);
  const minute = Number.parseInt(minuteRaw ?? "", 10);
  const date = new Date(Date.UTC(1970, 0, 1, hour, minute, 0, 0));
  return new Intl.DateTimeFormat("en-GB", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "UTC",
  })
    .format(date)
    .replace(":00", "")
    .replace(" ", "")
    .toLowerCase();
}

function calculateRuleDates(rule: BirthdayPartyScheduleRuleRow, daysAhead: number): string[] {
  const today = getLondonToday();
  const generated: string[] = [];
  const effectiveFrom = new Date(`${rule.effective_from}T12:00:00Z`);
  const effectiveTo = rule.effective_to ? new Date(`${rule.effective_to}T12:00:00Z`) : null;

  for (let offset = 0; offset <= daysAhead; offset += 1) {
    const date = addDays(today, offset);
    if (date < effectiveFrom) continue;
    if (effectiveTo && date > effectiveTo) continue;
    if (getUtcWeekday(date) !== rule.weekday) continue;
    generated.push(toDateKey(date));
  }

  return generated;
}

function isBookingBlockingSlot(booking: BirthdayPartyBookingRow, nowIso: string): boolean {
  if (booking.status === "confirmed" || booking.status === "paid") return true;
  if (booking.status !== "pending") return false;
  return !!booking.holdExpiresAt && booking.holdExpiresAt > nowIso;
}

async function getScheduleRules(): Promise<BirthdayPartyScheduleRuleRow[]> {
  const { data, error } = await supabaseAdmin
    .from("BirthdayPartyScheduleRules")
    .select("id,weekday,start_time,end_time,is_active,effective_from,effective_to,max_children")
    .eq("is_active", true)
    .order("weekday", { ascending: true })
    .order("start_time", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as BirthdayPartyScheduleRuleRow[];
}

async function getBlockedDates(fromDate: string, toDate: string): Promise<BirthdayPartyBlockedDateRow[]> {
  const { data, error } = await supabaseAdmin
    .from("BirthdayPartyBlockedDates")
    .select("slot_date,start_time,end_time,reason")
    .gte("slot_date", fromDate)
    .lte("slot_date", toDate);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as BirthdayPartyBlockedDateRow[];
}

async function getBlockingBookings(fromDate: string, toDate: string): Promise<BirthdayPartyBookingRow[]> {
  const { data, error } = await supabaseAdmin
    .from("BirthdayPartyBookings")
    .select('id,"accountId",slot_date,start_time,end_time,status,"holdExpiresAt"')
    .gte("slot_date", fromDate)
    .lte("slot_date", toDate)
    .in("status", ["pending", "paid", "confirmed"]);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as BirthdayPartyBookingRow[];
}

function buildCandidateSlots(
  rules: BirthdayPartyScheduleRuleRow[],
  blockedDates: BirthdayPartyBlockedDateRow[],
  bookings: BirthdayPartyBookingRow[],
  daysAhead: number
): BirthdayPartyCalendarSlotSummary[] {
  const blockedByKey = new Map(
    blockedDates.map((blocked) => [
      toSlotId(blocked.slot_date, blocked.start_time, blocked.end_time),
      blocked.reason ?? null,
    ])
  );
  const nowIso = new Date().toISOString();
  const blockedByBookingKey = new Set(
    bookings
      .filter((booking) => isBookingBlockingSlot(booking, nowIso))
      .map((booking) => toSlotId(booking.slot_date, booking.start_time, booking.end_time))
  );

  const slots = rules.flatMap((rule) =>
    calculateRuleDates(rule, daysAhead).map((slotDate) => {
      const id = toSlotId(slotDate, rule.start_time, rule.end_time);
      const blockedReason = blockedByKey.get(id) ?? null;
      const isBlocked = blockedByKey.has(id);
      const isAvailable =
        hasBirthdayPartyBookingLeadTime(slotDate) &&
        !isBlocked &&
        !blockedByBookingKey.has(id);

      return {
        id,
        slotDate,
        startTime: rule.start_time,
        endTime: rule.end_time,
        isBlocked,
        blockedReason,
        isAvailable,
      };
    })
  );

  return slots.sort((left, right) => {
    const leftKey = `${left.slotDate}-${left.startTime}`;
    const rightKey = `${right.slotDate}-${right.startTime}`;
    return leftKey.localeCompare(rightKey);
  });
}

export function calculateBirthdayPartyPrice(partySize: number): BirthdayPartyPriceBreakdown {
  const normalizedPartySize = Number.isFinite(partySize) ? Math.max(1, Math.trunc(partySize)) : 1;
  const extraChildrenCount = Math.max(0, normalizedPartySize - INCLUDED_CHILDREN);
  const extraChildrenPricePence = extraChildrenCount * EXTRA_CHILD_PRICE_PENCE;
  return {
    partySize: normalizedPartySize,
    basePricePence: BASE_PRICE_PENCE,
    extraChildrenCount,
    extraChildrenPricePence,
    totalAmountPence: BASE_PRICE_PENCE + extraChildrenPricePence,
  };
}

export async function getBirthdayPartyCalendarSlots(
  daysAhead = SLOT_GENERATION_DAYS
): Promise<BirthdayPartyCalendarSlotSummary[]> {
  const today = getLondonToday();
  const fromDate = toDateKey(today);
  const toDate = toDateKey(addDays(today, daysAhead));
  const [rules, blockedDates, bookings] = await Promise.all([
    getScheduleRules(),
    getBlockedDates(fromDate, toDate),
    getBlockingBookings(fromDate, toDate),
  ]);

  return buildCandidateSlots(rules, blockedDates, bookings, daysAhead);
}

export async function getAvailableBirthdayPartySlots(
  daysAhead = SLOT_GENERATION_DAYS
): Promise<BirthdayPartySlotSummary[]> {
  const slots = await getBirthdayPartyCalendarSlots(daysAhead);
  return slots
    .filter((slot) => slot.isAvailable)
    .map((slot) => ({
      slotDate: slot.slotDate,
      startTime: slot.startTime,
      endTime: slot.endTime,
      isBlocked: slot.isBlocked,
      blockedReason: slot.blockedReason,
    }));
}

export async function getBirthdayPartySlot(
  slotDate: string,
  startTime: string,
  endTime: string
): Promise<BirthdayPartySlotSummary | null> {
  const slots = await getBirthdayPartyCalendarSlots();
  const match = slots.find(
    (slot) => slot.slotDate === slotDate && slot.startTime === startTime && slot.endTime === endTime
  );

  if (!match) return null;

  return {
    slotDate: match.slotDate,
    startTime: match.startTime,
    endTime: match.endTime,
    isBlocked: match.isBlocked,
    blockedReason: match.blockedReason,
  };
}

export function parseBirthdayPartySlotId(slotId: string): { slotDate: string; startTime: string; endTime: string } | null {
  return fromSlotId(slotId);
}

export function buildBirthdayPartySlotId(slotDate: string, startTime: string, endTime: string): string {
  return toSlotId(slotDate, startTime, endTime);
}

export async function isBirthdayPartySlotAvailable(
  slotDate: string,
  startTime: string,
  endTime: string
): Promise<boolean> {
  return isBirthdayPartySlotAvailableForAccount(slotDate, startTime, endTime);
}

export async function isBirthdayPartySlotAvailableForAccount(
  slotDate: string,
  startTime: string,
  endTime: string,
  accountId?: string
): Promise<boolean> {
  const today = getLondonToday();
  const toDate = toDateKey(addDays(today, SLOT_GENERATION_DAYS));
  const [rules, blockedDates, bookings] = await Promise.all([
    getScheduleRules(),
    getBlockedDates(slotDate, slotDate),
    getBlockingBookings(slotDate, slotDate),
  ]);

  const candidateSlots = buildCandidateSlots(
    rules,
    blockedDates,
    bookings.filter((booking) => {
      if (
        accountId &&
        booking.accountId === accountId &&
        booking.slot_date === slotDate &&
        booking.start_time === startTime &&
        booking.end_time === endTime &&
        booking.status === "pending" &&
        booking.holdExpiresAt &&
        booking.holdExpiresAt > new Date().toISOString()
      ) {
        return false;
      }

      return true;
    }),
    Math.max(0, Math.ceil((new Date(`${toDate}T12:00:00Z`).getTime() - new Date(`${toDateKey(today)}T12:00:00Z`).getTime()) / (24 * 60 * 60 * 1000)))
  );

  return candidateSlots.some(
    (slot) =>
      slot.slotDate === slotDate &&
      slot.startTime === startTime &&
      slot.endTime === endTime &&
      slot.isAvailable
  );
}

export async function getBirthdayPartyAccountSummary(
  accountId: string
): Promise<BirthdayPartyAccountSummary | null> {
  const { data, error } = await supabaseAdmin
    .from("Accounts")
    .select("id,accFirstName,accLastName,email,accTelNo,accEmergencyTelNo")
    .eq("id", accountId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  const row = data as AccountDetailsRow | null;
  if (!row) return null;

  return {
    fullName: `${row.accFirstName?.trim() ?? ""} ${row.accLastName?.trim() ?? ""}`.trim() || "Account holder",
    email: row.email?.trim() ?? "",
    telNo: row.accTelNo?.trim() ?? "",
    emergencyTelNo: row.accEmergencyTelNo?.trim() ?? "",
  };
}

export function getBirthdayPartyHoldExpiresAt(): string {
  return new Date(Date.now() + HOLD_MINUTES * 60 * 1000).toISOString();
}

export function getBirthdayPartySlotDisplay(slot: Pick<BirthdayPartySlotSummary, "slotDate" | "startTime" | "endTime">) {
  return {
    formattedDate: formatDateForDisplay(slot.slotDate),
    formattedTime: `${formatTimeForDisplay(slot.startTime)}-${formatTimeForDisplay(slot.endTime)}`,
  };
}
