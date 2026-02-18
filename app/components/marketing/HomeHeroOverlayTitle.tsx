"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { Barlow_Condensed } from "next/font/google";

const barlowCondensed = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["600", "700"],
});

export default function HomeHeroOverlayTitle() {
  const pathname = usePathname();
  if (pathname !== "/" && pathname !== "/team") return null;

  if (pathname === "/team") {
    return (
      <div className="pointer-events-none mb-2 px-4 text-center">
        <h1
          className={`${barlowCondensed.className} text-[clamp(34px,5.8vw,64px)] font-bold tracking-[0.01em] text-[#650f8b]`}
          style={{
            fontFamily:
              '"D-DIN Condensed", "DIN Condensed", "Barlow Condensed", "Arial Narrow", sans-serif',
          }}
        >
          Meet The Team
        </h1>
      </div>
    );
  }

  return (
    <div className="pointer-events-none mt-2 mb-2 px-4 text-center sm:mt-3 sm:mb-3">
      <Image
        src="/brand/overlay.png"
        alt="Welcome to Eagle Gymnastics"
        width={880}
        height={260}
        priority
        className="mx-auto h-auto w-[min(58vw,450px)] object-contain drop-shadow-[0_10px_20px_rgba(18,10,35,0.25)]"
      />
    </div>
  );
}
