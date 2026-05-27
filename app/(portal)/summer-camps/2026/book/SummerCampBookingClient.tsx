"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  Clock3,
  Plus,
  UtensilsCrossed,
} from "lucide-react";
import {
  type SummerCampConfig,
  calculateSummerCampTotal,
  formatCurrency,
  validateSummerCampSelection,
} from "@/lib/summerCamps";

type SummerCampBookingClientProps = {
  camp: SummerCampConfig;
  childId: string;
  children: Array<{
    id: string;
    firstName?: string | null;
    lastName?: string | null;
  }>;
  initialSelectedDayIds: string[];
};

function formatWeekHeading(dateRange: string): string {
  switch (dateRange) {
    case "6th - 10th July":
      return "Monday 6th July - Friday 10th July";
    case "13th - 17th July":
      return "Monday 13th July - Friday 17th July";
    case "27th - 31st July":
      return "Monday 27th July - Friday 31st July";
    default:
      return dateRange;
  }
}

export default function SummerCampBookingClient({
  camp,
  childId,
  children,
  initialSelectedDayIds,
}: SummerCampBookingClientProps) {
  const router = useRouter();
  const [selectedDayIds, setSelectedDayIds] = useState<string[]>(initialSelectedDayIds);
  const childName = useMemo(() => {
    const child = children.find((item) => item.id === childId) ?? null;
    return `${child?.firstName ?? ""} ${child?.lastName ?? ""}`.trim() || "selected child";
  }, [childId, children]);

  const selectedSet = useMemo(() => new Set(selectedDayIds), [selectedDayIds]);
  const validationErrors = useMemo(
    () => validateSummerCampSelection(camp, selectedDayIds),
    [camp, selectedDayIds]
  );
  const totalPrice = useMemo(() => {
    return calculateSummerCampTotal(
      camp.weeks.reduce<Record<string, string[]>>((acc, week) => {
        acc[week.id] = week.days
          .map((day) => day.id)
          .filter((dayId) => selectedSet.has(dayId));
        return acc;
      }, {})
    );
  }, [camp, selectedSet]);
  const totalSavings = useMemo(() => {
    const fullPrice = selectedDayIds.length * (camp.pricing[1] ?? 40);
    return Math.max(0, fullPrice - totalPrice);
  }, [camp.pricing, selectedDayIds.length, totalPrice]);

  const toggleDay = (dayId: string) => {
    setSelectedDayIds((prev) => {
      if (prev.includes(dayId)) {
        return prev.filter((id) => id !== dayId);
      }
      return [...prev, dayId];
    });
  };

  const handleContinue = () => {
    if (selectedDayIds.length === 0) return;
    const days = selectedDayIds.join(",");
    router.push(
      `/summer-camps/2026/summary?childId=${encodeURIComponent(childId)}&days=${encodeURIComponent(days)}`
    );
  };

  return (
    <section className="relative w-full overflow-x-hidden bg-[#faf7fb] px-4 pb-28 pt-4 sm:px-6 sm:pb-32 sm:pt-6 lg:pb-12">
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
        <header className="space-y-3 sm:space-y-4">
          <div className="pl-4">
            <p className="text-[1.75rem] font-black uppercase tracking-[0.04em] text-[#b42348] sm:text-[2.1rem]">
              Summer Camp 2026
            </p>
          </div>
          <div className="pl-4">
            <div className="px-0.5 py-0.5">
              <div className="inline-flex items-center rounded-full border border-[#6c35c3]/25 bg-white/85 px-4 py-1.5 text-sm font-semibold uppercase tracking-[0.18em] text-[#2a203c]/70 shadow-[0_12px_28px_-18px_rgba(31,26,37,0.5)] backdrop-blur">
                Booking for{" "}
                <span className="ml-1 font-bold text-[#2a203c]">
                  {childName}
                </span>
              </div>
            </div>
          </div>
          <div className="pl-4">
            <Link
              href="/account"
              className="inline-flex items-center gap-2 rounded-full border border-[#d8c7f4] bg-white px-4 py-2 text-sm font-semibold text-[#5b2ca7] transition hover:bg-[#faf6ff]"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back to account
            </Link>
          </div>
          <div className="pl-4 pt-3 sm:pt-5">
            <div className="max-w-4xl border-b border-[#d9cdef] pb-4">
              <p className="text-sm leading-7 text-[#2E2A33]/76 sm:text-[15px]">
                Our Summer Camps run from 6th July to 31st July, from 10am-3pm
                each day, and are open to children aged 4 and up. Camps are
                designed to keep children active, engaged, and having fun
                throughout the summer in a safe and supportive environment.
                Each day includes gymnastics, games, skill-based activities,
                and plenty of opportunities to build confidence, coordination,
                fitness, and friendships. Children should bring a packed lunch
                each day.
              </p>
            </div>
          </div>
        </header>

        {selectedDayIds.length > 0 && validationErrors.length > 0 ? (
          <div className="rounded-2xl border border-[#f2c7cf] bg-[#fff4f6] p-4 text-sm text-[#7a2334]">
            <div className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <div className="space-y-1">
                <p className="font-semibold">Please fix the following before continuing:</p>
                <ul className="list-disc pl-5">
                  {validationErrors.map((error) => (
                    <li key={error}>{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ) : null}

        <div className="space-y-4">
            <section className="rounded-[1.75rem] border border-[#e7e1f1] bg-white px-4 py-3 shadow-[0_16px_34px_-30px_rgba(34,24,56,0.2)] sm:px-5 sm:py-4">
              <div className="grid divide-y divide-[#ece3f4] sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                <article className="flex items-center gap-4 px-2 py-4 sm:px-4 sm:py-3">
                  <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#e5d8f4] bg-[#faf7ff] text-[#6c35c3]">
                    <CalendarDays className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[#6c35c3]">
                      Age Group
                    </p>
                    <p className="mt-1 text-base font-black tracking-tight text-[#1f1a25]">
                      Ages 4 and up
                    </p>
                    <p className="mt-1 text-sm leading-6 text-[#2E2A33]/68">
                      Suitable for children aged four and above.
                    </p>
                  </div>
                </article>

                <article className="flex items-center gap-4 px-2 py-4 sm:px-4 sm:py-3">
                  <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#f1d7df] bg-[#fff8fa] text-[#b42348]">
                    <UtensilsCrossed className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[#b42348]">
                      Packed Lunch
                    </p>
                    <p className="mt-1 text-base font-black tracking-tight text-[#1f1a25]">
                      Bring lunch each day
                    </p>
                    <p className="mt-1 text-sm leading-6 text-[#2E2A33]/68">
                      Children should arrive with a packed lunch and drinks.
                    </p>
                  </div>
                </article>

                <article className="flex items-center gap-4 px-2 py-4 sm:px-4 sm:py-3">
                  <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#dce8f8] bg-[#f7fbff] text-[#2459a6]">
                    <Clock3 className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[#2459a6]">
                      Camp Hours
                    </p>
                    <p className="mt-1 text-base font-black tracking-tight text-[#1f1a25]">
                      10am to 3pm
                    </p>
                    <p className="mt-1 text-sm leading-6 text-[#2E2A33]/68">
                      Each camp day runs from 10am until 3pm.
                    </p>
                  </div>
                </article>
              </div>
            </section>

            {camp.weeks.map((week) => {
              const weekHeading = formatWeekHeading(week.dateRange);

              return (
                <section
                  key={week.id}
                  className="pt-4 first:pt-0"
                >
                  <div className="px-1 sm:px-1.5">
                    <div className="flex flex-wrap items-center justify-between gap-3 lg:mx-auto lg:w-[96%] lg:max-w-[980px]">
                      <h2 className="flex items-center gap-1.5 text-[19px] font-black text-[#143271] sm:text-[20px]">
                        <CalendarDays className="h-4 w-4 text-[#8f88a3]" aria-hidden="true" />
                        {weekHeading}
                      </h2>
                    </div>

                    <div className="relative mt-3 space-y-1 pl-8 lg:mx-auto lg:w-[96%] lg:max-w-[980px] lg:pl-5">
                      <span
                        aria-hidden="true"
                        className="absolute left-[11px] top-1.5 bottom-1.5 w-0 rounded-full border-l-2 border-dashed border-[#b7accf] lg:left-[8px]"
                      />
                      {week.days.map((day) => {
                        const selected = selectedSet.has(day.id);

                        return (
                          <button
                            key={day.id}
                            type="button"
                            onClick={() => toggleDay(day.id)}
                            aria-pressed={selected}
                            className={`group relative grid min-h-[92px] w-full cursor-pointer grid-cols-[minmax(0,1fr)_112px] items-center gap-x-3 overflow-hidden rounded-2xl border border-[#e7e1f1] bg-white px-3 py-2.5 text-left shadow-[0_10px_24px_-20px_rgba(34,24,56,0.36)] transition-[background-color,border-color,box-shadow,transform] duration-200 ease-out active:scale-[0.99] sm:px-3 lg:grid-cols-[minmax(0,1fr)_128px] ${
                              selected
                                ? "border-transparent bg-white shadow-[0_12px_28px_-18px_rgba(58,32,96,0.4)]"
                                : "hover:-translate-y-[1px] hover:border-[#d4c5ea] hover:bg-[#fcfbff] hover:shadow-[0_14px_30px_-18px_rgba(46,28,76,0.38)]"
                            }`}
                          >
                            <span
                              aria-hidden="true"
                              className={`pointer-events-none absolute inset-0 rounded-2xl bg-[linear-gradient(90deg,#6c35c3_0%,#7a49cf_34%,#9f79dc_58%,#d8c6f1_78%,#ffffff_100%)] transition-transform duration-400 ease-out ${
                                selected ? "scale-x-100 opacity-80" : "scale-x-0 opacity-0 group-hover:scale-x-100 group-hover:opacity-42"
                              } origin-left`}
                            />

                            <div className="relative z-10 min-w-0 py-1 text-left">
                              <p className={`text-[20px] font-bold tracking-tight transition-colors duration-300 ${
                                selected ? "text-white" : "text-[#1f1a25]"
                              }`}>
                                {day.label}
                              </p>
                            </div>

                            <div className="relative z-10 flex h-full items-center justify-end">
                              <span
                                className={`inline-flex h-8 w-[104px] items-center justify-center gap-1.5 rounded-full border px-3 text-xs font-semibold transition-all duration-180 ${
                                  selected
                                    ? "border-[#c4b3dc] bg-white text-[#4c3f62] shadow-[0_0_0_2px_rgba(124,106,147,0.14)]"
                                    : "border-[#d4c7e6] bg-white text-[#4c3f62] hover:border-[#c4b3dc] hover:bg-[#f7f4fb]"
                                }`}
                              >
                                {selected ? (
                                  <>
                                    <Check className="h-3.5 w-3.5" aria-hidden="true" />
                                    <span>Selected</span>
                                  </>
                                ) : (
                                  <>
                                    <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                                    <span>Select</span>
                                  </>
                                )}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </section>
              );
            })}
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[#e7e1f1] bg-white/96 px-4 pb-[calc(0.85rem+env(safe-area-inset-bottom))] pt-3 shadow-[0_-16px_32px_-24px_rgba(34,24,56,0.42)] backdrop-blur">
        <div className="mx-auto flex w-full max-w-[1040px] items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-black uppercase tracking-[0.12em] text-[#6c35c3]">
              Booking Total
            </p>
            <p className="text-lg font-black tracking-tight text-[#1f1a25]">
              {formatCurrency(totalPrice)}
              {totalSavings > 0 ? (
                <span className="ml-2 text-sm font-semibold text-[#6a5a86]">
                  (Saving {formatCurrency(totalSavings)})
                </span>
              ) : null}
            </p>
            {selectedDayIds.length === 0 ? (
              <p className="text-[11px] text-[#6a5a86]">Select at least one day to continue.</p>
            ) : null}
          </div>

          <button
            type="button"
            onClick={handleContinue}
            disabled={selectedDayIds.length === 0 || validationErrors.length > 0}
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
