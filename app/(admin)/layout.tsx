import { redirect } from "next/navigation";
import SiteShell from "../components/layout/SiteShell";
import { getCurrentUserWebAccountRole, isAdminRole } from "@/lib/server/webAccountRole";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const access = await getCurrentUserWebAccountRole();

  if (access.status === "unauthorized") {
    redirect("/login");
  }

  if (!isAdminRole(access.role)) {
    redirect("/account");
  }

  return (
    <SiteShell
      disableMobileNavMenu
      mobileRightLink={{ href: "/", label: "Exit Admin Portal" }}
    >
      <div className="pt-8">{children}</div>
    </SiteShell>
  );
}
