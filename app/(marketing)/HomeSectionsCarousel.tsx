"use client";

import Image from "next/image";
import Link from "next/link";

type HomeSection = {
  title: string;
  copy: string;
  cta: string;
  href: string;
  image: string;
  tone: string;
};

export default function HomeSectionsCarousel({
  sections,
  activeIndex,
  onPrevious,
  onNext,
  onInteract,
}: {
  sections: HomeSection[];
  activeIndex: number;
  onPrevious: () => void;
  onNext: () => void;
  onInteract: () => void;
}) {
  return (
    <section
      className="relative w-full overflow-hidden"
      onPointerDown={onInteract}
    >
      <div
        className="flex transition-transform duration-500 ease-out"
        style={{ transform: `translateX(-${activeIndex * 100}%)` }}
      >
        {sections.map((section, index) => {
          const isEven = index % 2 === 0;

          return (
            <article
              key={section.title}
              className="grid min-h-[48vh] w-full shrink-0 grid-cols-1 md:grid-cols-2"
              aria-hidden={index !== activeIndex}
            >
              <div
                className={[
                  "relative min-h-[240px] overflow-hidden md:min-h-full",
                  isEven ? "order-1" : "order-1 md:order-2",
                ].join(" ")}
              >
                <div
                  className="absolute inset-0 hidden bg-fixed bg-cover bg-center bg-no-repeat md:block"
                  style={{ backgroundImage: `url('${section.image}')` }}
                  aria-hidden="true"
                />
                <div className="absolute inset-0 md:hidden">
                  <Image
                    src={section.image}
                    alt={section.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw"
                    priority={index === 0}
                  />
                </div>
              </div>
              <div
                className={[
                  "flex items-center",
                  section.tone,
                  isEven ? "order-2" : "order-2 md:order-1",
                ].join(" ")}
              >
                <div className="w-full px-8 py-10 sm:px-12 lg:px-16">
                  <h2 className="text-3xl font-extrabold tracking-wide sm:text-4xl">
                    {section.title}
                  </h2>
                  <p className="mt-4 max-w-md text-base leading-relaxed sm:text-lg">
                    {section.copy}
                  </p>
                  <Link
                    href={section.href}
                    className="mt-6 inline-flex items-center justify-center rounded-full border border-[#2E2A33] px-6 py-3 text-sm font-semibold tracking-wide transition hover:-translate-y-0.5 hover:bg-[#2E2A33] hover:text-white"
                    onClick={onInteract}
                  >
                    {section.cta}
                  </Link>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <button
        type="button"
        onClick={onPrevious}
        aria-label="Previous section"
        className="absolute left-3 top-1/2 z-10 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center text-[#2E2A33]/60 transition hover:text-[#2E2A33]/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6c35c3]/45"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-8 w-8"
          aria-hidden="true"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>
      <button
        type="button"
        onClick={onNext}
        aria-label="Next section"
        className="absolute right-3 top-1/2 z-10 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center text-[#2E2A33]/60 transition hover:text-[#2E2A33]/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6c35c3]/45"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-8 w-8"
          aria-hidden="true"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M9 18l6-6-6-6" />
        </svg>
      </button>

    </section>
  );
}
