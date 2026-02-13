"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

type BookingGatewayProps = {
  childId: string;
  childName: string;
  competitionEligible: boolean;
  isSwitchingChild: boolean;
};

export default function BookingGateway({
  childId,
  childName,
  competitionEligible,
  isSwitchingChild,
}: BookingGatewayProps) {
  const router = useRouter();
  const [hovered, setHovered] = useState<"recreational" | "competition" | null>(
    null
  );

  const recActive = hovered === "recreational" || hovered === null;
  const compActive = hovered === "competition" || hovered === null;

  return (
    <div className="relative flex min-h-[78vh] flex-col overflow-hidden rounded-[24px] md:flex-row">

      <div className="pointer-events-none absolute inset-0">
        <div className="floating-orb absolute -left-10 top-16 h-36 w-36 rounded-full bg-[radial-gradient(circle,_rgba(200,170,255,0.25),_transparent_70%)] blur-2xl" />
        <div className="floating-orb-delayed absolute right-12 bottom-10 h-40 w-40 rounded-full bg-[radial-gradient(circle,_rgba(124,92,255,0.2),_transparent_70%)] blur-3xl" />
      </div>



      <motion.div
        onMouseEnter={() => setHovered("recreational")}
        onMouseLeave={() => setHovered(null)}
        initial={{ opacity: 0, y: 16 }}
        animate={{
          flexBasis: hovered === "recreational" ? "60%" : "50%",
          opacity: recActive ? 1 : 0.9,
          filter:
            hovered === "recreational" ? "brightness(1.04)" : "brightness(0.97)",
          y: 0,
        }}
        transition={{ type: "spring", stiffness: 260, damping: 30 }}
        className="relative flex min-h-[35vh] flex-1 items-start justify-start overflow-hidden px-8 py-12 text-left md:min-h-[78vh]"
      >
        <div className="absolute inset-0 bg-[linear-gradient(160deg,_rgba(246,236,255,0.98),_rgba(228,210,250,0.92))] rec-aurora" />
        <div
          className={`pointer-events-none absolute -left-20 top-8 h-72 w-72 rounded-full bg-[radial-gradient(circle,_rgba(200,170,255,0.22),_transparent_70%)] blur-3xl transition-transform duration-500 ${
            hovered === "recreational" ? "translate-x-4 -translate-y-2" : ""
          }`}
        />
        <div
          className={`pointer-events-none absolute right-10 top-1/4 h-56 w-56 rounded-full bg-[radial-gradient(circle,_rgba(255,222,186,0.2),_transparent_70%)] blur-3xl transition-transform duration-500 ${
            hovered === "recreational" ? "translate-x-4 translate-y-3" : ""
          }`}
        />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-[32px] bg-[linear-gradient(90deg,_transparent,_rgba(124,58,237,0.14))] md:block" />
        <div className="relative mt-12 flex h-full max-w-sm flex-col items-start gap-3 md:ml-6 md:mt-16">
          <span className="text-xs font-semibold uppercase tracking-[0.3em] text-[#6c35c3]">
            Recreational
          </span>
          <h2 className="text-[clamp(36px,3.4vw,48px)] font-black leading-[1.02] text-[#1f1a25]">
            <span className="block">Multi-Sports</span>
            <span className="block">Academy</span>
          </h2>
          <div className="mt-4 space-y-3 text-sm font-medium leading-6 text-[#2E2A33]/70 min-h-[200px]">
            <p>
              Fun, confidence-building classes for all levels.
            </p>
            <p>
              These classes are designed for children who want to take part in
              the sport with or without the intention of going further, the
              classes are fun and structured working on basic gymnastic moves.
            </p>
            <p>
              Gymnasts get to use the apparatus and will work on B.A.G.A. badge
              work.
            </p>
          </div>
          <div className="pt-4">
            <button
              type="button"
              disabled={isSwitchingChild}
              onClick={() =>
                router.push(`/book/recreational?childId=${childId}`)
              }
              className={`group inline-flex h-[56px] w-[260px] items-center justify-center rounded-full bg-[#6c35c3] px-6 text-sm font-semibold !text-white shadow-[0_18px_40px_-18px_rgba(108,53,195,0.85)] transition hover:bg-[#5325a3] hover:shadow-[0_26px_60px_-18px_rgba(108,53,195,1)] ${
                isSwitchingChild
                  ? "cursor-not-allowed opacity-60 shadow-none hover:bg-[#6c35c3]"
                  : ""
              }`}
            >
              Book Recreational
              <span className="ml-2 inline-block !text-white transition-transform duration-300 group-hover:translate-x-1">
                {"\u2192"}
              </span>
            </button>
          </div>
        </div>
      </motion.div>

      <motion.div
        onMouseEnter={() => setHovered("competition")}
        onMouseLeave={() => setHovered(null)}
        initial={{ opacity: 0, y: 16 }}
        animate={{
          flexBasis: hovered === "competition" ? "60%" : "50%",
          opacity: compActive ? 1 : 0.9,
          filter:
            hovered === "competition" ? "brightness(1.04)" : "brightness(0.97)",
          y: 0,
        }}
        transition={{ type: "spring", stiffness: 260, damping: 30 }}
        className="relative flex min-h-[35vh] flex-1 items-start justify-start overflow-hidden px-8 py-12 text-left md:min-h-[78vh]"
      >
        <div className="absolute inset-0 bg-[linear-gradient(135deg,_rgba(24,12,62,0.98),_rgba(68,40,140,0.96))] comp-aurora" />
        <div
          className={`pointer-events-none absolute right-0 top-0 h-72 w-72 rounded-full bg-[radial-gradient(circle,_rgba(170,140,255,0.22),_transparent_70%)] blur-3xl transition-transform duration-500 ${
            hovered === "competition" ? "-translate-x-4 translate-y-2" : ""
          }`}
        />
        <div
          className={`pointer-events-none absolute left-12 bottom-12 h-56 w-56 rounded-full bg-[radial-gradient(circle,_rgba(110,80,230,0.2),_transparent_70%)] blur-3xl transition-transform duration-500 ${
            hovered === "competition" ? "-translate-x-4 -translate-y-3" : ""
          }`}
        />
        <div
          className={`pointer-events-none absolute bottom-0 right-0 h-64 w-64 rounded-full bg-[radial-gradient(circle,_rgba(120,90,220,0.18),_transparent_70%)] blur-3xl transition-transform duration-500 ${
            hovered === "competition" ? "-translate-x-3 translate-y-2" : ""
          }`}
        />
        <div className="pointer-events-none absolute inset-y-0 left-0 w-[32px] bg-[linear-gradient(270deg,_transparent,_rgba(210,190,255,0.18))] md:block" />
        <div className="relative mt-12 flex h-full max-w-sm flex-col items-start gap-3 md:ml-6 md:mt-16">
          <span className="text-xs font-semibold uppercase tracking-[0.3em] !text-white">
            Competition
          </span>
          <h2
            style={{ color: "#ffffff", WebkitTextFillColor: "#ffffff" }}
            className="text-[clamp(36px,3.4vw,48px)] font-black leading-[1.02] !text-white"
          >
            <span
              className="whitespace-nowrap"
              style={{ color: "#ffffff", WebkitTextFillColor: "#ffffff" }}
            >
              Eagle Gymnastics
            </span>
            <br />
            <span style={{ color: "#ffffff", WebkitTextFillColor: "#ffffff" }}>
              Academy
            </span>
          </h2>
          {competitionEligible ? (
            <button
              type="button"
              disabled={isSwitchingChild}
              onClick={() =>
                router.push(`/book/competition?childId=${childId}`)
              }
              className={`group inline-flex h-[56px] w-[260px] items-center justify-center rounded-full bg-white px-6 text-sm font-semibold text-[#2b1b4f] shadow-[0_18px_40px_-18px_rgba(12,8,30,0.7)] transition hover:bg-white/95 ${
                isSwitchingChild ? "cursor-not-allowed opacity-60 shadow-none" : ""
              }`}
            >
              Book Competition
              <span className="ml-2 inline-block transition-transform duration-300 group-hover:translate-x-1">
                {"\u2192"}
              </span>
            </button>
          ) : (
            <>
              <div
                className="mt-4 space-y-3 text-sm font-medium leading-6 min-h-[200px]"
                style={{ color: "#ffffff", WebkitTextFillColor: "#ffffff" }}
              >
                <p>
                  Invite-only training for children in the recreational programme
                  who demonstrate the ability, commitment, and potential to
                  progress to competitive gymnastics. Selection is at the
                  discretion of the coaching team.
                </p>
                <p>
                  For more information or to discuss this pathway, speak with a
                  coach.
                </p>
              </div>
              <div className="pt-4 flex flex-col items-center gap-3">
              <button
                type="button"
                disabled
                className="inline-flex h-[56px] w-[260px] cursor-not-allowed items-center justify-center gap-2 rounded-full bg-[#5a3a9b] px-6 text-sm font-semibold !text-white opacity-60 shadow-none"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="text-white"
                  aria-hidden="true"
                >
                  <rect
                    x="5"
                    y="11"
                    width="14"
                    height="9"
                    rx="2"
                    stroke="#fff"
                    strokeWidth="1.6"
                  />
                  <path
                    d="M8 11V9a4 4 0 118 0v2"
                    stroke="#fff"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                </svg>
                Invite-only
              </button>
              </div>
            </>
          )}
        </div>
      </motion.div>

      <style jsx>{`
        @keyframes floatOrb {
          0% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-12px);
          }
          100% {
            transform: translateY(0px);
          }
        }
        @keyframes auroraShift {
          0% {
            filter: hue-rotate(0deg);
          }
          50% {
            filter: hue-rotate(6deg);
          }
          100% {
            filter: hue-rotate(0deg);
          }
        }
        @keyframes auroraDrift {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
        .floating-orb {
          animation: floatOrb 8s ease-in-out infinite;
        }
        .floating-orb-delayed {
          animation: floatOrb 10s ease-in-out infinite;
          animation-delay: 1.5s;
        }
        .rec-aurora {
          animation: auroraShift 12s ease-in-out infinite,
            auroraDrift 18s ease-in-out infinite;
          background-size: 200% 200%;
        }
        .comp-aurora {
          animation: auroraShift 14s ease-in-out infinite,
            auroraDrift 20s ease-in-out infinite;
          background-size: 200% 200%;
        }
      `}</style>
    </div>
  );
}
