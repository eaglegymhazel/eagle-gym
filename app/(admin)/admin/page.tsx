import { Suspense } from "react";
import AdminShell from "./AdminShell";
import {
  getAdminChildrenDirectory,
  getAdminRegisterClasses,
  getAdminSummerCampRegisterSessions,
  getAdminWaitlist,
  type AdminWaitlistRow,
} from "@/lib/server/adminDashboard";
import {
  getAdminMissedPayments,
  type AdminMissedPaymentRow,
} from "@/lib/server/adminMissedPayments";
import {
  getAdminBirthdayPartyBookings,
  type AdminBirthdayPartyBookingRow,
} from "@/lib/server/adminBirthdayPartyBookings";
import {
  getBirthdayPartyCalendarSlots,
  type BirthdayPartyCalendarSlotSummary,
} from "@/lib/server/birthdayPartyBookings";
import type { Child } from "@/components/admin/mockChildren";
import type { Session } from "@/components/admin/mockSessions";
import type { RegisterClassTemplate } from "@/components/admin/sessionBuild";

export default async function AdminPage() {
  const referenceNowIso = new Date().toISOString();
  let childrenData: Child[] = [];
  let registerClasses: RegisterClassTemplate[] = [];
  let summerCampRegisterSessions: Session[] = [];
  let waitlistRows: AdminWaitlistRow[] = [];
  let missedPaymentsRows: AdminMissedPaymentRow[] = [];
  let birthdayPartyBookingsRows: AdminBirthdayPartyBookingRow[] = [];
  let birthdayPartyCalendarSlots: BirthdayPartyCalendarSlotSummary[] = [];
  let childrenLoadError: string | null = null;
  let registerClassesError: string | null = null;
  let summerCampRegisterSessionsError: string | null = null;
  let waitlistLoadError: string | null = null;
  let missedPaymentsLoadError: string | null = null;
  let birthdayPartyBookingsLoadError: string | null = null;
  let birthdayPartyAvailabilityLoadError: string | null = null;

  try {
    childrenData = await getAdminChildrenDirectory();
  } catch (error) {
    childrenLoadError = error instanceof Error ? error.message : "Unable to load children.";
  }

  try {
    registerClasses = await getAdminRegisterClasses();
  } catch (error) {
    registerClassesError =
      error instanceof Error ? error.message : "Unable to load register classes.";
  }

  try {
    summerCampRegisterSessions = await getAdminSummerCampRegisterSessions();
  } catch (error) {
    summerCampRegisterSessionsError =
      error instanceof Error ? error.message : "Unable to load summer camp registers.";
  }

  try {
    waitlistRows = await getAdminWaitlist();
  } catch (error) {
    waitlistLoadError = error instanceof Error ? error.message : "Unable to load waiting list.";
  }

  try {
    missedPaymentsRows = await getAdminMissedPayments();
  } catch (error) {
    missedPaymentsLoadError =
      error instanceof Error ? error.message : "Unable to load missed payments.";
  }

  try {
    birthdayPartyBookingsRows = await getAdminBirthdayPartyBookings();
  } catch (error) {
    birthdayPartyBookingsLoadError =
      error instanceof Error ? error.message : "Unable to load birthday party bookings.";
  }

  try {
    birthdayPartyCalendarSlots = await getBirthdayPartyCalendarSlots();
  } catch (error) {
    birthdayPartyAvailabilityLoadError =
      error instanceof Error ? error.message : "Unable to load birthday party availability.";
  }

  return (
    <Suspense fallback={null}>
      <AdminShell
        referenceNowIso={referenceNowIso}
        initialChildrenData={childrenData}
        initialRegisterClasses={registerClasses}
        initialSummerCampRegisterSessions={summerCampRegisterSessions}
        initialWaitlistRows={waitlistRows}
        initialMissedPaymentsRows={missedPaymentsRows}
        initialBirthdayPartyBookingsRows={birthdayPartyBookingsRows}
        initialBirthdayPartyCalendarSlots={birthdayPartyCalendarSlots}
        initialChildrenLoadError={childrenLoadError}
        initialRegisterClassesError={registerClassesError}
        initialSummerCampRegisterSessionsError={summerCampRegisterSessionsError}
        initialWaitlistLoadError={waitlistLoadError}
        initialMissedPaymentsLoadError={missedPaymentsLoadError}
        initialBirthdayPartyBookingsLoadError={birthdayPartyBookingsLoadError}
        initialBirthdayPartyAvailabilityLoadError={birthdayPartyAvailabilityLoadError}
      />
    </Suspense>
  );
}
