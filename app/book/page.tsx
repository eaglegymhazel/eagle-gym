"use client";

import { useState } from "react";

const validCodes = ["EAGLE2026", "EAGLEPRO", "INVITE123"];

export default function BookPage() {
  const [inviteCode, setInviteCode] = useState("");
  const [status, setStatus] = useState<"idle" | "invalid" | "valid">("idle");

  const handleUnlock = () => {
    const isValid = validCodes.includes(inviteCode.trim().toUpperCase());
    setStatus(isValid ? "valid" : "invalid");
  };

  return (
    <section className="relative min-h-[80vh] w-full">
      <div className="pointer-events-none absolute inset-0">
        <div className="h-1/2 w-full bg-[#111827]" />
        <div className="h-1/2 w-full bg-[#faf7fb]" />
      </div>
      <div className="relative w-full bg-[#faf7fb] px-6 pb-8 pt-0.5">
        <div className="relative w-full">
          <h1 className="whitespace-nowrap text-center text-4xl font-extrabold tracking-[0.02em] text-[#143271] md:text-5xl">
            Start Your Gymnastics Journey
          </h1>
        </div>
      </div>
      <div className="grid min-h-[80vh] w-full grid-cols-1 md:grid-cols-2">
        <div className="relative flex items-center justify-center bg-[#faf7fb] px-10 py-16 md:py-20 md:rounded-tr-[15rem]">
          <div className="w-full max-w-md text-left text-[#2E2A33]">
            <div className="mb-6 flex -translate-y-36 justify-center">
              <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-[#111727]">
                <img
                  src="/brand/logo2.png"
                  alt="Multi-Sport logo"
                  className="h-20 w-20 scale-150 object-contain"
                />
              </div>
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#143271]/70">
              Multi-Sport
            </p>
            <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-[#143271] md:text-5xl">
              Multi-Sport
            </h1>
            <p className="mt-2 text-lg font-semibold text-[#2E2A33]/80">
              Recreational Gymnastics Classes
            </p>
            <p className="mt-4 text-base text-[#2E2A33]/80">
              Fun, structured classes that build strength, balance,
              coordination, and confidence.
            </p>
            <a
              href="/book?type=recreational"
              className="mt-8 inline-flex items-center justify-center rounded-full bg-[#143271] px-6 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-white shadow-sm"
            >
              Book Recreational Classes
            </a>
            <p className="mt-6 text-xs text-[#2E2A33]/60">
              Bookings processed by Multi-Sport [legal entity].
            </p>
          </div>
        </div>

        <div className="relative flex items-center justify-center bg-[#111827] px-10 py-16 md:py-20 md:rounded-bl-[15rem]">
          <div
            className="w-full max-w-md text-left text-white"
            style={{ color: "#ffffff" }}
          >
            <div className="mb-6 flex -translate-y-20 justify-center">
              <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-white">
                <img
                  src="/brand/logo.png"
                  alt="Eagle Gymnastics Academy logo"
                  className="h-20 w-20 scale-150 object-contain"
                />
              </div>
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] !text-white">
              Eagle Gymnastics Academy
            </p>
            <h1 className="mt-3 text-4xl font-extrabold tracking-tight !text-white md:text-5xl">
              Eagle Gymnastics Academy
            </h1>
            <p className="mt-2 text-lg font-semibold !text-white">
              Competition Training
            </p>
            <p className="mt-4 text-base !text-white">
              Invite-only competition training for gymnasts ready to progress.
            </p>

            <div className="mt-6 space-y-2">
              <label
                htmlFor="invite-code"
                className="text-sm font-semibold !text-white"
              >
                Invite code
              </label>
              <input
                id="invite-code"
                type="text"
                value={inviteCode}
                onChange={(event) => {
                  setInviteCode(event.target.value);
                  setStatus("idle");
                }}
                placeholder="Enter code"
                className="w-full rounded-xl border border-white/20 bg-white px-4 py-3 text-sm text-[#2E2A33] outline-none ring-offset-2 focus:border-white focus:ring-2 focus:ring-white/30"
              />
              <p className="text-xs !text-white">
                Provided by a coach after assessment.
              </p>
              {status === "invalid" ? (
                <p className="text-sm font-semibold text-[#ff6b6b]">
                  That code does not look right. Please check and try again.
                </p>
              ) : null}
            </div>

            {status === "valid" ? (
              <a
                href="/book?type=competition"
                className="mt-6 inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-[#111827] shadow-sm"
              >
                Unlock &amp; Book Competition Training
              </a>
            ) : (
              <button
                type="button"
                onClick={handleUnlock}
                className="mt-6 inline-flex items-center justify-center rounded-full border border-white/60 px-6 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-white"
              >
                Unlock &amp; Book Competition Training
              </button>
            )}

            <p className="mt-6 text-xs !text-white">
              Bookings processed by Eagle Gymnastics Academy [legal entity].
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
