import type { Metadata } from "next";
import SiteShell from "../components/layout/SiteShell";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SiteShell>
      <div className="pt-8">{children}</div>
    </SiteShell>
  );
}
