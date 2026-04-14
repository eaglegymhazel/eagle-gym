"use client";

import { useMemo, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import FeaturedProfileCard from "./components/FeaturedProfileCard";
import TeamGrid from "./components/TeamGrid";
import TeamProfileModal from "./components/TeamProfileModal";
import { teamMembers } from "./teamData";

export default function TeamPage() {
  const reducedMotion = useReducedMotion();
  const [openId, setOpenId] = useState<string | null>(null);
  const lastTriggerRef = useRef<HTMLElement | null>(null);

  const featuredCoach = useMemo(
    () =>
      teamMembers.find((member) => member.roleTitle === "Head Coach") ??
      teamMembers[0],
    [],
  );
  const remainingTeam = useMemo(
    () => teamMembers.filter((member) => member.id !== featuredCoach.id),
    [featuredCoach.id],
  );
  const activeMember = useMemo(
    () => teamMembers.find((member) => member.id === openId) ?? null,
    [openId],
  );

  const handleOpen = (memberId: string, trigger: HTMLElement) => {
    lastTriggerRef.current = trigger;
    setOpenId(memberId);
  };

  const handleClose = () => {
    setOpenId(null);
    const trigger = lastTriggerRef.current;
    if (trigger) {
      requestAnimationFrame(() => {
        trigger.focus();
      });
    }
  };

  return (
    <main className="w-full bg-[#faf7fb]">
      <section className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-[clamp(38px,5vw,68px)] font-extrabold leading-[0.96] tracking-[0.01em] text-[#143271]">
            Meet the coaching team
          </h1>
          <p className="mx-auto mt-6 max-w-3xl text-base leading-8 text-[#2E2A33]/76 sm:text-[17px]">
            Supportive coaching, clear progressions, and a consistent training
            environment for every gymnast.
          </p>
        </div>

        <FeaturedProfileCard
          member={featuredCoach}
          onOpen={handleOpen}
          reducedMotion={!!reducedMotion}
        />

        <TeamGrid
          members={remainingTeam}
          onOpen={handleOpen}
          reducedMotion={!!reducedMotion}
        />

        <TeamProfileModal
          member={activeMember}
          onClose={handleClose}
          reducedMotion={!!reducedMotion}
        />
      </section>
    </main>
  );
}
