"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useRef } from "react";
import type { TeamMember } from "../types";

type TeamProfileModalProps = {
  member: TeamMember | null;
  onClose: () => void;
  reducedMotion: boolean;
};

const focusableSelector =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

export default function TeamProfileModal({
  member,
  onClose,
  reducedMotion,
}: TeamProfileModalProps) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!member) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!dialogRef.current) return;

      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab") return;
      const focusables = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(focusableSelector),
      );
      if (!focusables.length) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (event.shiftKey) {
        if (active === first || !dialogRef.current.contains(active)) {
          event.preventDefault();
          last.focus();
        }
        return;
      }

      if (active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [member, onClose]);

  return (
    <AnimatePresence>
      {member ? (
        <motion.div
          className="fixed inset-0 z-[80] flex items-center justify-center p-4 sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reducedMotion ? 0.1 : 0.18 }}
          aria-hidden={false}
        >
          <motion.button
            type="button"
            onClick={onClose}
            className="absolute inset-0 bg-[#120a22]/45 backdrop-blur-[2px]"
            aria-label="Close profile dialog"
          />

          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={`team-modal-title-${member.id}`}
            layoutId={`team-card-${member.id}`}
            transition={
              reducedMotion
                ? { duration: 0.12 }
                : { type: "spring", stiffness: 330, damping: 35, mass: 0.7 }
            }
            className="relative z-10 w-full max-w-3xl overflow-hidden rounded-3xl border border-[#6c35c3]/20 bg-white shadow-[0_38px_70px_-38px_rgba(21,10,37,0.65)]"
          >
            <button
              ref={closeButtonRef}
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 z-20 inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#6c35c3]/20 bg-white/95 text-[#38205a] transition hover:bg-[#f6f0ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6c35c3] focus-visible:ring-offset-2"
              aria-label="Close profile dialog"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>

            <div className="grid max-h-[80vh] overflow-y-auto md:grid-cols-[300px,1fr]">
              <motion.div
                layoutId={`team-photo-${member.id}`}
                className="relative min-h-[320px] bg-[#f3e7ff]"
              >
                <Image
                  src={member.photoUrl}
                  alt={`${member.name} portrait`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 300px"
                />
              </motion.div>

              <div className="space-y-5 p-6 sm:p-8">
                <motion.h2
                  id={`team-modal-title-${member.id}`}
                  layoutId={`team-name-${member.id}`}
                  className="text-3xl font-bold tracking-[-0.02em] text-[#211535]"
                >
                  {member.name}
                </motion.h2>
                <motion.p
                  layoutId={`team-role-${member.id}`}
                  className="text-base font-semibold text-[#6c35c3]"
                >
                  {member.roleTitle}
                </motion.p>

                {member.bio ? (
                  <section className="space-y-2">
                    <h3 className="text-xs font-semibold uppercase tracking-[0.08em] text-[#6f5a8d]">
                      About
                    </h3>
                    <p className="text-base leading-7 text-[#2a0c4f]/80">
                      {member.bio}
                    </p>
                  </section>
                ) : null}

                <section className="space-y-2">
                  <h3 className="text-xs font-semibold uppercase tracking-[0.08em] text-[#6f5a8d]">
                    Qualifications
                  </h3>
                  <ul className="list-disc space-y-1 pl-5 text-sm leading-6 text-[#2a0c4f]/85">
                    {member.qualifications.map((qualification) => (
                      <li key={qualification}>{qualification}</li>
                    ))}
                  </ul>
                </section>

                {member.funFact ? (
                  <section className="space-y-2">
                    <h3 className="text-xs font-semibold uppercase tracking-[0.08em] text-[#6f5a8d]">
                      Fun Fact
                    </h3>
                    <p className="text-sm leading-6 text-[#2a0c4f]/85">
                      {member.funFact}
                    </p>
                  </section>
                ) : null}
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

