"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CalendarDays, PoundSterling } from "lucide-react";
import {
  BIRTHDAY_PARTY_MAX_CHILDREN,
  BIRTHDAY_PARTY_MIN_CHILDREN,
  getBirthdayChildMaxDate,
  isBirthdayChildOldEnough,
  parseBirthdayPartySize,
} from "@/lib/birthdayPartyBookingValidation";
import { loadBirthdayPartyDraft, saveBirthdayPartyDraft } from "../draft";

type BirthdayPartyDetailsClientProps = {
  accountName: string;
  slotId: string;
  slotLabel: string;
  timeLabel: string;
};

type FieldErrors = {
  partySizeInput?: string;
  birthdayChildFirstName?: string;
  birthdayChildLastName?: string;
  birthdayChildDateOfBirth?: string;
  healthNotes?: string;
  specialRequirements?: string;
};

function formatCurrency(amountPence: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(amountPence / 100);
}

function calculatePreview(partySize: number) {
  const normalizedPartySize = Number.isFinite(partySize) ? Math.max(1, Math.trunc(partySize)) : 1;
  const extraChildrenCount = Math.max(0, normalizedPartySize - 12);
  const extraChildrenPricePence = extraChildrenCount * 1000;
  return {
    partySize: normalizedPartySize,
    basePricePence: 15000,
    extraChildrenCount,
    extraChildrenPricePence,
    totalAmountPence: 15000 + extraChildrenPricePence,
  };
}

export default function BirthdayPartyDetailsClient({
  accountName,
  slotId,
  slotLabel,
  timeLabel,
}: BirthdayPartyDetailsClientProps) {
  const router = useRouter();
  const [partySizeInput, setPartySizeInput] = useState("");
  const [birthdayChildFirstName, setBirthdayChildFirstName] = useState("");
  const [birthdayChildLastName, setBirthdayChildLastName] = useState("");
  const [birthdayChildDateOfBirth, setBirthdayChildDateOfBirth] = useState("");
  const [healthNotes, setHealthNotes] = useState("");
  const [specialRequirements, setSpecialRequirements] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  useEffect(() => {
    const savedDraft = loadBirthdayPartyDraft();
    if (!savedDraft || savedDraft.slotId !== slotId) return;

    const savedPartySize = parseBirthdayPartySize(savedDraft.partySize);
    if (savedPartySize !== null) {
      setPartySizeInput(String(savedPartySize));
    }
    setBirthdayChildFirstName(savedDraft.birthdayChildFirstName ?? "");
    setBirthdayChildLastName(savedDraft.birthdayChildLastName ?? "");
    setBirthdayChildDateOfBirth(savedDraft.birthdayChildDateOfBirth ?? "");
    setHealthNotes(savedDraft.healthNotes ?? "");
    setSpecialRequirements(savedDraft.specialRequirements ?? "");
    setAdditionalNotes(savedDraft.additionalNotes ?? "");
  }, [slotId]);

  const parsedPartySize = useMemo(
    () => parseBirthdayPartySize(partySizeInput),
    [partySizeInput]
  );
  const birthdayChildMaxDate = useMemo(() => getBirthdayChildMaxDate(), []);
  const pricing = useMemo(() => calculatePreview(parsedPartySize ?? 12), [parsedPartySize]);

  const handleContinue = () => {
    const nextFieldErrors: FieldErrors = {};

    if (!partySizeInput.trim()) {
      nextFieldErrors.partySizeInput = "Please populate.";
    } else {
      const numericPartySize = Number.parseInt(partySizeInput, 10);
      if (numericPartySize > BIRTHDAY_PARTY_MAX_CHILDREN) {
        nextFieldErrors.partySizeInput = `Maximum party size is ${BIRTHDAY_PARTY_MAX_CHILDREN}.`;
      } else if (numericPartySize < BIRTHDAY_PARTY_MIN_CHILDREN) {
        nextFieldErrors.partySizeInput = `Minimum party size is ${BIRTHDAY_PARTY_MIN_CHILDREN}.`;
      }
    }

    if (!birthdayChildFirstName.trim()) {
      nextFieldErrors.birthdayChildFirstName = "Please populate.";
    }

    if (!birthdayChildLastName.trim()) {
      nextFieldErrors.birthdayChildLastName = "Please populate.";
    }

    if (!birthdayChildDateOfBirth.trim()) {
      nextFieldErrors.birthdayChildDateOfBirth = "Please populate.";
    } else if (!isBirthdayChildOldEnough(birthdayChildDateOfBirth.trim())) {
      nextFieldErrors.birthdayChildDateOfBirth = "Minimum booking age, 4 years old.";
    }

    if (!healthNotes.trim()) {
      nextFieldErrors.healthNotes = "Please populate.";
    }

    if (!specialRequirements.trim()) {
      nextFieldErrors.specialRequirements = "Please populate.";
    }

    if (Object.keys(nextFieldErrors).length > 0 || parsedPartySize === null) {
      setFieldErrors(nextFieldErrors);
      return;
    }

    setFieldErrors({});

    saveBirthdayPartyDraft({
      slotId,
      partySize: parsedPartySize,
      birthdayChildFirstName: birthdayChildFirstName.trim(),
      birthdayChildLastName: birthdayChildLastName.trim(),
      birthdayChildDateOfBirth: birthdayChildDateOfBirth.trim(),
      healthNotes: healthNotes.trim(),
      specialRequirements: specialRequirements.trim(),
      additionalNotes: additionalNotes.trim(),
    });

    router.push(
      `/birthday-party/book/review?slotId=${encodeURIComponent(slotId)}&partySize=${encodeURIComponent(String(parsedPartySize))}`
    );
  };

  return (
    <section className="relative w-full overflow-hidden bg-[#faf7fb] px-4 pb-12 pt-4 sm:px-6 sm:pt-6">
      <div className="relative z-10 mx-auto w-full max-w-[1040px] space-y-5 sm:space-y-6">
        <header className="space-y-3">
          <p className="text-[1.75rem] font-black uppercase tracking-[0.04em] text-[#b42348] sm:text-[2.1rem]">
            Birthday Party Booking
          </p>
          <div className="inline-flex items-center rounded-full border border-[#6c35c3]/25 bg-white/85 px-4 py-1.5 text-sm font-semibold uppercase tracking-[0.18em] text-[#2a203c]/70 shadow-[0_12px_28px_-18px_rgba(31,26,37,0.5)] backdrop-blur">
            Booking account
            <span className="ml-1 font-bold text-[#2a203c]">{accountName}</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/birthday-party/book?slotId=${encodeURIComponent(slotId)}`}
              className="inline-flex items-center gap-2 rounded-full border border-[#d8c7f4] bg-white px-4 py-2 text-sm font-semibold text-[#5b2ca7] transition hover:bg-[#faf6ff]"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back to date selection
            </Link>
          </div>
          <div className="pt-1">
            <div className="h-[0.5px] w-full bg-black/20" />
          </div>
        </header>

        <div className="space-y-5 pb-28 sm:pb-32">
          <section className="rounded-2xl border border-[#e7e1f1] bg-white p-5 shadow-[0_10px_24px_-20px_rgba(34,24,56,0.36)] sm:p-6">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-[#b42348]" aria-hidden="true" />
              <h2 className="text-lg font-black text-[#1f1a25]">Selected party date</h2>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6c35c3]">Date</p>
                <p className="mt-1 text-base font-semibold text-[#2E2A33]">{slotLabel}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6c35c3]">Time</p>
                <p className="mt-1 text-base font-semibold text-[#2E2A33]">{timeLabel}</p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-[#e7e1f1] bg-white p-5 shadow-[0_10px_24px_-20px_rgba(34,24,56,0.36)] sm:p-6">
            <div className="flex items-center gap-2">
              <PoundSterling className="h-4 w-4 text-[#6c35c3]" aria-hidden="true" />
              <h2 className="text-lg font-black text-[#1f1a25]">Party details</h2>
            </div>

            <div className="mt-4 grid gap-4">
              <label className="space-y-2">
                <span className="text-sm font-semibold text-[#2E2A33]">
                  Number of children attending (min {BIRTHDAY_PARTY_MIN_CHILDREN}, max {BIRTHDAY_PARTY_MAX_CHILDREN})
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={2}
                  value={partySizeInput}
                  onChange={(event) => {
                    const digitsOnly = event.target.value.replace(/\D/g, "");
                    setPartySizeInput(digitsOnly);
                    setFieldErrors((current) => ({ ...current, partySizeInput: undefined }));
                  }}
                  className="h-11 w-full rounded-xl border border-[#d7c7ef] bg-white px-3 text-sm text-[#2a203c] outline-none ring-[#6e2ac0]/25 transition focus:ring-2"
                />
                {fieldErrors.partySizeInput ? (
                  <p className="text-sm font-semibold text-[#b42348]">{fieldErrors.partySizeInput}</p>
                ) : null}
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-[#2E2A33]">Birthday child's first name</span>
                <input
                  type="text"
                  value={birthdayChildFirstName}
                  onChange={(event) => {
                    setBirthdayChildFirstName(event.target.value);
                    setFieldErrors((current) => ({
                      ...current,
                      birthdayChildFirstName: undefined,
                    }));
                  }}
                  className="h-11 w-full rounded-xl border border-[#d7c7ef] bg-white px-3 text-sm text-[#2a203c] outline-none ring-[#6e2ac0]/25 transition focus:ring-2"
                />
                {fieldErrors.birthdayChildFirstName ? (
                  <p className="text-sm font-semibold text-[#b42348]">
                    {fieldErrors.birthdayChildFirstName}
                  </p>
                ) : null}
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-[#2E2A33]">Birthday child's last name</span>
                <input
                  type="text"
                  value={birthdayChildLastName}
                  onChange={(event) => {
                    setBirthdayChildLastName(event.target.value);
                    setFieldErrors((current) => ({
                      ...current,
                      birthdayChildLastName: undefined,
                    }));
                  }}
                  className="h-11 w-full rounded-xl border border-[#d7c7ef] bg-white px-3 text-sm text-[#2a203c] outline-none ring-[#6e2ac0]/25 transition focus:ring-2"
                />
                {fieldErrors.birthdayChildLastName ? (
                  <p className="text-sm font-semibold text-[#b42348]">
                    {fieldErrors.birthdayChildLastName}
                  </p>
                ) : null}
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-[#2E2A33]">Birthday child's date of birth</span>
                <input
                  type="date"
                  value={birthdayChildDateOfBirth}
                  onChange={(event) => {
                    setBirthdayChildDateOfBirth(event.target.value);
                    setFieldErrors((current) => ({
                      ...current,
                      birthdayChildDateOfBirth: undefined,
                    }));
                  }}
                  max={birthdayChildMaxDate}
                  className="h-11 w-full rounded-xl border border-[#d7c7ef] bg-white px-3 text-sm text-[#2a203c] outline-none ring-[#6e2ac0]/25 transition focus:ring-2"
                />
                {fieldErrors.birthdayChildDateOfBirth ? (
                  <p className="text-sm font-semibold text-[#b42348]">
                    {fieldErrors.birthdayChildDateOfBirth}
                  </p>
                ) : null}
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-[#2E2A33]">Health or medical concerns</span>
                <textarea
                  value={healthNotes}
                  onChange={(event) => {
                    setHealthNotes(event.target.value);
                    setFieldErrors((current) => ({
                      ...current,
                      healthNotes: undefined,
                    }));
                  }}
                  rows={4}
                  className="w-full rounded-xl border border-[#d7c7ef] bg-white px-3 py-3 text-sm text-[#2a203c] outline-none ring-[#6e2ac0]/25 transition focus:ring-2"
                  placeholder="Let us know about any allergies, medical conditions, or health concerns."
                />
                {fieldErrors.healthNotes ? (
                  <p className="text-sm font-semibold text-[#b42348]">
                    {fieldErrors.healthNotes}
                  </p>
                ) : null}
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-[#2E2A33]">Special requirements</span>
                <textarea
                  value={specialRequirements}
                  onChange={(event) => {
                    setSpecialRequirements(event.target.value);
                    setFieldErrors((current) => ({
                      ...current,
                      specialRequirements: undefined,
                    }));
                  }}
                  rows={4}
                  className="w-full rounded-xl border border-[#d7c7ef] bg-white px-3 py-3 text-sm text-[#2a203c] outline-none ring-[#6e2ac0]/25 transition focus:ring-2"
                  placeholder="Accessibility requirements, support needs, or anything else we should prepare for."
                />
                {fieldErrors.specialRequirements ? (
                  <p className="text-sm font-semibold text-[#b42348]">
                    {fieldErrors.specialRequirements}
                  </p>
                ) : null}
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-[#2E2A33]">Additional notes for the coaches or club</span>
                <textarea
                  value={additionalNotes}
                  onChange={(event) => setAdditionalNotes(event.target.value)}
                  rows={4}
                  className="w-full rounded-xl border border-[#d7c7ef] bg-white px-3 py-3 text-sm text-[#2a203c] outline-none ring-[#6e2ac0]/25 transition focus:ring-2"
                  placeholder="Anything else you'd like us to know before the party."
                />
              </label>
            </div>
          </section>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[#e7e1f1] bg-white/96 px-4 pb-[calc(0.85rem+env(safe-area-inset-bottom))] pt-3 shadow-[0_-16px_32px_-24px_rgba(34,24,56,0.42)] backdrop-blur">
        <div className="mx-auto flex w-full max-w-[1040px] items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-black uppercase tracking-[0.12em] text-[#6c35c3]">
              Booking Summary
            </p>
            <p className="truncate text-sm font-semibold text-[#2E2A33]">
              {slotLabel} · {timeLabel}
            </p>
            <p className="text-lg font-black tracking-tight text-[#1f1a25]">
              {formatCurrency(pricing.totalAmountPence)}
            </p>
            <p className="text-[11px] text-[#6a5a86]">
              {parsedPartySize === null
                ? "Enter the number of children attending"
                : `${pricing.partySize} child${pricing.partySize === 1 ? "" : "ren"}`}
            </p>
          </div>

          <button
            type="button"
            onClick={handleContinue}
            className="inline-flex h-11 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-full bg-[#6c35c3] px-5 text-sm font-semibold text-white !text-white shadow-[0_12px_24px_-12px_rgba(69,34,124,0.78)] transition hover:bg-[#5b2ca7] disabled:cursor-not-allowed disabled:bg-[#c5addf] disabled:!text-white"
          >
            Review Booking
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  );
}
