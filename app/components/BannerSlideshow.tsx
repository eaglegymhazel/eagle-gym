"use client";

import { useEffect, useState } from "react";

const banners = [
  "/brand/banner.png",
  "/brand/banner2.png",
  "/brand/banner3.png",
  "/brand/banner4.png",
];

export default function BannerSlideshow() {
  const [index, setIndex] = useState(0);
  const [isFading, setIsFading] = useState(false);
  const [nextIndex, setNextIndex] = useState(1);

  useEffect(() => {
    const id = window.setInterval(() => {
      const upcoming = (index + 1) % banners.length;
      setNextIndex(upcoming);
      setIsFading(true);
      window.setTimeout(() => {
        setIndex(upcoming);
        setIsFading(false);
      }, 500);
    }, 8000);
    return () => window.clearInterval(id);
  }, [index]);

  return (
    <section
      className="relative h-[21.75rem] w-full overflow-hidden"
      aria-label="Eagle Gymnastics Academy banner"
    >
      <div
        className="absolute inset-0 bg-center bg-cover bg-fixed transition-opacity duration-500"
        style={{ backgroundImage: `url('${banners[index]}')` }}
      />
      <div
        className={[
          "absolute inset-0 bg-center bg-cover bg-fixed transition-opacity duration-500",
          isFading ? "opacity-100" : "opacity-0",
        ].join(" ")}
        style={{ backgroundImage: `url('${banners[nextIndex]}')` }}
      />
    </section>
  );
}
