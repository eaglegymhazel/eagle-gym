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
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold tracking-[-0.01em] text-[#2a0c4f]">
          Coaches
        </h2>
        <p className="text-sm text-[#2a0c4f]/70">{members.length} profiles</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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

