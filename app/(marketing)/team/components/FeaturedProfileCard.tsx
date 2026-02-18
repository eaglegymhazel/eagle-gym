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
  const specialties = member.qualifications.slice(0, 4);

  return (
    <section className="mb-8">
      <button
        type="button"
        onClick={(event) => onOpen(member.id, event.currentTarget)}
        className="group block w-full rounded-3xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6c35c3] focus-visible:ring-offset-2 focus-visible:ring-offset-[#faf7fb]"
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
          className={[
            "overflow-hidden rounded-3xl border border-[#6c35c3]/20",
            "bg-gradient-to-r from-white via-[#fbf8ff] to-[#f6f0ff]",
            "shadow-[0_20px_45px_-34px_rgba(45,26,78,0.55)]",
          ].join(" ")}
        >
          <div className="grid gap-0 md:grid-cols-[260px,1fr]">
            <motion.div
              layoutId={`team-photo-${member.id}`}
              className="relative aspect-[4/5] w-full overflow-hidden bg-[#f3e7ff] md:aspect-auto md:min-h-[320px]"
            >
              <Image
                src={member.photoUrl}
                alt={`${member.name} portrait`}
                fill
                className="object-cover transition duration-200 ease-out group-hover:scale-[1.02]"
                sizes="(max-width: 768px) 100vw, 260px"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#1f14320f] to-transparent" />
            </motion.div>

            <div className="space-y-4 p-6 md:p-8">
              <motion.h3
                layoutId={`team-name-${member.id}`}
                className="text-3xl font-bold tracking-[-0.02em] text-[#231739]"
              >
                {member.name}
              </motion.h3>
              <motion.p
                layoutId={`team-role-${member.id}`}
                className="text-base font-semibold text-[#6c35c3]"
              >
                {member.roleTitle}
              </motion.p>
              {member.bio ? (
                <p className="max-w-2xl text-base leading-7 text-[#2a0c4f]/80">
                  {member.bio}
                </p>
              ) : (
                <p className="max-w-2xl text-base leading-7 text-[#2a0c4f]/80">
                  Supporting every gymnast with safe progress, strong
                  fundamentals, and a positive training environment.
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                {specialties.map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-[#6c35c3]/20 bg-white/85 px-3 py-1 text-xs font-semibold text-[#4c297a]"
                  >
                    {item}
                  </span>
                ))}
              </div>
              <span className="inline-flex rounded-full border border-[#6c35c3]/30 bg-[#f7f1ff] px-4 py-1.5 text-sm font-semibold text-[#4c297a] transition group-hover:bg-[#efe4ff]">
                View profile
              </span>
            </div>
          </div>
        </motion.div>
      </button>
    </section>
  );
}
