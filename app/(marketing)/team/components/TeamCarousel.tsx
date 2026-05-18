"use client";

import Image from "next/image";
import * as Dialog from "@radix-ui/react-dialog";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { TeamMember } from "../types";

type TeamCarouselProps = {
  members: TeamMember[];
};

const slideVariants = {
  enter: (direction: 1 | -1) => ({
    x: direction > 0 ? 88 : -88,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: 1 | -1) => ({
    x: direction > 0 ? -88 : 88,
    opacity: 0,
  }),
};

export default function TeamCarousel({ members }: TeamCarouselProps) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const cardMeasureRef = useRef<HTMLButtonElement | null>(null);
  const touchStartXRef = useRef<number | null>(null);
  const resumeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const userInteractingRef = useRef(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [railIndex, setRailIndex] = useState(members.length);
  const [isAnimatingRail, setIsAnimatingRail] = useState(true);
  const [cardStride, setCardStride] = useState(320);

  const selectedMember = useMemo(
    () => members.find((member) => member.id === selectedId) ?? null,
    [members, selectedId],
  );
  const displayMembers = useMemo(
    () => [...members, ...members, ...members],
    [members],
  );

  const pauseAuto = useCallback(() => {
    userInteractingRef.current = true;
    if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
    resumeTimeoutRef.current = setTimeout(() => {
      userInteractingRef.current = false;
    }, 2400);
  }, []);

  const stepRail = useCallback(
    (step: 1 | -1) => {
      if (!members.length) return;
      pauseAuto();
      setIsAnimatingRail(true);
      setRailIndex((current) => current + step);
    },
    [members.length, pauseAuto],
  );

  const openMember = useCallback(
    (memberId: string) => {
      const index = members.findIndex((member) => member.id === memberId);
      setDirection(1);
      setSelectedIndex(index >= 0 ? index : 0);
      setSelectedId(memberId);
    },
    [members],
  );

  const moveSelection = useCallback(
    (nextDirection: 1 | -1) => {
      if (!members.length) return;
      const nextIndex =
        (selectedIndex + nextDirection + members.length) % members.length;
      setDirection(nextDirection);
      setSelectedIndex(nextIndex);
      setSelectedId(members[nextIndex]?.id ?? null);
    },
    [members, selectedIndex],
  );

  useEffect(() => {
    const measure = () => {
      const viewport = viewportRef.current;
      const sample = cardMeasureRef.current;
      if (!viewport || !sample) return;

      const viewportStyles = window.getComputedStyle(viewport);
      const gap = Number.parseFloat(viewportStyles.columnGap || viewportStyles.gap || "0");
      setCardStride(sample.getBoundingClientRect().width + gap);
    };

    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  useEffect(() => {
    if (!members.length) return;
    setRailIndex(members.length);
  }, [members.length]);

  useEffect(() => {
    if (!members.length) return;

    const intervalId = window.setInterval(() => {
      if (!userInteractingRef.current) {
        setIsAnimatingRail(true);
        setRailIndex((current) => current + 1);
      }
    }, 2800);

    return () => {
      window.clearInterval(intervalId);
      if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
    };
  }, [members.length]);

  const handleTrackTransitionEnd = () => {
    if (!members.length) return;

    if (railIndex >= members.length * 2) {
      setIsAnimatingRail(false);
      setRailIndex((current) => current - members.length);
      return;
    }

    if (railIndex < members.length) {
      setIsAnimatingRail(false);
      setRailIndex((current) => current + members.length);
      return;
    }
  };

  useEffect(() => {
    if (isAnimatingRail) return;
    const timer = window.setTimeout(() => {
      setIsAnimatingRail(true);
    }, 40);
    return () => window.clearTimeout(timer);
  }, [isAnimatingRail]);

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    pauseAuto();
    touchStartXRef.current = event.touches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    const startX = touchStartXRef.current;
    const endX = event.changedTouches[0]?.clientX ?? null;
    touchStartXRef.current = null;
    if (startX === null || endX === null) return;

    const delta = endX - startX;
    if (Math.abs(delta) < 32) return;
    stepRail(delta < 0 ? 1 : -1);
  };

  return (
    <>
      <section className="px-1 py-2">
        <div className="mb-3 flex items-end justify-between gap-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#6c35c3] md:hidden">
            Swipe to explore coaches
          </p>
          <div className="hidden items-center gap-2 md:flex">
            <button
              type="button"
              onClick={() => stepRail(-1)}
              className="inline-flex h-11 w-11 items-center justify-center bg-white text-[#143271] transition hover:text-[#6c35c3]"
              aria-label="Scroll coaches left"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => stepRail(1)}
              className="inline-flex h-11 w-11 items-center justify-center bg-white text-[#143271] transition hover:text-[#6c35c3]"
              aria-label="Scroll coaches right"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div
          className="overflow-hidden"
          onMouseEnter={pauseAuto}
          onWheel={pauseAuto}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div
            ref={viewportRef}
            className="flex items-start gap-4 pr-6 md:gap-5 md:pr-0"
            style={{
              transform: `translateX(-${railIndex * cardStride}px)`,
              transition: isAnimatingRail
                ? "transform 500ms cubic-bezier(0.22, 1, 0.36, 1)"
                : "none",
              willChange: "transform",
            }}
            onTransitionEnd={handleTrackTransitionEnd}
          >
            {displayMembers.map((member, index) => (
              <motion.button
                key={`${member.id}-${index}`}
                ref={index === 0 ? cardMeasureRef : undefined}
                type="button"
                onClick={() => openMember(member.id)}
                whileHover={{ y: -6 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className="group relative flex w-[240px] shrink-0 flex-col text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6c35c3] focus-visible:ring-offset-2 focus-visible:ring-offset-[#faf7fb] sm:w-[280px] lg:w-[300px]"
                aria-label={`Open profile for ${member.name}`}
              >
                <div className="flex h-[278px] items-end justify-center bg-white sm:h-[324px] lg:h-[347px]">
                  <Image
                    src={member.photoUrl}
                    alt={`${member.name} portrait`}
                    width={member.imageWidth}
                    height={member.imageHeight}
                    className="h-full w-full object-contain"
                    sizes="(max-width: 639px) 240px, (max-width: 1023px) 280px, 300px"
                  />
                </div>

                <div className="mt-3 min-h-[74px]">
                  <h3 className="text-[24px] font-extrabold leading-[1] tracking-[0.01em] text-[#143271] sm:text-[26px]">
                    {member.name}
                  </h3>
                  <p className="mt-1 text-xs font-bold uppercase tracking-[0.18em] text-[#6c35c3]">
                    {member.roleTitle}
                  </p>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      <Dialog.Root
        open={selectedMember !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedId(null);
        }}
      >
        <Dialog.Portal>
          <AnimatePresence>
            {selectedMember ? (
              <>
                <Dialog.Overlay forceMount asChild>
                  <motion.div
                    className="fixed inset-0 z-[80] bg-[#120a22]/52 backdrop-blur-[2px]"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.22, ease: "easeOut" }}
                  />
                </Dialog.Overlay>
                <Dialog.Content forceMount asChild>
                  <motion.div
                    className="fixed left-1/2 top-1/2 z-[81] h-[min(620px,78vh)] w-[min(860px,calc(100vw-24px))] -translate-x-1/2 -translate-y-1/2 overflow-hidden bg-white shadow-2xl focus:outline-none"
                    initial={{ opacity: 0, y: 18, scale: 0.985 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 18, scale: 0.985 }}
                    transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <AnimatePresence mode="wait" custom={direction}>
                      <motion.div
                        key={selectedMember.id}
                        custom={direction}
                        variants={slideVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                        className="grid h-full lg:grid-cols-[320px_minmax(0,1fr)]"
                      >
                        <div className="bg-[#f4effa]">
                          <div className="flex h-full items-center justify-center px-4 py-5">
                            <div className="h-full w-full max-w-[300px]">
                              <Image
                                src={selectedMember.photoUrl}
                                alt={`${selectedMember.name} portrait`}
                                width={selectedMember.imageWidth}
                                height={selectedMember.imageHeight}
                                className="h-full w-full object-contain"
                                sizes="(max-width: 1023px) 100vw, 300px"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="relative flex h-full flex-col px-5 py-6 sm:px-7 sm:py-7">
                          <Dialog.Close asChild>
                            <button
                              type="button"
                              className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center bg-white text-[#143271] transition hover:text-[#6c35c3]"
                              aria-label="Close coach profile"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </Dialog.Close>

                          <Dialog.Title className="pr-12 text-[clamp(30px,4vw,46px)] font-extrabold leading-[0.98] tracking-[0.01em] text-[#143271]">
                            {selectedMember.name}
                          </Dialog.Title>
                          <p className="mt-2 text-sm font-bold uppercase tracking-[0.12em] text-[#6c35c3]">
                            {selectedMember.roleTitle}
                          </p>
                          <div className="mt-5 min-h-0 flex-1 overflow-y-auto pr-2">
                            <p className="max-w-3xl text-[14px] leading-7 text-[#2E2A33]/80 sm:text-[15px]">
                              {selectedMember.bio}
                            </p>
                          </div>

                          <div className="mt-6 flex items-center justify-between gap-3 border-t border-[#ece3f4] pt-4">
                            <button
                              type="button"
                              onClick={() => moveSelection(-1)}
                              className="inline-flex items-center gap-2 bg-white px-4 py-3 text-sm font-bold uppercase tracking-[0.08em] text-[#143271] transition hover:text-[#6c35c3]"
                            >
                              <ChevronLeft className="h-4 w-4" />
                              Previous
                            </button>
                            <button
                              type="button"
                              onClick={() => moveSelection(1)}
                              className="inline-flex items-center gap-2 bg-white px-4 py-3 text-sm font-bold uppercase tracking-[0.08em] text-[#143271] transition hover:text-[#6c35c3]"
                            >
                              Next
                              <ChevronRight className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    </AnimatePresence>
                  </motion.div>
                </Dialog.Content>
              </>
            ) : null}
          </AnimatePresence>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
