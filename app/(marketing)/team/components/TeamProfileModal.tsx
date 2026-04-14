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
            className="absolute inset-0 bg-[#120a22]/48 backdrop-blur-[2px]"
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
            className="relative z-10 w-full max-w-3xl overflow-hidden rounded-lg border border-[#6c35c3]/20 bg-white shadow-[0_38px_70px_-38px_rgba(21,10,37,0.65)]"
          >
            <button
              ref={closeButtonRef}
              type="button"
              onClick={onClose}
              className="absolute right-4 top-4 z-20 inline-flex h-9 w-9 items-center justify-center rounded-md border border-[#6c35c3]/20 bg-white/95 text-[#38205a] transition hover:bg-[#f6f0ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6c35c3] focus-visible:ring-offset-2"
              aria-label="Close profile dialog"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>

            <div className="grid max-h-[80vh] overflow-y-auto md:grid-cols-[240px,1fr]">
              <div className="flex items-center justify-center bg-[#f3ecfb] p-6">
                <motion.div
                  layoutId={`team-photo-${member.id}`}
                  className="relative aspect-[4/5] w-full max-w-[180px] overflow-hidden rounded-lg bg-[#faf7fb]"
                >
                  <Image
                    src={member.photoUrl}
                    alt={`${member.name} portrait`}
                    fill
                    className="object-contain"
                    sizes="180px"
                  />
                </motion.div>
              </div>

              <div className="space-y-5 p-6 sm:p-8">
                <div>
                  <motion.h2
                    id={`team-modal-title-${member.id}`}
                    layoutId={`team-name-${member.id}`}
                    className="text-4xl font-extrabold leading-tight tracking-[0.01em] text-[#143271]"
                  >
                    {member.name}
                  </motion.h2>
                  <motion.p
                    layoutId={`team-role-${member.id}`}
                    className="mt-2 text-base font-bold text-[#6c35c3]"
                  >
                    {member.roleTitle}
                  </motion.p>
                </div>

                <section className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-[#6c35c3]">
                    About
                  </h3>
                  <p className="text-base leading-7 text-[#2a0c4f]/80">
                    {member.bio ??
                      "Supporting every gymnast with safe progress, strong fundamentals, and a positive training environment."}
                  </p>
                </section>

                <section className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-[#6c35c3]">
                    Qualifications
                  </h3>
                  <ul className="space-y-2 text-sm leading-6 text-[#2a0c4f]/85">
                    {member.qualifications.map((qualification) => (
                      <li key={qualification} className="flex gap-2">
                        <span aria-hidden="true">-</span>
                        <span>{qualification}</span>
                      </li>
                    ))}
                  </ul>
                </section>

                {member.funFact ? (
                  <section className="space-y-2">
                    <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-[#6c35c3]">
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
