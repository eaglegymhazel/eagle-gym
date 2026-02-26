import AdminShell from "./AdminShell";
import { getAdminChildrenDirectory, getAdminRegisterClasses } from "@/lib/server/adminDashboard";
import type { Child } from "@/components/admin/mockChildren";
import type { RegisterClassTemplate } from "@/components/admin/sessionBuild";

export default async function AdminPage() {
  let childrenData: Child[] = [];
  let registerClasses: RegisterClassTemplate[] = [];
  let childrenLoadError: string | null = null;
  let registerClassesError: string | null = null;

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

  return (
    <AdminShell
      initialChildrenData={childrenData}
      initialRegisterClasses={registerClasses}
      initialChildrenLoadError={childrenLoadError}
      initialRegisterClassesError={registerClassesError}
    />
  );
}
