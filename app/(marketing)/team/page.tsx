"use client";

import TeamCarousel from "./components/TeamCarousel";
import Image from "next/image";
import * as Dialog from "@radix-ui/react-dialog";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useState } from "react";
import { teamMembers } from "./teamData";

const storyParagraphs = [
  "Eagle Gymnastics was founded by Hazel Watt, who first began running classes in 2001 across sports centres in Glasgow and Renfrewshire.",
  "In 2015, Hazel and her dad spent a full year preparing the club's purpose-built gym, creating the home that has helped Eagle Gymnastics grow from strength to strength ever since.",
  "A former squad gymnast, Hazel competed for Scotland as a youngster and continued to train and compete well into her 30s. That experience and passion still shape everything we do.",
  "We are proud of the strong family feel at the club. Every gymnast is encouraged to take part, enjoy the sport, and progress at a pace that suits them, whether they are a complete beginner or already more advanced.",
  "Our coaching team shares the same love for gymnastics and celebrates every step forward, from the first ring of the bell to the biggest competition milestone.",
  "We are proud to be affiliated with both the Independent Gymnastics Association (IGA) and National Gymnastics Association (NGA), giving our gymnasts access to competitions, structured pathways, coaching support, and wider opportunities across the UK and beyond.",
];

export default function TeamPage() {
  const [buildingOpen, setBuildingOpen] = useState(false);

  return (
    <main className="w-full bg-[#faf7fb]">
      <section className="mx-auto w-full max-w-[1380px] px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
        <div className="grid gap-10 px-1 py-2 sm:px-2 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:items-start">
          <div>
            <h1 className="text-[clamp(40px,5.4vw,76px)] font-extrabold leading-[0.94] tracking-[0.01em] text-[#143271]">
              Our Club Story
            </h1>
            <Dialog.Root open={buildingOpen} onOpenChange={setBuildingOpen}>
              <Dialog.Trigger asChild>
                <button
                  type="button"
                  className="mt-6 block w-full overflow-hidden bg-[#efe7fb] text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6c35c3] focus-visible:ring-offset-2 focus-visible:ring-offset-[#faf7fb]"
                  aria-label="Open larger image of the Eagle Gymnastics premises"
                >
                  <Image
                    src="/coaches/Building.jpg"
                    alt="Eagle Gymnastics premises"
                    width={1600}
                    height={1067}
                    className="h-auto w-full object-cover transition duration-200 hover:scale-[1.01]"
                    sizes="(max-width: 1023px) 100vw, 42vw"
                    priority
                  />
                </button>
              </Dialog.Trigger>
              <Dialog.Portal>
                <AnimatePresence>
                  {buildingOpen ? (
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
                          className="fixed left-1/2 top-1/2 z-[81] w-[min(760px,calc(100vw-24px))] -translate-x-1/2 -translate-y-1/2 overflow-hidden bg-white shadow-2xl focus:outline-none"
                          initial={{ opacity: 0, y: 18, scale: 0.985 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 18, scale: 0.985 }}
                          transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                        >
                          <Dialog.Close asChild>
                            <button
                              type="button"
                              className="absolute right-3 top-3 z-10 inline-flex h-10 w-10 items-center justify-center bg-white/92 text-[#143271] transition hover:text-[#6c35c3]"
                              aria-label="Close premises image"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </Dialog.Close>
                          <Dialog.Title className="sr-only">
                            Eagle Gymnastics premises
                          </Dialog.Title>
                          <div className="p-3 sm:p-4">
                            <Image
                              src="/coaches/Building.jpg"
                              alt="Eagle Gymnastics premises"
                              width={1600}
                              height={1067}
                              className="h-auto max-h-[66vh] w-full object-contain"
                              sizes="(max-width: 760px) 100vw, 760px"
                            />
                          </div>
                        </motion.div>
                      </Dialog.Content>
                    </>
                  ) : null}
                </AnimatePresence>
              </Dialog.Portal>
            </Dialog.Root>
          </div>

          <div className="space-y-5 pt-0 text-[15px] leading-8 text-[#2E2A33]/80 sm:text-base lg:pt-[86px]">
            {storyParagraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </div>

        <div className="mt-10">
          <TeamCarousel members={teamMembers} />
        </div>
      </section>
    </main>
  );
}
