"use client";

import { useMemo, useState } from "react";
import { AlertCircle, ArrowLeft, Trash2 } from "lucide-react";
import { DAY_SHORT, formatTime, getAvailabilityState } from "../../recreational/utils";
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
  const availability = getAvailabilityState(spotsLeft);
  if (unavailable || availability.variant === "full") {
    return "bg-[#ffe8eb] text-[#9f2338] border-[#f3b3bf]";
  }
  if (availability.variant === "critical") {
    return "bg-[#ffe8eb] text-[#9f2338] border-[#f3b3bf]";
  }
  if (availability.variant === "low") {
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
  const [items, setItems] = useState<ReviewClassItem[]>(initialItems);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

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
    return `/book/competition?childId=${encodeURIComponent(childId)}${classIdsPart}`;
  }, [childId, initialBackHref, selectedClassIds]);

  const handleRemove = (classId: string) => {
    setItems((prev) => prev.filter((item) => item.id !== classId));
  };

  const handleContinue = async () => {
    if (!validation.canContinue || isSubmitting) return;
    setIsSubmitting(true);
    setCheckoutError("Competition checkout flow is not connected yet.");
    setIsSubmitting(false);
  };

  return (
    <section className="relative w-full overflow-hidden bg-[#faf7fb] px-4 pb-12 pt-4 sm:px-6 sm:pt-6">
      <div className="pointer-events-none absolute inset-0 hidden lg:block">
        <div className="absolute inset-y-0 left-0 right-[calc(50%+32rem)]">
          <div className="absolute inset-y-[7%] left-2 w-px bg-[#6c35c3]/22" />
          <div className="absolute inset-y-[15%] left-6 w-px bg-[#6c35c3]/10" />
          <div className="absolute inset-y-[10%] left-12 w-[2px] bg-[#6c35c3]/18" />
          <div className="absolute inset-y-[20%] left-[74px] w-px bg-[#6c35c3]/8" />
        </div>
        <div className="absolute inset-y-0 left-[calc(50%+32rem)] right-0">
          <div className="absolute inset-y-[8%] right-2 w-px bg-[#6c35c3]/20" />
          <div className="absolute inset-y-[13%] right-7 w-[2px] bg-[#6c35c3]/26" />
          <div className="absolute inset-y-[22%] right-12 w-px bg-[#6c35c3]/9" />
        </div>
      </div>

      <div className="relative z-10 mx-auto w-full max-w-[1040px] space-y-5 sm:space-y-6">
        <header className="space-y-2">
          <div className="px-0.5 py-0.5">
            <div className="inline-flex items-center rounded-full border border-[#6c35c3]/25 bg-white/85 px-4 py-1.5 text-sm font-semibold uppercase tracking-[0.18em] text-[#2a203c]/70 shadow-[0_12px_28px_-18px_rgba(31,26,37,0.5)] backdrop-blur">
              Booking for{" "}
              <span className="ml-1 font-bold text-[#2a203c]">
                {childName || "selected child"}
              </span>
            </div>
          </div>
          <p className="pl-4 text-sm font-semibold text-[#2a203c]">
            Class type: <span className="font-bold">Competition</span>
          </p>
          <p className="pl-4 text-sm font-semibold text-[#2a203c]">
            Stage: <span className="font-bold">Review and confirm</span>
          </p>
          <div className="pt-1">
            <div className="h-[0.5px] w-full bg-black/20" />
          </div>
          {showDebug ? (
            <details className="rounded-xl border border-dashed border-[#d9c8f1] bg-[#fcf9ff] px-3 py-2 text-xs text-[#5f4a82]">
              <summary className="cursor-pointer font-semibold">Debug details</summary>
              <p className="mt-2 break-all">childId: {childId}</p>
            </details>
          ) : null}
        </header>

        <div className="flex items-center justify-between gap-4">
          <a
            href={backHref}
            className="inline-flex items-center gap-2 rounded-full border border-[#d8c7f4] bg-white px-4 py-2 text-sm font-semibold text-[#5b2ca7] transition hover:bg-[#faf6ff]"
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
        {checkoutError ? (
          <div className="rounded-2xl border border-[#f2c7cf] bg-[#fff4f6] p-4 text-sm text-[#7a2334]">
            <div className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <p className="font-semibold">{checkoutError}</p>
            </div>
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-4">
            {items.length === 0 ? (
              <div className="rounded-2xl border border-[#e7e1f1] bg-white p-6 text-center shadow-[0_10px_24px_-20px_rgba(34,24,56,0.36)]">
                <p className="text-base font-semibold text-[#2E2A33]">No classes selected.</p>
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
                    className="relative rounded-2xl border border-[#e7e1f1] bg-white p-4 shadow-[0_10px_24px_-20px_rgba(34,24,56,0.36)] transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-[1px] hover:border-[#d4c5ea] hover:shadow-[0_14px_30px_-18px_rgba(46,28,76,0.38)] sm:p-5"
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
                        className="inline-flex items-center gap-1.5 rounded-full border border-[#d4c7e6] bg-white px-3 py-1.5 text-xs font-semibold text-[#4c3f62] transition hover:border-[#c4b3dc] hover:bg-[#f7f4fb]"
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
            <div className="rounded-2xl border border-[#e7e1f1] bg-white p-5 shadow-[0_10px_24px_-20px_rgba(34,24,56,0.36)]">
              <h2 className="text-lg font-black text-[#1f1a25]">Summary</h2>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <dt className="text-[#2E2A33]/70">Selected classes</dt>
                  <dd className="font-semibold text-[#2E2A33]">{selectedCount}</dd>
                </div>
                <div className="rounded-xl border border-dashed border-[#d9c8f1] bg-[#fcf9ff] px-3 py-2 text-xs text-[#5f4a82]">
                  Competition checkout will be connected next.
                </div>
              </dl>

              <div className="mt-5 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={handleContinue}
                  disabled={!validation.canContinue || isSubmitting}
                  className="inline-flex h-11 items-center justify-center rounded-full bg-[#6c35c3] px-5 text-sm font-semibold text-white !text-white shadow-[0_12px_24px_-12px_rgba(69,34,124,0.78)] transition hover:bg-[#5b2ca7] disabled:cursor-not-allowed disabled:bg-[#c5addf] disabled:!text-white"
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

