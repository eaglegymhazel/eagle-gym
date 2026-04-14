"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import type { TeamMember } from "../types";

type FeaturedProfileCardProps = {
  member: TeamMember;
  onOpen: (memberId: string, trigger: HTMLElement) => void;
  reducedMotion: boolean;
};

export default function FeaturedProfileCard({
  member,
  onOpen,
  reducedMotion,
}: FeaturedProfileCardProps) {
  return (
    <section className="my-12">
      <button
        type="button"
        onClick={(event) => onOpen(member.id, event.currentTarget)}
        className="group block w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6c35c3] focus-visible:ring-offset-2 focus-visible:ring-offset-[#faf7fb]"
        aria-label={`View profile for ${member.name}`}
      >
        <motion.div
          layoutId={`team-card-${member.id}`}
          transition={
            reducedMotion
              ? { duration: 0.15 }
              : { type: "spring", stiffness: 350, damping: 34, mass: 0.7 }
          }
          whileHover={reducedMotion ? undefined : { y: -2 }}
          className="grid overflow-hidden rounded-lg border border-[#6c35c3]/18 bg-white shadow-[0_18px_42px_-32px_rgba(45,26,78,0.5)] md:grid-cols-[minmax(0,0.72fr)_minmax(0,1.28fr)]"
        >
          <div className="flex items-center justify-center bg-[#f3ecfb] px-6 py-8">
            <motion.div
              layoutId={`team-photo-${member.id}`}
              className="relative aspect-[4/5] w-full max-w-[180px] overflow-hidden rounded-lg bg-[#faf7fb]"
            >
              <Image
                src={member.photoUrl}
                alt={`${member.name} portrait`}
                fill
                className="object-contain transition duration-200 ease-out group-hover:scale-[1.015]"
                sizes="180px"
                priority
              />
            </motion.div>
          </div>

          <div className="flex flex-col justify-center p-6 sm:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#6c35c3]">
              Head Coach
            </p>
            <motion.h2
              layoutId={`team-name-${member.id}`}
              className="mt-3 text-[clamp(34px,4vw,54px)] font-extrabold leading-[0.98] tracking-[0.01em] text-[#143271]"
            >
              {member.name}
            </motion.h2>
            <motion.p
              layoutId={`team-role-${member.id}`}
              className="mt-2 text-base font-bold text-[#6c35c3]"
            >
              {member.roleTitle}
            </motion.p>
            <p className="mt-5 max-w-2xl text-base leading-8 text-[#2E2A33]/76">
              Leading a supportive coaching environment where gymnasts can
              develop confidence, coordination, and safe technique over time.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {member.qualifications.slice(0, 4).map((item) => (
                <span
                  key={item}
                  className="rounded-md border border-[#6c35c3]/20 bg-[#f8f3ff] px-3 py-1 text-xs font-semibold text-[#45276f]"
                >
                  {item}
                </span>
              ))}
            </div>
            <span className="mt-6 inline-flex w-fit rounded-md border border-[#2E2A33] bg-white/55 px-5 py-2.5 text-xs font-bold uppercase tracking-[0.08em] text-[#2E2A33] transition group-hover:-translate-y-0.5 group-hover:bg-[#2E2A33] group-hover:text-white">
              View profile
            </span>
          </div>
        </motion.div>
      </button>
    </section>
  );
}
