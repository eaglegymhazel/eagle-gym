"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Barlow_Condensed } from "next/font/google";
import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { useAuth } from "./auth/AuthProvider";

const barlowCondensed = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["600", "700"],
});

const slides = [
  "/brand/img1.JPG",
  "/brand/img18.JPG",
  "/brand/img17.webp",
  "/brand/img19.JPG",
] as const;

export default function BannerSlideshow() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [activeIndex, setActiveIndex] = useState(0);
  const isLoggedIn = Boolean(user?.email);
  const showSummerCampPromo = pathname !== "/members";
  const showAffiliationBadges = pathname !== "/members";
  const primaryBookingHref = isLoggedIn ? "/book" : "/login?redirect=/book";
  const summerCampHref = isLoggedIn
    ? "/summer-camps/2026/book"
    : "/login?redirect=/summer-camps/2026/book";

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % slides.length);
    }, 4500);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <section
      className="relative flex h-[22rem] w-full items-center justify-center overflow-hidden bg-[#faf7fb] px-4"
      aria-label="Eagle Gymnastics Academy"
    >
      {slides.map((src, index) => (
        <div
          key={src}
          className={[
            "absolute inset-0 bg-cover bg-no-repeat transition-opacity duration-700 ease-out md:bg-fixed",
            index === activeIndex ? "opacity-100" : "opacity-0",
          ].join(" ")}
          style={{
            backgroundImage: `url('${src}')`,
            backgroundPosition: "center 72%",
          }}
          aria-hidden="true"
        />
      ))}

      <div
        className="pointer-events-none absolute inset-y-0 left-0 z-[5] w-[78%] bg-[#6c35c3]/76 [clip-path:polygon(0_0,90%_0,70%_100%,0_100%)] sm:hidden"
        aria-hidden="true"
      />

      <div
        className="pointer-events-none absolute inset-y-0 left-0 z-[5] hidden w-[68%] bg-[#6c35c3]/72 [clip-path:polygon(0_0,82%_0,60%_100%,0_100%)] sm:block"
        aria-hidden="true"
      />

      <div className="absolute left-5 top-[60%] z-10 max-w-[14rem] -translate-y-1/2 text-[#f9f6fa] sm:left-8 sm:top-1/2 sm:max-w-[18rem] md:max-w-[24rem] lg:left-16">
        <p
          className={`${barlowCondensed.className} text-[34px] font-bold leading-[0.94] text-[#f9f6fa] sm:text-[44px] md:text-[56px]`}
          style={{
            fontFamily:
              '"D-DIN Condensed", "DIN Condensed", "Barlow Condensed", "Arial Narrow", sans-serif',
          }}
        >
          Eagle
          <br />
          Gymnastics
        </p>
        <p className="mt-3 text-sm font-bold uppercase leading-none text-[#f9f6fa] sm:text-base">
          Academy
        </p>
        <p className="mt-4 max-w-[18rem] text-base font-semibold leading-snug text-[#f9f6fa]/92 sm:max-w-[22rem] sm:text-lg">
          Build strength, confidence, and joy through movement
        </p>
        <Link
          href={primaryBookingHref}
          className="group relative mt-6 inline-flex min-h-[58px] items-center justify-center gap-2.5 overflow-hidden rounded-full border-2 border-[#f9f6fa] bg-[#f9f6fa]/92 bg-[linear-gradient(90deg,#6f3bc9,#6c35c3,#5f2eb6)] [background-position:left_center] [background-repeat:no-repeat] [background-size:0%_100%] px-9 py-3 text-sm font-bold uppercase tracking-[0.08em] text-[#2a0c4f] shadow-[0_10px_26px_-16px_rgba(24,14,39,0.65)] backdrop-blur-[2px] transition-[transform,border-color,box-shadow,background-size,color] duration-320 ease-out hover:-translate-y-[2px] hover:border-[#f9f6fa] hover:[background-size:100%_100%] hover:shadow-[0_14px_30px_-18px_rgba(24,14,39,0.75)] active:translate-y-[1px] active:shadow-[0_8px_20px_-14px_rgba(24,14,39,0.55)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f9f6fa]/70 focus-visible:ring-offset-4 sm:min-h-[64px] sm:px-12 sm:text-base"
        >
          <span className="relative z-10 text-[#2a0c4f] transition-colors duration-300 ease-out group-hover:text-white">
            Book now
          </span>
          <span
            className="relative z-10 text-base leading-none text-[#2a0c4f] transition-[transform,color] duration-320 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-0.5 group-hover:scale-125 group-hover:rotate-90 group-hover:text-white"
            aria-hidden="true"
          >
            &gt;
          </span>
          <span
            className="pointer-events-none absolute right-2.5 top-1.5 z-10 inline-flex h-4 w-4 scale-75 items-center justify-center text-[#ffd24a] opacity-0 transition-[opacity,transform] duration-220 ease-out delay-220 group-hover:scale-100 group-hover:opacity-100"
            aria-hidden="true"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4 fill-current"
              aria-hidden="true"
            >
              <path d="M12 2.5l2.72 5.51 6.08.88-4.4 4.29 1.04 6.06L12 16.9l-5.44 2.34 1.04-6.06-4.4-4.29 6.08-.88L12 2.5z" />
            </svg>
          </span>
        </Link>
      </div>

      {showSummerCampPromo ? (
        <>
          <div className="absolute left-3 right-3 top-3 z-20 sm:hidden">
            <div className="overflow-hidden rounded-[16px] border border-[#ffb7c3] bg-[linear-gradient(90deg,rgba(150,19,45,0.96)_0%,rgba(194,28,63,0.96)_50%,rgba(228,68,87,0.96)_100%)] bg-clip-padding px-2.5 py-2 text-white shadow-[0_16px_28px_-20px_rgba(92,16,32,0.68)] backdrop-blur-sm">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[9px] font-black uppercase tracking-[0.14em] text-white/78">
                    Summer Camp 2026
                  </p>
                  <p className="mt-0.5 text-[12px] font-semibold leading-4 text-white">
                    Bookings now available. 6th July to 31st July.
                  </p>
                </div>

                <Link
                  href={summerCampHref}
                  className="group relative inline-flex h-8 shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full border border-white/70 bg-[#fff4f6]/95 px-3 text-[9px] font-black uppercase tracking-[0.08em] text-[#991b3d] shadow-[0_10px_22px_-16px_rgba(92,16,32,0.48)] transition-[transform,border-color,box-shadow,background-size,color] duration-320 ease-out hover:-translate-y-[2px] hover:border-white/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                >
                  <span className="relative z-10 whitespace-nowrap transition-colors duration-300 ease-out">
                    Book Camp
                  </span>
                  <ArrowRight
                    className="relative z-10 h-2.5 w-2.5 transition-[transform,color] duration-320 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </Link>
              </div>
            </div>
          </div>

          <div className="absolute right-5 top-5 z-20 hidden w-[23rem] sm:block lg:right-8 lg:top-8 lg:w-[26rem]">
            <div className="overflow-hidden rounded-[20px] border border-[#ffb7c3] bg-[linear-gradient(90deg,rgba(150,19,45,0.96)_0%,rgba(194,28,63,0.96)_50%,rgba(228,68,87,0.96)_100%)] bg-clip-padding px-4 py-3.5 text-white shadow-[0_18px_34px_-22px_rgba(92,16,32,0.68)] backdrop-blur-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                <div className="min-w-0">
                  <p className="text-[11px] font-black uppercase tracking-[0.14em] text-white/78">
                    Summer Camp 2026
                  </p>
                  <p className="mt-1 text-sm font-semibold leading-5 text-white sm:text-[15px]">
                    Bookings now available. 6th July to 31st July.
                  </p>
                </div>

                <Link
                  href={summerCampHref}
                  className="group relative inline-flex h-10 shrink-0 items-center justify-center gap-1.5 overflow-hidden rounded-full border border-white/70 bg-[#fff4f6]/95 bg-[linear-gradient(90deg,#a91f42,#c62855,#e44d6f)] [background-position:left_center] [background-repeat:no-repeat] [background-size:0%_100%] px-4 text-[11px] font-black uppercase tracking-[0.08em] text-[#991b3d] shadow-[0_10px_22px_-16px_rgba(92,16,32,0.48)] transition-[transform,border-color,box-shadow,background-size,color] duration-320 ease-out hover:-translate-y-[2px] hover:border-white/80 hover:[background-size:100%_100%] hover:shadow-[0_14px_28px_-18px_rgba(92,16,32,0.58)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 sm:px-4"
                >
                  <span className="relative z-10 transition-colors duration-300 ease-out group-hover:text-white">
                    {isLoggedIn ? "Book Summer Camp" : "Login to Book"}
                  </span>
                  <ArrowRight
                    className="relative z-10 h-3.5 w-3.5 transition-[transform,color] duration-320 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-0.5 group-hover:text-white"
                    aria-hidden="true"
                  />
                </Link>
              </div>
            </div>
          </div>
        </>
      ) : null}

      {showAffiliationBadges ? (
        <>
          <div className="absolute bottom-2 right-2 z-20 sm:hidden">
            <div className="flex items-center gap-1.5">
              <Image
                src="/brand/NGA_logo.jpg"
                alt="National Gymnastics Association"
                width={708}
                height={679}
                unoptimized
                className="h-5 w-auto object-contain"
              />
              <Image
                src="/brand/IGA_logo.jpg"
                alt="Independent Gymnastics Association"
                width={733}
                height={89}
                unoptimized
                className="h-3.5 w-auto object-contain"
              />
            </div>
          </div>

          <div className="absolute bottom-4 right-4 z-20 hidden sm:block lg:bottom-5 lg:right-5">
            <div className="flex items-center gap-2.5">
              <Image
                src="/brand/NGA_logo.jpg"
                alt="National Gymnastics Association"
                width={708}
                height={679}
                unoptimized
                className="h-10 w-auto object-contain"
              />
              <Image
                src="/brand/IGA_logo.jpg"
                alt="Independent Gymnastics Association"
                width={733}
                height={89}
                unoptimized
                className="h-5 w-auto object-contain"
              />
            </div>
          </div>
        </>
      ) : null}
    </section>
  );
}
