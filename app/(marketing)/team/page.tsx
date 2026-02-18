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
    () => teamMembers.find((member) => member.roleTitle === "Head Coach") ?? teamMembers[0],
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
    <section className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-14">
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
  );
}

