"use client";

import { useEffect, useRef, useState } from "react";
import ReviewsSlider from "../components/ReviewsSlider";
import HomeSectionsCarousel from "./HomeSectionsCarousel";

const sections = [
  {
    title: "CLASSES",
    copy: "Founded by an experienced former squad gymnast, the club offers a safe, well-equipped environment for both recreational and competitive gymnastics, with a strong sense of community at its heart.",
    cta: "View Timetable",
    href: "/timetable",
    image: "/brand/placeholderImg/test3.png",
    tone: "bg-[#f7e9ff] text-[#2E2A33]",
  },
  {
    title: "COMPETITION",
    copy: "The Competition group, is for gymnasts who would like to compete at  floor and vault with the opportunity to progress into 4 piece competitions on the Bars, Beam, Floor and Vault. This section is invite only, once in the group there are many fun opportunities to take part in competitions, training days with other clubs and also a weekend training at Inverclyde national sports centre.",
    cta: "BOOK NOW",
    href: "/contact",
    image: "/brand/placeholderImg/test2.png",
    tone: "bg-[#e9f6ff] text-[#2E2A33]",
  },
  {
    title: "PRE-SCHOOL CLASSES",
    copy: "These classes are aimed at developing social and practical skills such as balance, co-ordination, strength & flexibility. They also enable children to develop creativity while interacting with other children in a fun, safe environment.",
    cta: "OUR PATHWAY",
    href: "/team",
    image: "/brand/placeholderImg/test4.png",
    tone: "bg-[#ffe8f4] text-[#2E2A33]",
  },
  {
    title: "MEMBERS",
    copy: "Exclusive video library and technique tips to help gymnasts practise safely at home.",
    cta: "VIEW RESOURCES",
    href: "/members",
    image: "/brand/placeholderImg/test1.png",
    tone: "bg-[#f3e7ff] text-[#2E2A33]",
  },
];

const AUTO_ADVANCE_MS = 5000;
const INTERACTION_PAUSE_MS = 20000;

export default function Home() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const pauseTimeoutRef = useRef<number | null>(null);

  const goToIndex = (target: number) => {
    const nextIndex = (target + sections.length) % sections.length;
    setActiveIndex(nextIndex);
  };

  const markInteracted = () => {
    setIsPaused(true);
    if (pauseTimeoutRef.current !== null) {
      window.clearTimeout(pauseTimeoutRef.current);
    }
    pauseTimeoutRef.current = window.setTimeout(() => {
      setIsPaused(false);
      pauseTimeoutRef.current = null;
    }, INTERACTION_PAUSE_MS);
  };

  const previous = () => {
    markInteracted();
    goToIndex(activeIndex - 1);
  };

  const next = () => {
    markInteracted();
    goToIndex(activeIndex + 1);
  };

  useEffect(() => {
    const interval = window.setInterval(() => {
      if (isPaused) return;
      setActiveIndex((prev) => (prev === sections.length - 1 ? 0 : prev + 1));
    }, AUTO_ADVANCE_MS);
    return () => window.clearInterval(interval);
  }, [isPaused]);

  useEffect(() => {
    return () => {
      if (pauseTimeoutRef.current !== null) {
        window.clearTimeout(pauseTimeoutRef.current);
      }
    };
  }, []);

  return (
    <main className="w-full">
      <section className="w-full bg-[#f7f4fb]">
        <div className="mx-auto max-w-6xl px-4 pt-[40px] pb-[40px] sm:px-6 md:pt-[40px] md:pb-[40px]">
          <div className="grid grid-cols-1 items-start gap-8 md:grid-cols-[2fr_3fr] md:gap-12">
            <div className="text-left text-[#2E2A33]">
              <div className="mb-4 h-[3px] w-12 rounded-full bg-[#6c35c3]" />
              <h2 className="text-[clamp(32px,3vw,44px)] font-extrabold tracking-[-0.02em] leading-[1.1]">
                Build confidence, strength, and a love of movement
              </h2>
              <p className="mt-3 text-sm font-semi-bold uppercase tracking-[0.06em] text-[#2E2A33]/70">
                A supportive space for every gymnast to grow and progress.
              </p>
            </div>
            <div className="text-left mt-[24px]">
              <p className="max-w-[60ch] text-[16px] leading-[1.6] text-[#2E2A33]/75 sm:text-[17px]">
                Our gymnastics classes are a positive, supportive space for young people of all ages and abilities. From beginners taking their first steps to more experienced gymnasts building skills and confidence, every class is designed to help each individual progress at their own pace.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="w-full bg-[#f7f4fb]">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-4 pb-4 sm:px-6">
          <div className="h-px w-full bg-gradient-to-r from-transparent via-[#6c35c3]/28 to-transparent" />
          <div className="flex items-center gap-2">
            {sections.map((section, index) => {
              const isActive = index === activeIndex;
              return (
                <button
                  key={`dot-${section.title}`}
                  type="button"
                  aria-label={`Go to ${section.title}`}
                  aria-current={isActive ? "true" : undefined}
                  onClick={() => {
                    markInteracted();
                    goToIndex(index);
                  }}
                  className={[
                    "h-2.5 w-2.5 rounded-full border transition",
                    isActive
                      ? "border-[#6c35c3] bg-[#6c35c3]"
                      : "border-[#6c35c3]/35 bg-white/75 hover:bg-white",
                  ].join(" ")}
                />
              );
            })}
          </div>
        </div>
      </section>

      <HomeSectionsCarousel
        sections={sections}
        activeIndex={activeIndex}
        onPrevious={previous}
        onNext={next}
        onInteract={markInteracted}
      />

      <section className="w-full bg-[#f3ecf7] px-6 py-16 text-center">
        <div className="mx-auto max-w-3xl">
          <div>
            <ReviewsSlider />
          </div>
        </div>
      </section>
    </main>
  );
}
