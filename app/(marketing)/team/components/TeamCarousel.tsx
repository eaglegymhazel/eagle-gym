"use client";

import Image from "next/image";
import * as Dialog from "@radix-ui/react-dialog";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import {
  useCallback,
  useMemo,
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
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);

  const selectedMember = useMemo(
    () => members.find((member) => member.id === selectedId) ?? null,
    [members, selectedId],
  );
  const displayMembers = useMemo(
    () => members,
    [members],
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
              onClick={() => {
                const rail = document.getElementById("coach-rail");
                if (!(rail instanceof HTMLDivElement)) return;
                rail.scrollBy({ left: -320, behavior: "smooth" });
              }}
              className="inline-flex h-11 w-11 items-center justify-center bg-white text-[#143271] transition duration-200 ease-out hover:-translate-y-0.5 hover:text-[#6c35c3] active:translate-y-[1px] active:scale-[0.96]"
              aria-label="Scroll coaches left"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => {
                const rail = document.getElementById("coach-rail");
                if (!(rail instanceof HTMLDivElement)) return;
                rail.scrollBy({ left: 320, behavior: "smooth" });
              }}
              className="inline-flex h-11 w-11 items-center justify-center bg-white text-[#143271] transition duration-200 ease-out hover:-translate-y-0.5 hover:text-[#6c35c3] active:translate-y-[1px] active:scale-[0.96]"
              aria-label="Scroll coaches right"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="overflow-hidden">
          <div
            id="coach-rail"
            className="flex items-start gap-4 overflow-x-auto pb-2 pr-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:gap-5 md:pr-0"
          >
            {displayMembers.map((member, index) => (
              <motion.button
                key={`${member.id}-${index}`}
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
                    className="fixed left-1/2 top-1/2 z-[81] max-h-[84vh] w-[min(860px,calc(100vw-24px))] -translate-x-1/2 -translate-y-1/2 overflow-hidden bg-white shadow-2xl focus:outline-none lg:h-[min(620px,78vh)]"
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
                          className="flex max-h-[84vh] flex-col overflow-y-auto lg:grid lg:h-full lg:max-h-none lg:grid-cols-[320px_minmax(0,1fr)] lg:overflow-hidden"
                        >
                          <div className="bg-[#f4effa]">
                            <div className="flex items-center justify-center px-4 py-5 lg:h-full">
                              <div className="w-full max-w-[300px] lg:h-full">
                                <Image
                                  src={selectedMember.photoUrl}
                                  alt={`${selectedMember.name} portrait`}
                                  width={selectedMember.imageWidth}
                                  height={selectedMember.imageHeight}
                                  className="h-auto w-full object-contain lg:h-full"
                                  sizes="(max-width: 1023px) 100vw, 300px"
                                />
                              </div>
                            </div>
                          </div>

                          <div className="relative flex min-h-0 flex-col px-5 py-6 sm:px-7 sm:py-7 lg:h-full">
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
