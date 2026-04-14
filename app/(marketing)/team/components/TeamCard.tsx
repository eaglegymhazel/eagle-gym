"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import type { TeamMember } from "../types";

type TeamCardProps = {
  member: TeamMember;
  onOpen: (memberId: string, trigger: HTMLElement) => void;
  reducedMotion: boolean;
};

export default function TeamCard({
  member,
  onOpen,
  reducedMotion,
}: TeamCardProps) {
  return (
    <button
      type="button"
      onClick={(event) => onOpen(member.id, event.currentTarget)}
      className="group relative w-full rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6c35c3] focus-visible:ring-offset-2 focus-visible:ring-offset-[#faf7fb]"
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
        whileTap={reducedMotion ? undefined : { scale: 0.995 }}
        className="h-full rounded-lg border border-[#6c35c3]/15 bg-white p-4 shadow-[0_14px_30px_-24px_rgba(45,26,78,0.42)] transition-colors duration-200 group-hover:border-[#6c35c3]/35"
      >
        <div className="mx-auto flex h-[170px] w-full max-w-[150px] items-end justify-center rounded-lg bg-[#f3ecfb] px-4 pt-4">
          <motion.div
            layoutId={`team-photo-${member.id}`}
            className="relative aspect-[4/5] w-full overflow-hidden"
          >
            <Image
              src={member.photoUrl}
              alt={`${member.name} portrait`}
              fill
              className="object-contain transition duration-200 ease-out group-hover:scale-[1.015]"
              sizes="150px"
            />
          </motion.div>
        </div>

        <div className="mt-5">
          <motion.h3
            layoutId={`team-name-${member.id}`}
            className="text-2xl font-extrabold leading-tight tracking-[0.01em] text-[#143271]"
          >
            {member.name}
          </motion.h3>
          <motion.p
            layoutId={`team-role-${member.id}`}
            className="mt-1 text-sm font-bold text-[#6c35c3]"
          >
            {member.roleTitle}
          </motion.p>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {member.qualifications.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="rounded-md border border-[#6c35c3]/20 bg-[#f8f3ff] px-2.5 py-1 text-[11px] font-semibold text-[#45276f]"
              >
                {tag}
              </span>
            ))}
          </div>
          <span className="mt-4 inline-flex text-sm font-bold text-[#2E2A33]/74 transition group-hover:text-[#6c35c3]">
            View profile
          </span>
        </div>
      </motion.div>
    </button>
  );
}
