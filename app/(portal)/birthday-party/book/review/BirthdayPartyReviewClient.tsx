"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertCircle, ArrowLeft, CreditCard } from "lucide-react";
import { parseBirthdayPartySize } from "@/lib/birthdayPartyBookingValidation";
import type { BirthdayPartyAccountSummary, BirthdayPartyPriceBreakdown } from "@/lib/server/birthdayPartyBookings";
import { loadBirthdayPartyDraft, type BirthdayPartyDraft } from "../draft";
import TermsAcceptance from "@/app/(portal)/book/components/TermsAcceptance";

type BirthdayPartyReviewClientProps = {
  slotId: string;
  slotLabel: string;
  timeLabel: string;
  partySize: number;
  accountSummary: BirthdayPartyAccountSummary;
  pricing: BirthdayPartyPriceBreakdown;
  isSlotAvailable: boolean;
};

function formatCurrency(amountPence: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(amountPence / 100);
}

function formatDateOfBirth(dateValue: string): string {
  if (!dateValue) return "Not provided";
  const date = new Date(`${dateValue}T12:00:00Z`);
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export default function BirthdayPartyReviewClient({
  slotId,
  slotLabel,
  timeLabel,
  partySize,
  accountSummary,
  pricing,
  isSlotAvailable,
}: BirthdayPartyReviewClientProps) {
  const [draft, setDraft] = useState<BirthdayPartyDraft | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDraft(loadBirthdayPartyDraft());
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const resolvedDraft = useMemo(() => {
    if (
      !draft ||
      draft.slotId !== slotId ||
      parseBirthdayPartySize(draft.partySize) !== partySize
    ) {
      return {
        birthdayChildFirstName: "",
        birthdayChildLastName: "",
        birthdayChildDateOfBirth: "",
        healthNotes: "",
        specialRequirements: "",
        additionalNotes: "",
      };
    }

    return {
      birthdayChildFirstName: draft.birthdayChildFirstName ?? "",
      birthdayChildLastName: draft.birthdayChildLastName ?? "",
      birthdayChildDateOfBirth: draft.birthdayChildDateOfBirth ?? "",
      healthNotes: draft.healthNotes ?? "",
      specialRequirements: draft.specialRequirements ?? "",
      additionalNotes: draft.additionalNotes ?? "",
    };
  }, [draft, partySize, slotId]);

  const backHref = `/birthday-party/book/details?slotId=${encodeURIComponent(slotId)}`;

  const handleCheckout = async () => {
    if (isSubmitting || !isSlotAvailable) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/checkout/birthday-party", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          slotId,
          partySize,
          birthdayChildFirstName: resolvedDraft.birthdayChildFirstName,
          birthdayChildLastName: resolvedDraft.birthdayChildLastName,
          birthdayChildDateOfBirth: resolvedDraft.birthdayChildDateOfBirth,
          healthNotes: resolvedDraft.healthNotes,
          specialRequirements: resolvedDraft.specialRequirements,
          additionalNotes: resolvedDraft.additionalNotes,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { url?: string; error?: string }
        | null;

      if (!response.ok || !payload?.url) {
        setError(payload?.error ?? "Unable to start payment.");
        setIsSubmitting(false);
        return;
      }

      window.location.href = payload.url;
    } catch {
      setError("Unable to start payment.");
      setIsSubmitting(false);
    }
  };

  return (
    <section className="relative w-full overflow-hidden bg-[#faf7fb] px-4 pb-12 pt-4 sm:px-6 sm:pt-6">
      <div className="relative z-10 mx-auto w-full max-w-[1040px] space-y-5 sm:space-y-6">
        <header className="space-y-3">
          <p className="text-[1.75rem] font-black uppercase tracking-[0.04em] text-[#b42348] sm:text-[2.1rem]">
            Review Birthday Party Booking
          </p>
          <div className="inline-flex items-center rounded-full border border-[#6c35c3]/25 bg-white/85 px-4 py-1.5 text-sm font-semibold uppercase tracking-[0.18em] text-[#2a203c]/70 shadow-[0_12px_28px_-18px_rgba(31,26,37,0.5)] backdrop-blur">
            Booking account
            <span className="ml-1 font-bold text-[#2a203c]">{accountSummary.fullName}</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={backHref}
              className="inline-flex items-center gap-2 rounded-full border border-[#d8c7f4] bg-white px-4 py-2 text-sm font-semibold text-[#5b2ca7] transition hover:bg-[#faf6ff]"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back to booking
            </Link>
          </div>
          <div className="pt-1">
            <div className="h-[0.5px] w-full bg-black/20" />
          </div>
        </header>

        {!isSlotAvailable ? (
          <div className="rounded-2xl border border-[#f2c7cf] bg-[#fff4f6] p-4 text-sm text-[#7a2334]">
            <div className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <p className="font-semibold">
                This birthday party date is no longer available. Please go back and choose another slot.
              </p>
            </div>
          </div>
        ) : null}

        {error ? (
          <div className="rounded-2xl border border-[#f2c7cf] bg-[#fff4f6] p-4 text-sm text-[#7a2334]">
            <div className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <p className="font-semibold">{error}</p>
            </div>
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-5">
            <section className="rounded-2xl border border-[#e7e1f1] bg-white p-5 shadow-[0_10px_24px_-20px_rgba(34,24,56,0.36)] sm:p-6">
              <h2 className="text-lg font-black text-[#1f1a25]">Party details</h2>
              <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6c35c3]">Date</dt>
                  <dd className="mt-1 text-base font-semibold text-[#2E2A33]">{slotLabel}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6c35c3]">Time</dt>
                  <dd className="mt-1 text-base font-semibold text-[#2E2A33]">{timeLabel}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6c35c3]">Birthday child</dt>
                  <dd className="mt-1 text-base font-semibold text-[#2E2A33]">
                    {[resolvedDraft.birthdayChildFirstName, resolvedDraft.birthdayChildLastName].filter(Boolean).join(" ") || "Not provided"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6c35c3]">Date of birth</dt>
                  <dd className="mt-1 text-base font-semibold text-[#2E2A33]">
                    {formatDateOfBirth(resolvedDraft.birthdayChildDateOfBirth)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6c35c3]">Children</dt>
                  <dd className="mt-1 text-base font-semibold text-[#2E2A33]">{partySize}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6c35c3]">Total due</dt>
                  <dd className="mt-1 text-base font-semibold text-[#2E2A33]">
                    {formatCurrency(pricing.totalAmountPence)}
                  </dd>
                </div>
              </dl>
            </section>

            <section className="rounded-2xl border border-[#e7e1f1] bg-white p-5 shadow-[0_10px_24px_-20px_rgba(34,24,56,0.36)] sm:p-6">
              <h2 className="text-lg font-black text-[#1f1a25]">Price breakdown</h2>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-[#2E2A33]/70">Base party price</dt>
                  <dd className="font-semibold text-[#2E2A33]">{formatCurrency(pricing.basePricePence)}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-[#2E2A33]/70">Additional children</dt>
                  <dd className="font-semibold text-[#2E2A33]">
                    {pricing.extraChildrenCount > 0
                      ? `${pricing.extraChildrenCount} x ${formatCurrency(1000)}`
                      : "None"}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-[#2E2A33]/70">Extra children total</dt>
                  <dd className="font-semibold text-[#2E2A33]">
                    {formatCurrency(pricing.extraChildrenPricePence)}
                  </dd>
                </div>
              </dl>
            </section>

            <section className="rounded-2xl border border-[#e7e1f1] bg-white p-5 shadow-[0_10px_24px_-20px_rgba(34,24,56,0.36)] sm:p-6">
              <h2 className="text-lg font-black text-[#1f1a25]">Account contact details</h2>
              <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6c35c3]">Name</dt>
                  <dd className="mt-1 text-base font-semibold text-[#2E2A33]">{accountSummary.fullName}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6c35c3]">Email</dt>
                  <dd className="mt-1 break-all text-base font-semibold text-[#2E2A33]">{accountSummary.email || "Not provided"}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6c35c3]">Telephone</dt>
                  <dd className="mt-1 text-base font-semibold text-[#2E2A33]">{accountSummary.telNo || "Not provided"}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6c35c3]">Emergency contact</dt>
                  <dd className="mt-1 text-base font-semibold text-[#2E2A33]">
                    {accountSummary.emergencyTelNo || "Not provided"}
                  </dd>
                </div>
              </dl>
            </section>

            <section className="rounded-2xl border border-[#e7e1f1] bg-white p-5 shadow-[0_10px_24px_-20px_rgba(34,24,56,0.36)] sm:p-6">
              <h2 className="text-lg font-black text-[#1f1a25]">Notes and requirements</h2>
              <div className="mt-4 space-y-4 text-sm text-[#2E2A33]">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6c35c3]">Health or medical concerns</p>
                  <p className="mt-1 rounded-xl border border-[#ede5f6] bg-[#fcfbff] px-4 py-3">
                    {resolvedDraft.healthNotes || "None provided"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6c35c3]">Special requirements</p>
                  <p className="mt-1 rounded-xl border border-[#ede5f6] bg-[#fcfbff] px-4 py-3">
                    {resolvedDraft.specialRequirements || "None provided"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6c35c3]">Additional notes</p>
                  <p className="mt-1 rounded-xl border border-[#ede5f6] bg-[#fcfbff] px-4 py-3">
                    {resolvedDraft.additionalNotes || "None provided"}
                  </p>
                </div>
              </div>
            </section>
          </div>

          <aside className="lg:sticky lg:top-28 lg:self-start">
            <div className="rounded-2xl border border-[#e7e1f1] bg-white p-5 shadow-[0_10px_24px_-20px_rgba(34,24,56,0.36)]">
              <h2 className="text-lg font-black text-[#1f1a25]">Confirm and pay</h2>
              <p className="mt-3 text-sm text-[#5f4a82]">
                Once you continue to payment, we will place a temporary hold on this slot while you complete checkout.
              </p>
              <button
                type="button"
                onClick={handleCheckout}
                disabled={isSubmitting || !isSlotAvailable || !hasAcceptedTerms}
                className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#6c35c3] px-5 text-sm font-semibold text-white !text-white shadow-[0_12px_24px_-12px_rgba(69,34,124,0.78)] transition hover:bg-[#5b2ca7] disabled:cursor-not-allowed disabled:bg-[#c5addf] disabled:!text-white"
              >
                <CreditCard className="h-4 w-4" aria-hidden="true" />
                {isSubmitting ? "Preparing Payment..." : "Continue to Payment"}
              </button>
              <div className="pt-3 pl-2">
                <TermsAcceptance
                  accepted={hasAcceptedTerms}
                  onAccept={() => setHasAcceptedTerms(true)}
                  title="Birthday Party Terms"
                  intro="Please review the birthday party cancellation and rescheduling terms before confirming your booking."
                  warningText={null}
                  sections={[
                    {
                      title: "Cancellations",
                      body:
                        "Cancellations made more than 1 month before the party date will receive a full refund, less a £10 administration fee. Cancellations made between 7 days and 1 month before the party date will receive a 75% refund. Unfortunately, cancellations made within 7 days of the party date are non-refundable, as arrangements and staffing will already have been confirmed.",
                    },
                    {
                      title: "Rescheduling",
                      body:
                        "If you need to move your party and there are more than 7 days before the booking date, you can transfer your booking to another available date free of charge. If there are 7 days or less before the booking date, your booking can still be transferred to another available date for a £50 administration fee to cover the costs of rearranging staffing.",
                    },
                    {
                      title: "Contact Us",
                      body:
                        "If you need to contact us regarding your booking for any reason, please see the Contact Us page on our website for details. A link to this will be found on your booking email.",
                    },
                  ]}
                />
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
