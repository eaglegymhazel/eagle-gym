"use client";

import { useState } from "react";

type PickupSetting = "Yes" | "No";

function pickupSummary(pickedUp: PickupSetting): string {
  return pickedUp === "Yes" ? "Must be collected" : "May leave unattended";
}

export default function PickupRequirementControl({
  childId,
  initialPickedUp,
}: {
  childId: string;
  initialPickedUp: string | null;
}) {
  const [pickedUp, setPickedUp] = useState<PickupSetting>(
    initialPickedUp === "No" ? "No" : "Yes"
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updatePickupSetting = async (nextValue: PickupSetting) => {
    if (isSaving || nextValue === pickedUp) return;

    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/student-pickup-requirement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ childId, pickedUp: nextValue }),
      });
      const payload = (await response.json()) as {
        ok?: boolean;
        child?: { pickedUp?: string | null };
        error?: string;
      };

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error ?? "Collection setting could not be updated.");
      }

      setPickedUp(payload.child?.pickedUp === "No" ? "No" : "Yes");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Collection setting could not be updated."
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mt-1 flex flex-col gap-2">
      <span className="text-sm font-medium text-[#221833]">
        {pickupSummary(pickedUp)}
      </span>
      <div className="flex flex-wrap gap-2">
        {[
          { value: "Yes" as const, label: "Must be collected" },
          { value: "No" as const, label: "May leave unattended" },
        ].map((option) => {
          const isSelected = pickedUp === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                void updatePickupSetting(option.value);
              }}
              disabled={isSaving}
              className={[
                "min-h-8 border px-2.5 text-xs font-semibold transition",
                isSelected
                  ? "border-[#6e2ac0] bg-[#f1e8ff] text-[#4f2390]"
                  : "border-[#d9cfee] bg-white text-[#655779] hover:bg-[#f8f5fc]",
                isSaving ? "cursor-not-allowed opacity-60" : "cursor-pointer",
              ].join(" ")}
            >
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
