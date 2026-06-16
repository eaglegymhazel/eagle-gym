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
import {
  getAdminCalendarEvents,
  type AdminCalendarEventRow,
} from "@/lib/server/adminCalendarEvents";
import type { Child } from "@/components/admin/mockChildren";
import type { Session } from "@/components/admin/mockSessions";
import type { RegisterClassTemplate } from "@/components/admin/sessionBuild";

type AdminTabKey =
  | "students"
  | "register"
  | "summer-camp-register"
  | "waiting"
  | "missed-payments"
  | "birthday-parties"
  | "calendar-events";

function resolveAdminTab(tab: string | undefined): AdminTabKey {
  if (
    tab === "students" ||
    tab === "register" ||
    tab === "summer-camp-register" ||
    tab === "waiting" ||
    tab === "missed-payments" ||
    tab === "birthday-parties" ||
    tab === "calendar-events"
  ) {
    return tab;
  }

  return "students";
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string }>;
}) {
  const referenceNowIso = new Date().toISOString();
  const resolvedSearchParams = await searchParams;
  const activeTab = resolveAdminTab(resolvedSearchParams?.tab);
  let childrenData: Child[] = [];
  let registerClasses: RegisterClassTemplate[] = [];
  let summerCampRegisterSessions: Session[] = [];
  let waitlistRows: AdminWaitlistRow[] = [];
  let missedPaymentsRows: AdminMissedPaymentRow[] = [];
  let birthdayPartyBookingsRows: AdminBirthdayPartyBookingRow[] = [];
  let birthdayPartyCalendarSlots: BirthdayPartyCalendarSlotSummary[] = [];
  let calendarEventsRows: AdminCalendarEventRow[] = [];
  let childrenLoadError: string | null = null;
  let registerClassesError: string | null = null;
  let summerCampRegisterSessionsError: string | null = null;
  let waitlistLoadError: string | null = null;
  let missedPaymentsLoadError: string | null = null;
  let birthdayPartyBookingsLoadError: string | null = null;
  let birthdayPartyAvailabilityLoadError: string | null = null;
  let calendarEventsLoadError: string | null = null;

  if (activeTab === "students") {
    try {
      childrenData = await getAdminChildrenDirectory();
    } catch (error) {
      childrenLoadError = error instanceof Error ? error.message : "Unable to load children.";
    }
  }

  if (activeTab === "register") {
    try {
      registerClasses = await getAdminRegisterClasses();
    } catch (error) {
      registerClassesError =
        error instanceof Error ? error.message : "Unable to load register classes.";
    }
  }

  if (activeTab === "summer-camp-register") {
    try {
      summerCampRegisterSessions = await getAdminSummerCampRegisterSessions();
    } catch (error) {
      summerCampRegisterSessionsError =
        error instanceof Error ? error.message : "Unable to load summer camp registers.";
    }
  }

  if (activeTab === "waiting") {
    try {
      waitlistRows = await getAdminWaitlist();
    } catch (error) {
      waitlistLoadError = error instanceof Error ? error.message : "Unable to load waiting list.";
    }
  }

  if (activeTab === "missed-payments") {
    try {
      missedPaymentsRows = await getAdminMissedPayments();
    } catch (error) {
      missedPaymentsLoadError =
        error instanceof Error ? error.message : "Unable to load missed payments.";
    }
  }

  if (activeTab === "birthday-parties") {
    try {
      [birthdayPartyBookingsRows, birthdayPartyCalendarSlots] = await Promise.all([
        getAdminBirthdayPartyBookings(),
        getBirthdayPartyCalendarSlots(),
      ]);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to load birthday party data.";
      birthdayPartyBookingsLoadError = message;
      birthdayPartyAvailabilityLoadError = message;
    }
  }

  if (activeTab === "calendar-events") {
    try {
      calendarEventsRows = await getAdminCalendarEvents();
    } catch (error) {
      calendarEventsLoadError =
        error instanceof Error ? error.message : "Unable to load calendar events.";
    }
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
        initialCalendarEventsRows={calendarEventsRows}
        initialChildrenLoadError={childrenLoadError}
        initialRegisterClassesError={registerClassesError}
        initialSummerCampRegisterSessionsError={summerCampRegisterSessionsError}
        initialWaitlistLoadError={waitlistLoadError}
        initialMissedPaymentsLoadError={missedPaymentsLoadError}
        initialBirthdayPartyBookingsLoadError={birthdayPartyBookingsLoadError}
        initialBirthdayPartyAvailabilityLoadError={birthdayPartyAvailabilityLoadError}
        initialCalendarEventsLoadError={calendarEventsLoadError}
      />
    </Suspense>
  );
}
