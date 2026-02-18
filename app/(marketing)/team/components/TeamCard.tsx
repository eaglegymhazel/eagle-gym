"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
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
  const quickTags = member.qualifications.slice(0, 2);

  return (
    <button
      type="button"
      onClick={(event) => onOpen(member.id, event.currentTarget)}
      className="group relative w-full rounded-2xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6c35c3] focus-visible:ring-offset-2 focus-visible:ring-offset-[#faf7fb]"
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
        className={[
          "overflow-hidden rounded-2xl border border-[#6c35c3]/15 bg-white",
          "shadow-[0_12px_30px_-22px_rgba(45,26,78,0.45)]",
          "transition-colors duration-200",
          "group-hover:border-[#6c35c3]/30",
        ].join(" ")}
      >
        <motion.div
          layoutId={`team-photo-${member.id}`}
          className="relative aspect-[4/5] w-full overflow-hidden bg-[#f3e7ff]"
        >
          <Image
            src={member.photoUrl}
            alt={`${member.name} portrait`}
            fill
            className="object-cover transition duration-200 ease-out group-hover:scale-[1.02]"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#1f143205] to-transparent" />
        </motion.div>

        <div className="space-y-2 p-4">
          <motion.h3
            layoutId={`team-name-${member.id}`}
            className="text-xl font-semibold tracking-[-0.01em] text-[#231739]"
          >
            {member.name}
          </motion.h3>
          <motion.p
            layoutId={`team-role-${member.id}`}
            className="text-sm font-semibold text-[#6c35c3]"
          >
            {member.roleTitle}
          </motion.p>
          <div className="flex flex-wrap gap-1.5">
            {quickTags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-[#6c35c3]/20 bg-[#f8f3ff] px-2.5 py-1 text-[11px] font-medium text-[#45276f]"
              >
                {tag}
              </span>
            ))}
          </div>
          <div className="inline-flex items-center gap-1 text-sm font-semibold text-[#2a0c4f]/70">
            <span>View profile</span>
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </div>
        </div>
      </motion.div>
    </button>
  );
}

