"use client";

import { useState } from "react";
import { CreditCard } from "lucide-react";
import TermsAcceptance from "@/app/(portal)/book/components/TermsAcceptance";

type SummerCampCheckoutButtonProps = {
  childId: string;
  selectedDayIds: string[];
};

export default function SummerCampCheckoutButton({
  childId,
  selectedDayIds,
}: SummerCampCheckoutButtonProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(false);

  const handleCheckout = async () => {
    if (isSubmitting || !childId || selectedDayIds.length === 0) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/checkout/summer-camp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          childId,
          selectedDayIds,
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
    <div className="mt-5 flex flex-col gap-2">
      <button
        type="button"
        onClick={handleCheckout}
        disabled={isSubmitting || !childId || selectedDayIds.length === 0 || !hasAcceptedTerms}
        className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-full bg-[#6c35c3] px-5 text-sm font-semibold text-white !text-white shadow-[0_12px_24px_-12px_rgba(69,34,124,0.78)] transition hover:bg-[#5b2ca7] disabled:cursor-not-allowed disabled:bg-[#c5addf] disabled:!text-white"
      >
        <CreditCard className="h-4 w-4" aria-hidden="true" />
        {isSubmitting ? "Preparing Payment..." : "Proceed to Payment"}
      </button>
      <div className="pl-2">
        <TermsAcceptance
          accepted={hasAcceptedTerms}
          onAccept={() => setHasAcceptedTerms(true)}
          title="Summer Camp Terms"
          intro="Please review the current summer camp booking note before continuing to payment."
          warningText={null}
          sections={[
            {
              title: "Packed lunch required",
              body:
                "Each child attending summer camp must bring a packed lunch with them for the day.",
            },
          ]}
        />
      </div>
      {error ? <p className="text-[11px] text-[#7a2334]">{error}</p> : null}
    </div>
  );
}
