"use client";

import { usePathname } from "next/navigation";

export default function HomeOnlyTagline() {
  const pathname = usePathname();

  if (pathname !== "/") return null;

  return (
    <section className="bg-[#faf7fb] px-6 py-8 text-center md:py-10">
      <p className="mx-auto max-w-4xl text-[clamp(22px,2.6vw,34px)] font-extrabold leading-tight tracking-[0.01em] text-[#143271]">
        Helping to build confidence, coordination, and a lifelong love of
        movement.
      </p>
    </section>
  );
}
