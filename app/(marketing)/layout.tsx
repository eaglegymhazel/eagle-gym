import BannerSlideshow from "../components/BannerSlideshow";
import SiteShell from "../components/layout/SiteShell";

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
              "linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.08) 55%, rgba(0,0,0,0.14) 100%)",
          }}
        />
        <div className="group absolute inset-0 z-10 flex flex-col items-center justify-center -translate-y-[75px] text-center">
          <div className="flex max-w-[480px] flex-col items-center gap-5">
            <img
              src="/brand/overlay.png"
              alt=""
              className="slogan-bounce pointer-events-auto block h-auto w-[320px] max-w-[85vw] translate-y-[85px] group-hover:animate-[slogan-wobble_500ms_ease-in-out]"
            />
              <a
                href="/account"
              className="group relative inline-flex min-h-[56px] items-center justify-center rounded-full border-[4px] border-[#6c35c3] bg-white px-12 py-2 text-base font-semibold uppercase tracking-[0.1em] text-[#16326f] shadow-[0_5px_0_rgba(107,91,255,0.35)] transition-all duration-200 ease-out hover:-translate-y-[2px] hover:bg-[#f2ecff] hover:border-[#5a30c7] hover:shadow-[0_3px_0_rgba(107,91,255,0.22)] active:translate-y-[1px] active:shadow-[0_2px_0_rgba(107,91,255,0.3)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6c35c3] focus-visible:ring-offset-4"
            >
              <span className="cta-text">Book now</span>
              <span
                className="pointer-events-none absolute -top-3 -right-3 h-7 w-7 text-[#ffeb3b]"
                aria-hidden="true"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-full w-full"
                  fill="#ffeb3b"
                  aria-hidden="true"
                >
                  <path d="M12 2.5l2.72 5.51 6.08.88-4.4 4.29 1.04 6.06L12 16.9l-5.44 2.34 1.04-6.06-4.4-4.29 6.08-.88L12 2.5z" />
                </svg>
              </span>
            </a>
          </div>
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
