"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
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
  const isSwitchingChild = pendingChildId !== null && pendingChildId !== childId;

  const handleSelectChild = (newChildId: string) => {
    setPendingChildId(newChildId);
    window.location.replace(`/book?childId=${encodeURIComponent(newChildId)}`);
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
      <BookingGateway
        childId={childId}
        competitionEligible={competitionEligible}
        isSwitchingChild={isSwitchingChild}
      />
    </div>
  );
}
