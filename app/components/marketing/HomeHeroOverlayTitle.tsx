"use client";

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

  return null;
}
