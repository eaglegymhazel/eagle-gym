"use client";

import Link from "next/link";
import { Barlow_Condensed } from "next/font/google";
import { useEffect, useState } from "react";

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
  const [activeIndex, setActiveIndex] = useState(0);

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
        className="pointer-events-none absolute inset-y-0 left-0 z-[5] w-[68%] bg-[#6c35c3]/72 [clip-path:polygon(0_0,82%_0,60%_100%,0_100%)]"
        aria-hidden="true"
      />

      <div className="absolute left-6 top-1/2 z-10 max-w-[18rem] -translate-y-1/2 text-[#f9f6fa] sm:left-8 md:max-w-[24rem] lg:left-16">
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
          href="/account"
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
    </section>
  );
}
