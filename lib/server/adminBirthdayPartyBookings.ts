import "server-only";

import { supabaseAdmin } from "@/lib/admin";

export type AdminBirthdayPartyBookingRow = {
  id: string;
  accountId: string;
  accountFullName: string;
  email: string;
  accTelNo: string;
  birthdayChildFirstName: string;
  birthdayChildLastName: string;
  birthdayChildFullName: string;
  birthdayChildDateOfBirth: string | null;
  ageTurningAtParty: number | null;
  partySize: number;
  slotDate: string;
  startTime: string;
  endTime: string;
  status: string;
  totalAmountPence: number;
  bookedAt: string | null;
  paidAt: string | null;
};

export type AdminBirthdayPartyBookingDetail = AdminBirthdayPartyBookingRow & {
  accEmergencyTelNo: string;
  healthNotes: string | null;
  specialRequirements: string | null;
  additionalNotes: string | null;
  stripeCheckoutSessionId: string | null;
  stripePaymentIntentId: string | null;
};

type BirthdayPartyBookingDbRow = {
  id: string;
  accountId: string;
  slot_date: string;
  start_time: string;
  end_time: string;
  status: string;
  partySize: number;
  totalAmountPence: number;
  birthdayChildFirstName: string | null;
  birthdayChildLastName: string | null;
  birthdayChildDateOfBirth: string | null;
  created_at: string | null;
  paid_at: string | null;
};

type BirthdayPartyBookingDetailDbRow = BirthdayPartyBookingDbRow & {
  healthNotes: string | null;
  specialRequirements: string | null;
  additionalNotes: string | null;
  stripeCheckoutSessionId: string | null;
  stripePaymentIntentId: string | null;
};

type AccountRow = {
  id: string | number;
  email: string | null;
  accFirstName: string | null;
  accLastName: string | null;
  accTelNo: string | null;
  accEmergencyTelNo: string | null;
};

const LONDON_TZ = "Europe/London";

function getLondonTodayKey(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: LONDON_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const year = parts.find((part) => part.type === "year")?.value ?? "1970";
  const month = parts.find((part) => part.type === "month")?.value ?? "01";
  const day = parts.find((part) => part.type === "day")?.value ?? "01";
  return `${year}-${month}-${day}`;
}

function computeAgeTurningAtParty(dateOfBirth: string | null, slotDate: string): number | null {
  if (!dateOfBirth) return null;

  const birthDate = new Date(`${dateOfBirth}T12:00:00Z`);
  const partyDate = new Date(`${slotDate}T12:00:00Z`);
  if (Number.isNaN(birthDate.getTime()) || Number.isNaN(partyDate.getTime())) {
    return null;
  }

  let age = partyDate.getUTCFullYear() - birthDate.getUTCFullYear();
  const partyMonth = partyDate.getUTCMonth();
  const birthMonth = birthDate.getUTCMonth();
  const partyDay = partyDate.getUTCDate();
  const birthDay = birthDate.getUTCDate();

  if (partyMonth < birthMonth || (partyMonth === birthMonth && partyDay < birthDay)) {
    age -= 1;
  }

  return Math.max(0, age);
}

function mapBaseRow(
  booking: BirthdayPartyBookingDbRow,
  account: AccountRow | null
): AdminBirthdayPartyBookingRow {
  const firstName = booking.birthdayChildFirstName?.trim() ?? "";
  const lastName = booking.birthdayChildLastName?.trim() ?? "";
  const accountFullName = `${account?.accFirstName?.trim() ?? ""} ${account?.accLastName?.trim() ?? ""}`.trim();

  return {
    id: booking.id,
    accountId: String(booking.accountId),
    accountFullName: accountFullName || "Unknown parent or guardian",
    email: account?.email?.trim() ?? "",
    accTelNo: account?.accTelNo?.trim() ?? "",
    birthdayChildFirstName: firstName,
    birthdayChildLastName: lastName,
    birthdayChildFullName: `${firstName} ${lastName}`.trim() || "Birthday child not set",
    birthdayChildDateOfBirth: booking.birthdayChildDateOfBirth,
    ageTurningAtParty: computeAgeTurningAtParty(booking.birthdayChildDateOfBirth, booking.slot_date),
    partySize: Number.isFinite(booking.partySize) ? booking.partySize : 0,
    slotDate: booking.slot_date,
    startTime: booking.start_time,
    endTime: booking.end_time,
    status: booking.status,
    totalAmountPence: Number.isFinite(booking.totalAmountPence) ? booking.totalAmountPence : 0,
    bookedAt: booking.created_at,
    paidAt: booking.paid_at,
  };
}

export async function getAdminBirthdayPartyBookings(): Promise<AdminBirthdayPartyBookingRow[]> {
  const todayKey = getLondonTodayKey();

  const { data: bookingRows, error: bookingError } = await supabaseAdmin
    .from("BirthdayPartyBookings")
    .select(
      'id,"accountId",slot_date,start_time,end_time,status,"partySize","totalAmountPence","birthdayChildFirstName","birthdayChildLastName","birthdayChildDateOfBirth",created_at,paid_at'
    )
    .gte("slot_date", todayKey)
    .in("status", ["pending", "paid", "confirmed"])
    .order("slot_date", { ascending: true })
    .order("start_time", { ascending: true });

  if (bookingError) {
    throw new Error(bookingError.message);
  }

  const bookings = (bookingRows ?? []) as BirthdayPartyBookingDbRow[];
  const accountIds = [...new Set(bookings.map((row) => String(row.accountId)).filter(Boolean))];
  const accountById = new Map<string, AccountRow>();

  if (accountIds.length > 0) {
    const { data: accountRows, error: accountError } = await supabaseAdmin
      .from("Accounts")
      .select("id,email,accFirstName,accLastName,accTelNo,accEmergencyTelNo")
      .in("id", accountIds);

    if (accountError) {
      throw new Error(accountError.message);
    }

    for (const account of (accountRows ?? []) as AccountRow[]) {
      accountById.set(String(account.id), account);
    }
  }

  return bookings.map((booking) => mapBaseRow(booking, accountById.get(String(booking.accountId)) ?? null));
}

export async function getAdminBirthdayPartyBookingById(
  bookingId: string
): Promise<AdminBirthdayPartyBookingDetail | null> {
  const { data: bookingData, error: bookingError } = await supabaseAdmin
    .from("BirthdayPartyBookings")
    .select(
      'id,"accountId",slot_date,start_time,end_time,status,"partySize","totalAmountPence","birthdayChildFirstName","birthdayChildLastName","birthdayChildDateOfBirth","healthNotes","specialRequirements","additionalNotes","stripeCheckoutSessionId","stripePaymentIntentId",created_at,paid_at'
    )
    .eq("id", bookingId)
    .maybeSingle();

  if (bookingError) {
    throw new Error(bookingError.message);
  }

  const booking = (bookingData ?? null) as BirthdayPartyBookingDetailDbRow | null;
  if (!booking) return null;

  const { data: accountData, error: accountError } = await supabaseAdmin
    .from("Accounts")
    .select("id,email,accFirstName,accLastName,accTelNo,accEmergencyTelNo")
    .eq("id", booking.accountId)
    .maybeSingle();

  if (accountError) {
    throw new Error(accountError.message);
  }

  const account = (accountData ?? null) as AccountRow | null;
  const base = mapBaseRow(booking, account);

  return {
    ...base,
    accEmergencyTelNo: account?.accEmergencyTelNo?.trim() ?? "",
    healthNotes: booking.healthNotes?.trim() || null,
    specialRequirements: booking.specialRequirements?.trim() || null,
    additionalNotes: booking.additionalNotes?.trim() || null,
    stripeCheckoutSessionId: booking.stripeCheckoutSessionId?.trim() || null,
    stripePaymentIntentId: booking.stripePaymentIntentId?.trim() || null,
  };
}
