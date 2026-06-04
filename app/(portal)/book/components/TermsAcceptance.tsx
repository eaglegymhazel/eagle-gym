"use client";

import { useState } from "react";

type TermsSection = {
  title: string;
  body: string;
  tone?: "default" | "warning";
};

type TermsAcceptanceProps = {
  accepted: boolean;
  onAccept: () => void;
  title?: string;
  intro?: string;
  warningText?: string | null;
  sections?: TermsSection[];
  acceptLabel?: string;
};

const defaultSections: TermsSection[] = [
  {
    title: "Membership and payments",
    body:
      "Monthly fees are spread across the full year, including holiday breaks, to keep payments simple and consistent. Payments continue during holiday periods.",
  },
  {
    title: "Annual fee review",
    body:
      "An annual club fee review takes place each May. Fees may increase at that time to reflect rising operational and running costs.",
    tone: "warning",
  },
  {
    title: "Gym Holiday Dates",
    body:
      "The gym is closed and there are no classes on these dates: 2025/2026 winter break Dec 23 - Jan 4, spring break Apr 6 - Apr 19, summer break Jun 29 - Aug 10. 2026/2027 winter break Dec 21 - Jan 4, spring break Apr 5 - Apr 18, summer break Jun 27 - Aug 8.",
  },
];

export default function TermsAcceptance({
  accepted,
  onAccept,
  title = "Subscription Cancellation Policy",
  intro = "Please review the key membership terms below before confirming your booking.",
  warningText = "You must provide 1 full month's written notice before membership can end.",
  sections = defaultSections,
  acceptLabel = "I agree to the terms",
}: TermsAcceptanceProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div className="px-0.5 pt-1 text-xs text-[#4f4265]">
        <p>
          By booking, you agree to our{" "}
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="cursor-pointer font-semibold text-[#6c35c3] underline underline-offset-2 hover:text-[#5b2ca7]"
          >
            terms and conditions
          </button>
          .
        </p>
        <label
          className="mt-2 inline-flex cursor-not-allowed items-center gap-2 text-sm text-[#2E2A33]"
          title="To agree, open terms and click 'I accept'."
        >
          <input
            type="checkbox"
            checked={accepted}
            readOnly
            disabled
            className="h-4 w-4 cursor-not-allowed rounded border border-[#cfbfeb] text-[#6c35c3] disabled:opacity-100"
          />
          <span>{acceptLabel}</span>
        </label>
        {!accepted ? (
          <p className="mt-1 text-[11px] text-[#6a5a86]">
            Open the terms and click <span className="font-semibold">I accept terms</span> to
            continue.
          </p>
        ) : null}
      </div>

      {isOpen ? (
        <div className="fixed inset-0 z-[80] grid place-items-center bg-black/45 px-4 py-6">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-3xl border border-[#ddd2ee] bg-white shadow-[0_22px_56px_-28px_rgba(31,20,50,0.5)]">
            <div className="border-b border-[#ece3f7] px-5 py-5 sm:px-7 sm:py-6">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#6c35c3]">
                Before You Confirm
              </p>
              <h3 className="mt-2 text-[1.7rem] font-black tracking-tight text-[#1f1a25]">
                {title}
              </h3>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#5a4d70]">
                {intro}
              </p>
            </div>

            <div className="space-y-6 px-5 py-5 sm:px-7 sm:py-6">
              {warningText ? (
                <p className="rounded-2xl border border-[#f3d3da] bg-[#fff4f6] px-4 py-3 text-center text-sm font-semibold text-[#8b1f35]">
                  {warningText}
                </p>
              ) : null}

              {sections.map((section) => {
                const warning = section.tone === "warning";
                return (
                  <section
                    key={section.title}
                    className={[
                      "space-y-3 rounded-2xl px-4 py-4",
                      warning
                        ? "border border-[#efe1bf] bg-[#fff9e8]"
                        : "border border-[#ece3f7] bg-[#faf8fd]",
                    ].join(" ")}
                  >
                    <h4
                      className={[
                        "text-base font-black tracking-tight",
                        warning ? "text-[#5f4710]" : "text-[#1f1a25]",
                      ].join(" ")}
                    >
                      {section.title}
                    </h4>
                    <p
                      className={[
                        "text-sm leading-relaxed",
                        warning ? "text-[#6e5110]" : "text-[#2E2A33]",
                      ].join(" ")}
                    >
                      {section.body}
                    </p>
                  </section>
                );
              })}
            </div>

            <div className="border-t border-[#ece3f7] px-5 py-4 sm:px-7">
              <div className="flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="inline-flex h-10 cursor-pointer items-center justify-center rounded-full border border-[#d7c9ef] bg-white px-5 text-sm font-semibold text-[#5f4a82] transition hover:bg-[#faf6ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6c35c3]/30"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  onAccept();
                  setIsOpen(false);
                }}
                className="inline-flex h-10 cursor-pointer items-center justify-center rounded-full bg-[#6c35c3] px-6 text-sm font-semibold text-white shadow-[0_12px_24px_-12px_rgba(69,34,124,0.78)] transition hover:bg-[#5b2ca7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6c35c3]/35"
              >
                I accept
              </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
