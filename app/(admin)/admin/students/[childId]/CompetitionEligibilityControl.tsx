"use client";

import { useState } from "react";
import { Check } from "lucide-react";

type CompetitionEligibilitySetting = "eligible" | "not-eligible";

const competitionOptions = [
  { value: "eligible" as const, label: "Eligible" },
  { value: "not-eligible" as const, label: "Not eligible" },
];

export default function CompetitionEligibilityControl({
  childId,
  initialCompetitionEligible,
}: {
  childId: string;
  initialCompetitionEligible: boolean;
}) {
  const [competitionEligible, setCompetitionEligible] = useState(initialCompetitionEligible);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateEligibility = async (nextSetting: CompetitionEligibilitySetting) => {
    const nextValue = nextSetting === "eligible";
    if (isSaving || nextValue === competitionEligible) return;

    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/student-competition-eligibility", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          childId,
          competitionEligible: nextValue,
        }),
      });

      const payload = (await response.json()) as {
        ok?: boolean;
        child?: { competitionEligible?: boolean | null };
        error?: string;
      };

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error ?? "Competition eligibility could not be updated.");
      }

      setCompetitionEligible(payload.child?.competitionEligible === true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Competition eligibility could not be updated."
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mt-1 flex flex-col gap-2">
      <div className="grid w-full max-w-md grid-cols-2 gap-2">
        {competitionOptions.map((option) => {
          const isSelected =
            (option.value === "eligible" && competitionEligible) ||
            (option.value === "not-eligible" && !competitionEligible);

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                void updateEligibility(option.value);
              }}
              disabled={isSaving || isSelected}
              aria-pressed={isSelected}
              className={[
                "inline-flex min-h-9 items-center justify-center gap-1.5 border px-2 text-center text-xs font-semibold transition sm:px-3",
                isSelected
                  ? "border-[#4f2390] bg-[#4f2390] text-white shadow-[0_1px_0_rgba(255,255,255,0.18)_inset]"
                  : "border-[#d9cfee] bg-white text-[#655779] hover:border-[#c7b4e5] hover:bg-[#f8f5fc] hover:text-[#4f2390]",
                isSaving
                  ? "cursor-not-allowed opacity-60"
                  : isSelected
                    ? "cursor-default"
                    : "cursor-pointer",
              ].join(" ")}
            >
              {isSelected ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : null}
              {option.label}
            </button>
          );
        })}
      </div>
      {isSaving ? <p className="text-xs text-[#6f6287]">Saving...</p> : null}
      {error ? <p className="text-xs font-medium text-[#a72020]">{error}</p> : null}
    </div>
  );
}
