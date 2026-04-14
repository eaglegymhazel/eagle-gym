import BannerSlideshow from "../components/BannerSlideshow";
import SiteShell from "../components/layout/SiteShell";
import HomeOnlyTagline from "../components/marketing/HomeOnlyTagline";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SiteShell>
      <BannerSlideshow />
      <HomeOnlyTagline />
      {children}
    </SiteShell>
  );
}
