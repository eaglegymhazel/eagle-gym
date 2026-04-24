"use client";

import { useState } from "react";

function competitionSummary(competitionEligible: boolean): string {
  return competitionEligible ? "Eligible" : "Not eligible";
}

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

  const toggleEligibility = async () => {
    if (isSaving) return;

    const nextValue = !competitionEligible;
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
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-[#221833]">
          {competitionSummary(competitionEligible)}
        </span>
        <button
          type="button"
          onClick={() => {
            void toggleEligibility();
          }}
          disabled={isSaving}
          className={[
            "h-8 border px-2.5 text-xs font-semibold transition",
            !isSaving
              ? "cursor-pointer border-[#c7b4e5] bg-[#f7f2ff] text-[#4f2390] hover:border-[#b398dd] hover:bg-[#f1e8ff]"
              : "cursor-not-allowed border-[#e9e4f0] bg-[#f8f6fb] text-[#a095b0]",
          ].join(" ")}
        >
          {isSaving
            ? "Saving..."
            : competitionEligible
              ? "Mark not eligible"
              : "Mark eligible"}
        </button>
      </div>
      {error ? <p className="text-xs font-medium text-[#a72020]">{error}</p> : null}
    </div>
  );
}
