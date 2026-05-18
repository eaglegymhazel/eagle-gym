import type { TeamMember } from "../types";
import TeamCard from "./TeamCard";

type TeamGridProps = {
  members: TeamMember[];
};

export default function TeamGrid({ members }: TeamGridProps) {
  return (
    <section aria-label="Coaching team" className="pb-2">
      <div className="mb-7 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
        <div>
          <h2 className="text-[clamp(30px,3vw,44px)] font-extrabold leading-[1.05] tracking-[0.02em] text-[#2a0c4f]">
            More of the coaching team
          </h2>
        </div>
        <p className="text-sm font-semibold text-[#2E2A33]/68">
          {members.length} profiles
        </p>
      </div>

      <div className="space-y-6">
        {members.map((member, index) => (
          <TeamCard key={member.id} member={member} reverse={index % 2 === 1} />
        ))}
      </div>
    </section>
  );
}
