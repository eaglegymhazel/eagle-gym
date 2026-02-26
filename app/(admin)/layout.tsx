import SiteShell from "../components/layout/SiteShell";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SiteShell
      disableMobileNavMenu
      mobileRightLink={{ href: "/", label: "Exit Admin Portal" }}
    >
      <div className="pt-8">{children}</div>
    </SiteShell>
  );
}
