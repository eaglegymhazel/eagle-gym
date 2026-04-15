"use client";

import { useState } from "react";

type TermsAcceptanceProps = {
  accepted: boolean;
  onAccept: () => void;
};

export default function TermsAcceptance({ accepted, onAccept }: TermsAcceptanceProps) {
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
          <span>I agree to the terms</span>
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
          <div className="max-h-[90vh] w-full max-w-xl overflow-auto rounded-2xl border border-[#d9c8f1] bg-white p-5 shadow-[0_22px_56px_-28px_rgba(31,20,50,0.5)] sm:p-6">
            <h3 className="text-center text-[1.7rem] font-black tracking-tight text-[#1f1a25]">
              Subscription Cancellation Policy
            </h3>
            <p className="mt-2 rounded-xl border border-[#f3d3da] bg-[#fff4f6] px-4 py-3 text-center text-sm font-semibold text-[#8b1f35]">
              You must provide <span className="underline">1 full month&apos;s written notice</span>{" "}
              before membership can end.
            </p>

            <p className="mt-6 text-sm leading-relaxed text-[#2E2A33]">
              Monthly fees are spread across the full year, including holiday breaks, to keep
              payments simple and consistent. Payments continue during holiday periods.
            </p>

            <section className="mt-6 border-t border-[#e9e1f2] pt-5">
              <h4 className="text-center text-2xl font-black tracking-tight text-[#1f1a25]">
                Gym Holiday Dates
              </h4>
              <p className="mt-1 text-center text-sm text-[#4f4265]">
                The gym is closed and there are no classes on these dates.
              </p>

              <div className="mt-5 grid gap-3.5 sm:grid-cols-2">
                <article className="overflow-hidden rounded-xl border border-[#e5d8f4] bg-white shadow-[0_10px_22px_-18px_rgba(31,20,50,0.5)]">
                  <header className="border-b border-[#efe7fa] bg-[#faf7ff] px-4 py-3">
                    <p className="text-lg font-black text-[#1f1a25]">2025/2026</p>
                  </header>
                  <ul className="divide-y divide-[#f1e9fb] text-sm text-[#2E2A33]">
                    <li className="grid grid-cols-[1fr_auto] items-baseline gap-3 px-4 py-3">
                      <span className="font-semibold text-[#4f4265]">Winter break</span>
                      <span className="text-right font-bold">Dec 23 - Jan 4</span>
                    </li>
                    <li className="grid grid-cols-[1fr_auto] items-baseline gap-3 px-4 py-3">
                      <span className="font-semibold text-[#4f4265]">Spring break</span>
                      <span className="text-right font-bold">Apr 6 - Apr 19</span>
                    </li>
                    <li className="grid grid-cols-[1fr_auto] items-baseline gap-3 px-4 py-3">
                      <span className="font-semibold text-[#4f4265]">Summer break</span>
                      <span className="text-right font-bold">Jun 29 - Aug 10</span>
                    </li>
                  </ul>
                </article>
                <article className="overflow-hidden rounded-xl border border-[#e5d8f4] bg-white shadow-[0_10px_22px_-18px_rgba(31,20,50,0.5)]">
                  <header className="border-b border-[#efe7fa] bg-[#faf7ff] px-4 py-3">
                    <p className="text-lg font-black text-[#1f1a25]">2026/2027</p>
                  </header>
                  <ul className="divide-y divide-[#f1e9fb] text-sm text-[#2E2A33]">
                    <li className="grid grid-cols-[1fr_auto] items-baseline gap-3 px-4 py-3">
                      <span className="font-semibold text-[#4f4265]">Winter break</span>
                      <span className="text-right font-bold">Dec 21 - Jan 4</span>
                    </li>
                    <li className="grid grid-cols-[1fr_auto] items-baseline gap-3 px-4 py-3">
                      <span className="font-semibold text-[#4f4265]">Spring break</span>
                      <span className="text-right font-bold">Apr 5 - Apr 18</span>
                    </li>
                    <li className="grid grid-cols-[1fr_auto] items-baseline gap-3 px-4 py-3">
                      <span className="font-semibold text-[#4f4265]">Summer break</span>
                      <span className="text-right font-bold">Jun 27 - Aug 8</span>
                    </li>
                  </ul>
                </article>
              </div>
            </section>

            <div className="mt-7 flex flex-wrap justify-center gap-3">
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
      ) : null}
    </>
  );
}
