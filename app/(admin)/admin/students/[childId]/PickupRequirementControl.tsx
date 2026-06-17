"use client";

import { useState } from "react";
import { Check } from "lucide-react";

type PickupSetting = "Yes" | "No";

function normalizePickupSetting(value: string | null | undefined): PickupSetting {
  return value?.trim().toLowerCase() === "no" ? "No" : "Yes";
}

export default function PickupRequirementControl({
  childId,
  initialPickedUp,
}: {
  childId: string;
  initialPickedUp: string | null;
}) {
  const [pickedUp, setPickedUp] = useState<PickupSetting>(() =>
    normalizePickupSetting(initialPickedUp)
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

      setPickedUp(normalizePickupSetting(payload.child?.pickedUp));
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
      <div className="grid w-full max-w-md grid-cols-2 gap-2">
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
