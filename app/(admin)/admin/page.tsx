import AdminShell from "./AdminShell";
import {
  getAdminChildrenDirectory,
  getAdminRegisterClasses,
  getAdminWaitlist,
  type AdminWaitlistRow,
} from "@/lib/server/adminDashboard";
import type { Child } from "@/components/admin/mockChildren";
import type { RegisterClassTemplate } from "@/components/admin/sessionBuild";

export default async function AdminPage() {
  let childrenData: Child[] = [];
  let registerClasses: RegisterClassTemplate[] = [];
  let waitlistRows: AdminWaitlistRow[] = [];
  let childrenLoadError: string | null = null;
  let registerClassesError: string | null = null;
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
    waitlistRows = await getAdminWaitlist();
  } catch (error) {
    waitlistLoadError = error instanceof Error ? error.message : "Unable to load waiting list.";
  }

  return (
    <AdminShell
      initialChildrenData={childrenData}
      initialRegisterClasses={registerClasses}
      initialWaitlistRows={waitlistRows}
      initialChildrenLoadError={childrenLoadError}
      initialRegisterClassesError={registerClassesError}
      initialWaitlistLoadError={waitlistLoadError}
    />
  );
}
