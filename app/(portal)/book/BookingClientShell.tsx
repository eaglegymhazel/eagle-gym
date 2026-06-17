"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowLeft, ArrowRight } from "lucide-react";
import BookingGateway from "./BookingGateway";
import BookingChildPicker from "./BookingChildPicker";

type ChildItem = {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  dateOfBirth?: string | null;
};

type BookingClientShellProps = {
  childId: string;
  childName: string;
  children: ChildItem[];
  competitionEligible: boolean;
};

export default function BookingClientShell({
  childId,
  children,
  competitionEligible,
}: BookingClientShellProps) {
  const router = useRouter();
  const [pendingChildId, setPendingChildId] = useState<string | null>(null);
  const [summerCampWarning, setSummerCampWarning] = useState<string | null>(null);
  const isSwitchingChild = pendingChildId !== null && pendingChildId !== childId;

  const handleSelectChild = (newChildId: string) => {
    setSummerCampWarning(null);
    setPendingChildId(newChildId);
    window.location.replace(`/book?childId=${encodeURIComponent(newChildId)}`);
  };

  const selectedChild = children.find((item) => item.id === childId) ?? null;

  const handleSummerCampClick = () => {
    const dateOfBirth = selectedChild?.dateOfBirth ?? null;
    if (dateOfBirth) {
      const birthDate = new Date(dateOfBirth);
      if (!Number.isNaN(birthDate.getTime())) {
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const hasBirthdayPassed =
          today.getMonth() > birthDate.getMonth() ||
          (today.getMonth() === birthDate.getMonth() &&
            today.getDate() >= birthDate.getDate());

        if (!hasBirthdayPassed) {
          age -= 1;
        }

        if (age < 4) {
          setSummerCampWarning(
            "Summer camp is only available for students aged 4 and over."
          );
          return;
        }
      }
    }

    setSummerCampWarning(null);
    window.location.assign(`/summer-camps/2026/book?childId=${encodeURIComponent(childId)}`);
  };

  return (
    <div className="w-full">
      <div className="mb-4">
        <button
          type="button"
          onClick={() => router.push("/account")}
          className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-none border border-[#cdbce8] bg-[#f7f2ff] px-4 text-sm font-semibold text-[#4f2390] transition hover:border-[#b398dd] hover:bg-[#f1e8ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6e2ac0]/35"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to account
        </button>
      </div>
      <div className="mb-6 mt-1">
        <BookingChildPicker
          childId={childId}
          childOptions={children}
          onSelectChild={handleSelectChild}
        />
      </div>
      <div className="mb-6">
        <div className="overflow-hidden rounded-[20px] border border-[#ffb7c3] bg-[linear-gradient(90deg,rgba(150,19,45,0.96)_0%,rgba(194,28,63,0.96)_50%,rgba(228,68,87,0.96)_100%)] bg-clip-padding px-3 py-3 text-white shadow-[0_18px_34px_-22px_rgba(92,16,32,0.68)] sm:px-4 sm:py-3.5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <div className="min-w-0">
              <p className="text-[11px] font-black uppercase tracking-[0.14em] text-white/78">
                Summer Camp 2026
              </p>
              <p className="mt-1 text-sm font-semibold leading-5 text-white sm:text-[15px]">
                Click here to book into the 2026 summer camp.
              </p>
            </div>

            <button
              type="button"
              onClick={handleSummerCampClick}
              className="group relative inline-flex h-10 shrink-0 cursor-pointer items-center justify-center gap-1.5 overflow-hidden rounded-full border border-white/70 bg-[#fff4f6]/95 bg-[linear-gradient(90deg,#a91f42,#c62855,#e44d6f)] [background-position:left_center] [background-repeat:no-repeat] [background-size:0%_100%] px-4 text-[11px] font-black uppercase tracking-[0.08em] text-[#991b3d] shadow-[0_10px_22px_-16px_rgba(92,16,32,0.48)] transition-[transform,border-color,box-shadow,background-size,color] duration-320 ease-out hover:-translate-y-[2px] hover:border-white/80 hover:[background-size:100%_100%] hover:shadow-[0_14px_28px_-18px_rgba(92,16,32,0.58)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            >
              <span className="relative z-10 transition-colors duration-300 ease-out group-hover:text-white">
                Book Summer Camp
              </span>
              <ArrowRight
                className="relative z-10 h-3.5 w-3.5 transition-[transform,color] duration-320 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-0.5 group-hover:text-white"
                aria-hidden="true"
              />
            </button>
          </div>
        </div>
        {summerCampWarning ? (
          <div className="mt-3 rounded-2xl border border-[#f2c7cf] bg-[#fff4f6] px-4 py-3 text-sm text-[#7a2334]">
            <div className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <p className="font-semibold">{summerCampWarning}</p>
            </div>
          </div>
        ) : null}
      </div>
      <BookingGateway
        childId={childId}
        competitionEligible={competitionEligible}
        isSwitchingChild={isSwitchingChild}
      />
    </div>
  );
}
