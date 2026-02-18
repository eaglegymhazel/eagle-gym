"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowLeft, Trash2 } from "lucide-react";
import { DAY_SHORT, formatTime, getAvailabilityState } from "../utils";
import { getReviewValidation } from "./validation";

export type ReviewClassItem = {
  id: string;
  name: string;
  weekday: string;
  startTime: string;
  endTime: string;
  durationMinutes: number | null;
  spotsLeft: number | null;
  isCompetitionClass: boolean;
  isUnavailable: boolean;
  ageInvalid: boolean;
};

type ReviewClientProps = {
  childId: string;
  childName: string;
  initialItems: ReviewClassItem[];
  initialBackHref: string;
  hasDuplicateSelections: boolean;
  showDebug: boolean;
};

function badgeStyles(spotsLeft: number | null, unavailable: boolean): string {
  if (unavailable || (spotsLeft != null && spotsLeft <= 0)) {
    return "bg-[#ffe8eb] text-[#9f2338] border-[#f3b3bf]";
  }
  if (spotsLeft != null && spotsLeft <= 5) {
    return "bg-[#fff3df] text-[#9a5b08] border-[#f0d2a3]";
  }
  return "bg-[#e9f7ec] text-[#256a38] border-[#b8e2c1]";
}

export default function ReviewClient({
  childId,
  childName,
  initialItems,
  initialBackHref,
  hasDuplicateSelections,
  showDebug,
}: ReviewClientProps) {
  const router = useRouter();
  const [items, setItems] = useState<ReviewClassItem[]>(initialItems);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validation = useMemo(
    () =>
      getReviewValidation({
        hasChildId: !!childId,
        hasDuplicateSelections,
        selectedItems: items.map((item) => ({
          id: item.id,
          isUnavailable: item.isUnavailable,
          isCompetitionClass: item.isCompetitionClass,
          ageInvalid: item.ageInvalid,
        })),
      }),
    [childId, hasDuplicateSelections, items]
  );

  const selectedCount = items.length;
  const selectedClassIds = items.map((item) => item.id);
  const backHref = useMemo(() => {
    if (!childId) return initialBackHref;
    const classIdsPart =
      selectedClassIds.length > 0
        ? `&classIds=${encodeURIComponent(selectedClassIds.join(","))}`
        : "";
    return `/book/recreational?childId=${encodeURIComponent(childId)}${classIdsPart}`;
  }, [childId, initialBackHref, selectedClassIds]);

  const handleRemove = (classId: string) => {
    setItems((prev) => prev.filter((item) => item.id !== classId));
  };

  const handleContinue = () => {
    if (!validation.canContinue || isSubmitting) return;
    setIsSubmitting(true);
    const intentId =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `intent-${Date.now()}`;
    const classIdsParam = encodeURIComponent(selectedClassIds.join(","));
    router.push(
      `/book/recreational/confirm?childId=${encodeURIComponent(
        childId
      )}&classIds=${classIdsParam}&intentId=${encodeURIComponent(intentId)}`
    );
  };

  return (
    <section className="w-full bg-[#faf7fb] px-4 pb-12 pt-8 sm:px-6 sm:pt-10">
      <div className="mx-auto w-full max-w-[1040px] space-y-6">
        <div className="rounded-2xl border border-[#e7dcf6] bg-white p-5 shadow-[0_18px_35px_-28px_rgba(43,29,63,0.5)] sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#6e2ac0]">
            Review & Confirm
          </p>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-[#1f1a25] sm:text-3xl">
            Recreational booking review
          </h1>
          <p className="mt-2 text-sm text-[#2E2A33]/75 sm:text-base">
            Booking for <span className="font-semibold text-[#2E2A33]">{childName || "Selected child"}</span>
          </p>
          {showDebug ? (
            <details className="mt-3 rounded-xl border border-dashed border-[#d9c8f1] bg-[#fcf9ff] px-3 py-2 text-xs text-[#5f4a82]">
              <summary className="cursor-pointer font-semibold">Debug details</summary>
              <p className="mt-2 break-all">childId: {childId}</p>
            </details>
          ) : null}
        </div>

        <div className="flex items-center justify-between gap-4">
          <a
            href={backHref}
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#6e2ac0] hover:underline"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to class selection
          </a>
        </div>

        {validation.errors.length > 0 ? (
          <div className="rounded-2xl border border-[#f2c7cf] bg-[#fff4f6] p-4 text-sm text-[#7a2334]">
            <div className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <div className="space-y-1">
                <p className="font-semibold">
                  {selectedCount === 0
                    ? "Please resolve the following before continuing:"
                    : "Please fix the following before continuing:"}
                </p>
                <ul className="list-disc pl-5">
                  {validation.errors.map((error) => (
                    <li key={error}>{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-4">
            {items.length === 0 ? (
              <div className="rounded-2xl border border-[#e8ddf8] bg-white p-6 text-center shadow-[0_14px_30px_-24px_rgba(42,32,60,0.42)]">
                <p className="text-base font-semibold text-[#2E2A33]">
                  No classes selected.
                </p>
              </div>
            ) : (
              items.map((item) => {
                const availability = getAvailabilityState(item.spotsLeft);
                const spotLabel =
                  item.isUnavailable || item.spotsLeft === 0
                    ? "No longer available"
                    : availability.label;

                return (
                  <article
                    key={item.id}
                    className="rounded-2xl border border-[#e8ddf8] bg-white p-4 shadow-[0_14px_30px_-24px_rgba(42,32,60,0.42)] sm:p-5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="space-y-2">
                        <p className="text-sm font-semibold uppercase tracking-[0.08em] text-[#6e2ac0]">
                          {DAY_SHORT[item.weekday] ?? item.weekday} · {formatTime(item.startTime)}
                        </p>
                        <h2 className="text-xl font-bold tracking-tight text-[#1f1a25]">
                          {item.name}
                        </h2>
                        <p className="text-sm text-[#2E2A33]/75">
                          {item.startTime && item.endTime
                            ? `${formatTime(item.startTime)}-${formatTime(item.endTime)}`
                            : "Time to be confirmed"}
                          {item.durationMinutes ? ` · ${item.durationMinutes} min` : ""}
                        </p>
                        <span
                          className={[
                            "inline-flex rounded-full border px-3 py-1 text-xs font-semibold",
                            badgeStyles(item.spotsLeft, item.isUnavailable),
                          ].join(" ")}
                        >
                          {spotLabel}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemove(item.id)}
                        className="inline-flex items-center gap-1.5 rounded-full border border-[#d9c8f1] px-3 py-1.5 text-xs font-semibold text-[#5a2ca4] transition hover:bg-[#f6f0ff]"
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                        Remove
                      </button>
                    </div>
                  </article>
                );
              })
            )}
          </div>

          <aside className="lg:sticky lg:top-28 lg:self-start">
            <div className="rounded-2xl border border-[#e8ddf8] bg-white p-5 shadow-[0_14px_30px_-24px_rgba(42,32,60,0.42)]">
              <h2 className="text-lg font-black text-[#1f1a25]">Summary</h2>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <dt className="text-[#2E2A33]/70">Selected classes</dt>
                  <dd className="font-semibold text-[#2E2A33]">{selectedCount}</dd>
                </div>
                <div className="rounded-xl border border-dashed border-[#d9c8f1] bg-[#fcf9ff] px-3 py-2 text-xs text-[#5f4a82]">
                  Pricing will be confirmed at checkout.
                </div>
              </dl>

              <div className="mt-5 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={handleContinue}
                  disabled={!validation.canContinue || isSubmitting}
                  className="inline-flex h-11 items-center justify-center rounded-full bg-[#6e2ac0] px-5 text-sm font-semibold text-white !text-white transition hover:bg-[#6325ad] disabled:cursor-not-allowed disabled:bg-[#c5addf] disabled:!text-white"
                >
                  {isSubmitting ? "Continuing..." : "Confirm Booking"}
                </button>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}



