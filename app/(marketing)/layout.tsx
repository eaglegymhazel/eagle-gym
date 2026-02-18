import BannerSlideshow from "../components/BannerSlideshow";
import SiteShell from "../components/layout/SiteShell";
import HomeHeroOverlayTitle from "../components/marketing/HomeHeroOverlayTitle";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SiteShell>
      <div className="relative pb-0">
        <BannerSlideshow />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(circle at center, rgba(24,14,39,0.14) 0%, rgba(24,14,39,0.06) 34%, rgba(24,14,39,0) 68%), linear-gradient(to bottom, rgba(0,0,0,0) 62%, rgba(0,0,0,0.06) 100%)",
          }}
        />
        <div className="group absolute inset-0 z-10 flex items-center justify-center -translate-y-10 text-center sm:-translate-y-12">
          <HomeHeroOverlayTitle />
        </div>
        <div className="absolute inset-x-0 bottom-12 z-10 flex justify-center">
          <a
            href="/account"
            className="group relative inline-flex min-h-[54px] items-center justify-center gap-2 rounded-full border-2 border-[#6c35c3]/85 bg-white/84 px-10 py-2 text-sm font-bold uppercase tracking-[0.08em] text-[#2a0c4f] shadow-[0_10px_26px_-16px_rgba(77,42,139,0.65)] backdrop-blur-[2px] transition-all duration-200 ease-out hover:-translate-y-[2px] hover:border-[#5a30c7] hover:bg-white/92 hover:shadow-[0_14px_30px_-18px_rgba(88,49,160,0.75)] active:translate-y-[1px] active:shadow-[0_8px_20px_-14px_rgba(88,49,160,0.55)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6c35c3]/60 focus-visible:ring-offset-4"
          >
            <span className="cta-text">Book now</span>
            <span
              className="text-base leading-none transition-transform duration-200 group-hover:translate-x-0.5"
              aria-hidden="true"
            >
              ›
            </span>
            <span
              className="pointer-events-none absolute -top-2 -right-2 h-5 w-5 text-[#ffcf4a] opacity-75"
              aria-hidden="true"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-full w-full"
                fill="#ffcf4a"
                aria-hidden="true"
              >
                <path d="M12 2.5l2.72 5.51 6.08.88-4.4 4.29 1.04 6.06L12 16.9l-5.44 2.34 1.04-6.06-4.4-4.29 6.08-.88L12 2.5z" />
              </svg>
            </span>
          </a>
        </div>
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-[10px]"
          style={{
            background:
              "linear-gradient(to bottom, rgba(247,244,251,0) 40%, #f7f4fb 100%)",
          }}
        />
      </div>
      {children}
    </SiteShell>
  );
}
