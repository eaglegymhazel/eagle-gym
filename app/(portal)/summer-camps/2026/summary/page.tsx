import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getBookingContext } from "@/lib/server/bookingContext";
import {
  SUMMER_CAMP_2026,
  calculateSummerCampTotal,
  buildSummerCampSelectionByWeek,
  formatCurrency,
  getSummerCampSelectionSummary,
  parseSummerCampSelection,
  validateSummerCampSelection,
} from "@/lib/summerCamps";
import SummerCampCheckoutButton from "./SummerCampCheckoutButton";

type SearchParams = {
  childId?: string;
  days?: string;
};

function ErrorState({
  title,
  message,
  backHref,
}: {
  title: string;
  message: string;
  backHref: string;
}) {
  return (
    <section className="w-full bg-[#faf7fb] px-4 pb-12 pt-8 sm:px-6 sm:pt-10">
      <div className="mx-auto w-full max-w-3xl rounded-2xl border border-[#f3ccd5] bg-[#fff5f7] p-6 shadow-[0_14px_30px_-24px_rgba(42,32,60,0.42)]">
        <h1 className="text-2xl font-black tracking-tight text-[#7b2437] sm:text-3xl">{title}</h1>
        <p className="mt-2 text-sm text-[#7b2437]/80 sm:text-base">{message}</p>
        <div className="mt-5">
          <Link
            href={backHref}
            className="inline-flex h-11 items-center justify-center rounded-full border border-[#d8c7f4] bg-white px-5 text-sm font-semibold text-[#5b2ca7] transition hover:bg-[#faf6ff]"
          >
            Back to booking
          </Link>
        </div>
      </div>
    </section>
  );
}

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

export default async function SummerCampSummaryPage({
  searchParams,
}: {
  searchParams?: SearchParams | Promise<SearchParams>;
}) {
  const resolvedSearchParams = await searchParams;
  const childId = resolvedSearchParams?.childId?.trim();
  const selectedDayIds = parseSummerCampSelection(resolvedSearchParams?.days);
  const validationErrors = validateSummerCampSelection(SUMMER_CAMP_2026, selectedDayIds);

  if (validationErrors.length > 0) {
    return (
      <ErrorState
        title="Unable to build booking summary"
        message={validationErrors[0] ?? "Please return to the booking page and select your camp days again."}
        backHref="/summer-camps/2026/book"
      />
    );
  }

  const selectedByWeek = buildSummerCampSelectionByWeek(SUMMER_CAMP_2026, selectedDayIds);
  const selectionSummary = getSummerCampSelectionSummary(SUMMER_CAMP_2026, selectedDayIds);
  const totalPrice = calculateSummerCampTotal(selectedByWeek);
  const totalSelectedDays = selectionSummary.reduce((sum, week) => sum + week.selectedDayCount, 0);
  const baseTotal = totalSelectedDays * 40;
  const totalDiscount = Math.max(0, baseTotal - totalPrice);
  const bookingContext = await getBookingContext();
  const selectedChild =
    bookingContext.status === "existing" && childId
      ? bookingContext.children.find((child) => child.id === childId) ?? null
      : null;
  const selectedChildName = selectedChild
    ? `${selectedChild.firstName ?? ""} ${selectedChild.lastName ?? ""}`.trim()
    : "Selected student";

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
            <p className="text-[1.75rem] font-black uppercase tracking-[0.04em] text-[#b42348] sm:text-[2.1rem]">
              Summer Camp 2026
            </p>
          </div>
          <div className="px-0.5 py-0.5">
            <div className="inline-flex items-center rounded-full border border-[#6c35c3]/25 bg-white/85 px-4 py-1.5 text-sm font-semibold uppercase tracking-[0.18em] text-[#2a203c]/70 shadow-[0_12px_28px_-18px_rgba(31,26,37,0.5)] backdrop-blur">
              Booking for
              <span className="ml-1 font-bold text-[#2a203c]">{selectedChildName}</span>
            </div>
          </div>
          <div className="pl-4">
            <Link
              href={`/summer-camps/2026/book?childId=${encodeURIComponent(childId ?? "")}&days=${encodeURIComponent(selectedDayIds.join(","))}`}
              className="inline-flex items-center gap-2 rounded-full border border-[#d8c7f4] bg-white px-4 py-2 text-sm font-semibold text-[#5b2ca7] transition hover:bg-[#faf6ff]"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back to day selection
            </Link>
          </div>
          <div className="pt-1">
            <div className="h-[0.5px] w-full bg-black/20" />
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-4">
            {selectionSummary.map((week) => (
              <article
                key={week.weekId}
                className="rounded-[24px] border border-[#e7e1f1] bg-white p-5 shadow-[0_10px_24px_-20px_rgba(34,24,56,0.36)] sm:p-6"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="text-[24px] font-black tracking-tight text-[#143271]">
                      {formatWeekHeading(week.dateRange)}
                    </h2>
                  </div>
                </div>

                <ul className="mt-4 space-y-2">
                  {week.selectedDays.map((day) => (
                    <li
                      key={day.id}
                      className="rounded-2xl border border-[#e5d8f4] bg-[#fcf9ff] px-4 py-3 text-sm font-semibold text-[#2E2A33]"
                    >
                      {day.label}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>

          <aside className="lg:sticky lg:top-28 lg:self-start">
            <div className="rounded-2xl border border-[#e7e1f1] bg-white p-5 shadow-[0_10px_24px_-20px_rgba(34,24,56,0.36)]">
              <h2 className="text-lg font-black text-[#1f1a25]">Booking Summary</h2>

              <div className="mt-4 rounded-xl border border-dashed border-[#d9c8f1] bg-[#fcf9ff] px-3 py-3 text-xs text-[#5f4a82]">
                <p className="font-semibold uppercase tracking-[0.08em] text-[#4f3f6e]">
                  Booking total
                </p>
                <div className="mt-2 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-[#2E2A33]">{SUMMER_CAMP_2026.title}</p>
                      <p className="mt-0.5 text-[#4f3f6e]">
                        {totalSelectedDays} day{totalSelectedDays === 1 ? "" : "s"}
                      </p>
                    </div>
                    <p className="shrink-0 font-semibold text-[#2E2A33]">
                      {totalSelectedDays} x {formatCurrency(40)}
                    </p>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-[#4f3f6e]">Discount applied</p>
                    <p className="shrink-0 font-semibold text-[#2E2A33]">
                      -{formatCurrency(totalDiscount)}
                    </p>
                  </div>
                  <div className="mt-2 h-px w-full bg-[#d9c8f1]" />
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-[#2E2A33]">Total</p>
                    <p className="font-bold text-[#2E2A33]">{formatCurrency(totalPrice)}</p>
                  </div>
                </div>
              </div>

              <div className="mt-5 flex flex-col gap-2">
                <SummerCampCheckoutButton
                  childId={childId ?? ""}
                  selectedDayIds={selectedDayIds}
                />
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* TODO: Add parent/child details form to this flow if that data is not collected earlier. */}
      {/* TODO: Add capacity tracking per day/week before opening bookings publicly. */}
    </section>
  );
}
