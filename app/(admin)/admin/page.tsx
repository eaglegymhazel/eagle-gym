import { Suspense } from "react";
import AdminShell from "./AdminShell";
import {
  getAdminChildrenDirectory,
  getAdminRegisterClasses,
  getAdminSummerCampRegisterSessions,
  getAdminWaitlist,
  type AdminWaitlistRow,
} from "@/lib/server/adminDashboard";
import type { Child } from "@/components/admin/mockChildren";
import type { Session } from "@/components/admin/mockSessions";
import type { RegisterClassTemplate } from "@/components/admin/sessionBuild";

export default async function AdminPage() {
  let childrenData: Child[] = [];
  let registerClasses: RegisterClassTemplate[] = [];
  let summerCampRegisterSessions: Session[] = [];
  let waitlistRows: AdminWaitlistRow[] = [];
  let childrenLoadError: string | null = null;
  let registerClassesError: string | null = null;
  let summerCampRegisterSessionsError: string | null = null;
  let waitlistLoadError: string | null = null;

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

  return (
    <Suspense fallback={null}>
      <AdminShell
        initialChildrenData={childrenData}
        initialRegisterClasses={registerClasses}
        initialSummerCampRegisterSessions={summerCampRegisterSessions}
        initialWaitlistRows={waitlistRows}
        initialChildrenLoadError={childrenLoadError}
        initialRegisterClassesError={registerClassesError}
        initialSummerCampRegisterSessionsError={summerCampRegisterSessionsError}
        initialWaitlistLoadError={waitlistLoadError}
      />
    </Suspense>
  );
}
