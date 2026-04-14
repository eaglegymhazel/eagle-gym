"use client";

import type { TeamMember } from "../types";
import TeamCard from "./TeamCard";

type TeamGridProps = {
  members: TeamMember[];
  onOpen: (memberId: string, trigger: HTMLElement) => void;
  reducedMotion: boolean;
};

export default function TeamGrid({
  members,
  onOpen,
  reducedMotion,
}: TeamGridProps) {
  return (
    <section aria-label="Coaching team">
      <div className="mb-7 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
        <div>
          <div className="mb-5 h-[3px] w-12 rounded-full bg-[#6c35c3]" />
          <h2 className="text-[clamp(30px,3vw,44px)] font-extrabold leading-[1.05] tracking-[0.02em] text-[#2a0c4f]">
            Coaches and support
          </h2>
        </div>
        <p className="text-sm font-semibold text-[#2E2A33]/68">
          {members.length} profiles
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {members.map((member) => (
          <TeamCard
            key={member.id}
            member={member}
            onOpen={onOpen}
            reducedMotion={reducedMotion}
          />
        ))}
      </div>
    </section>
  );
}
