import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarDays, CheckCircle2, Clock3, CreditCard, UserRound } from "lucide-react";
import { supabaseAdmin } from "@/lib/admin";
import { getBookingContext } from "@/lib/server/bookingContext";
import { getCompetitionPricing } from "@/lib/server/classes";

type SearchParams = {
  type?: string;
  bookingGroupId?: string;
};

type BookingGroupRow = {
  id: string;
  accountId: string;
  childId: string;
  bookingType: string;
  status: string;
  stripeSubscriptionId: string | null;
  paidAt: string | null;
  created_at: string | null;
};

type BookingGroupItemRow = {
  id: string;
  classId: string;
  childId: string;
  bookedDurationMinutes: number | null;
  status: string;
};

type ClassRow = {
  id: string;
  name: string | null;
  weekday: string | number | null;
  startTime: string | null;
  endTime: string | null;
  durationMinutes: number | null;
  price: number | string | null;
};

type BookingType = "recreational" | "competition";

const WEEKDAY_ORDER = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

function normalizeWeekday(input: string | number | null): string {
  if (input == null) return "Day TBC";
  if (typeof input === "number") {
    if (input >= 1 && input <= 7) return WEEKDAY_ORDER[input - 1];
    if (input >= 0 && input <= 6) {
      const sundayFirst = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ] as const;
      return sundayFirst[input];
    }
    return "Day TBC";
  }

  const trimmed = input.trim();
  if (!trimmed) return "Day TBC";
  if (/^\d+$/.test(trimmed)) return normalizeWeekday(Number.parseInt(trimmed, 10));

  const lookup: Record<string, string> = {
    mon: "Monday",
    monday: "Monday",
    tue: "Tuesday",
    tues: "Tuesday",
    tuesday: "Tuesday",
    wed: "Wednesday",
    wednesday: "Wednesday",
    thu: "Thursday",
    thur: "Thursday",
    thurs: "Thursday",
    thursday: "Thursday",
    fri: "Friday",
    friday: "Friday",
    sat: "Saturday",
    saturday: "Saturday",
    sun: "Sunday",
    sunday: "Sunday",
  };

  return lookup[trimmed.toLowerCase()] ?? trimmed;
}

function formatTime(value: string | null): string {
  if (!value) return "";
  const [hours = "", minutes = ""] = value.split(":");
  if (!hours || !minutes) return value;
  return `${hours.padStart(2, "0")}:${minutes.padStart(2, "0")}`;
}

function formatTimeRange(startTime: string | null, endTime: string | null): string {
  const start = formatTime(startTime);
  const end = formatTime(endTime);
  if (start && end) return `${start}-${end}`;
  return start || "Time TBC";
}

function toNullableNumber(value: number | string | null): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(value);
}

function formatDateTime(value: string | null): string {
  if (!value) return "Pending";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Pending";
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function MessageState({
  title,
  message,
  actionHref,
  actionLabel,
}: {
  title: string;
  message: string;
  actionHref: string;
  actionLabel: string;
}) {
  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-2xl flex-col items-center justify-center px-6 py-16 text-center">
      <h1 className="text-3xl font-semibold text-[#143271]">{title}</h1>
      <p className="mt-4 text-base text-slate-700">{message}</p>
      <Link
        href={actionHref}
        className="mt-8 inline-flex rounded-full bg-[#6c35c3] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#5b2ca7]"
      >
        {actionLabel}
      </Link>
    </main>
  );
}

export default async function BookingSuccessPage({
  searchParams,
}: {
  searchParams?: SearchParams | Promise<SearchParams>;
}) {
  const resolvedSearchParams = await searchParams;
  const bookingTypeParam = resolvedSearchParams?.type ?? "";
  const bookingGroupId = resolvedSearchParams?.bookingGroupId ?? "";
  const bookingType: BookingType | null =
    bookingTypeParam === "recreational" || bookingTypeParam === "competition"
      ? bookingTypeParam
      : null;

  if (!bookingType || !bookingGroupId) {
    return (
      <MessageState
        title="Payment successful"
        message="Your Stripe checkout completed successfully."
        actionHref="/book/recreational"
        actionLabel="Return to booking"
      />
    );
  }

  const bookingContext = await getBookingContext();
  if (bookingContext.status === "unauthorized") {
    redirect(`/login?redirect=${encodeURIComponent(`/booking/success?type=${bookingType}&bookingGroupId=${bookingGroupId}`)}`);
  }
  if (bookingContext.status !== "existing") {
    redirect("/account");
  }

  const { data: groupData, error: groupError } = await supabaseAdmin
    .from("ClassBookingGroups")
    .select('id,"accountId","childId","bookingType",status,"stripeSubscriptionId","paidAt",created_at')
    .eq("id", bookingGroupId)
    .eq("accountId", bookingContext.accountId)
    .eq("bookingType", bookingType)
    .maybeSingle();

  if (groupError) {
    throw new Error(groupError.message);
  }

  const group = groupData as BookingGroupRow | null;
  if (!group) {
    return (
      <MessageState
        title="Booking not found"
        message={`We could not find this ${bookingType} booking on your account.`}
        actionHref={`/book/${bookingType}`}
        actionLabel={`Back to ${bookingType} classes`}
      />
    );
  }

  const { data: itemData, error: itemError } = await supabaseAdmin
    .from("ClassBookingGroupItems")
    .select('id,"classId","childId","bookedDurationMinutes",status')
    .eq("bookingGroupId", bookingGroupId)
    .in("status", ["pending", "finalized"]);

  if (itemError) {
    throw new Error(itemError.message);
  }

  const items = (itemData ?? []) as BookingGroupItemRow[];
  const classIds = items.map((item) => item.classId);
  const { data: classData, error: classError } =
    classIds.length > 0
      ? await supabaseAdmin
          .from("Classes")
          .select("id,name:className,weekday,startTime,endTime,durationMinutes,price")
          .in("id", classIds)
      : { data: [], error: null };

  if (classError) {
    throw new Error(classError.message);
  }

  const classById = new Map(((classData ?? []) as ClassRow[]).map((row) => [row.id, row]));
  const child = bookingContext.children.find((item) => item.id === group.childId);
  const childName =
    `${child?.firstName ?? ""} ${child?.lastName ?? ""}`.trim() || "Selected child";
  const classDetails = items.map((item) => {
    const classRow = classById.get(item.classId);
    return {
      id: item.id,
      name: classRow?.name?.trim() || "Recreational class",
      weekday: normalizeWeekday(classRow?.weekday ?? null),
      time: formatTimeRange(classRow?.startTime ?? null, classRow?.endTime ?? null),
      durationMinutes: item.bookedDurationMinutes ?? classRow?.durationMinutes ?? null,
      price: bookingType === "recreational" ? toNullableNumber(classRow?.price ?? null) : null,
      status: item.status,
    };
  });
  const competitionPricingRows = bookingType === "competition" ? await getCompetitionPricing() : [];
  const totalCompetitionHours = Number(
    (
      classDetails.reduce((sum, item) => sum + (item.durationMinutes ?? 0), 0) / 60
    ).toFixed(2)
  );
  const matchedCompetitionPrice = competitionPricingRows
    .map((row) => ({
      hoursPerWeek: toNullableNumber(row.hoursPerWeek),
      monthlyPrice: toNullableNumber(row.monthlyPrice),
    }))
    .find(
      (row) =>
        row.hoursPerWeek != null &&
        row.monthlyPrice != null &&
        Math.abs(row.hoursPerWeek - totalCompetitionHours) < 0.001
    )?.monthlyPrice ?? null;
  const recreationalMonthlyTotal = classDetails.reduce((sum, item) => sum + (item.price ?? 0), 0);
  const hasPriceForEveryClass =
    bookingType === "competition"
      ? matchedCompetitionPrice != null
      : classDetails.every((item) => item.price != null);
  const monthlyTotal =
    bookingType === "competition"
      ? matchedCompetitionPrice ?? 0
      : recreationalMonthlyTotal;
  const isPaid = group.status === "paid";
  const programmeLabel = bookingType === "competition" ? "Competition classes" : "Recreational classes";

  return (
    <main className="relative w-full overflow-hidden bg-[#faf7fb] px-4 py-8 sm:px-6 sm:py-12">
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
      <section className="relative z-10 mx-auto w-full max-w-4xl overflow-hidden rounded-[2rem] border border-[#d8c7f4] bg-white shadow-[0_24px_60px_-42px_rgba(31,20,54,0.45)]">
        <div className="relative overflow-hidden bg-[linear-gradient(135deg,#6f3bc9_0%,#6c35c3_48%,#5f2eb6_100%)] px-6 py-8 text-white sm:px-8">
          <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-white/12 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-24 left-10 h-48 w-48 rounded-full bg-[#f9f6fa]/10 blur-2xl" />
          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/70">
                {programmeLabel}
              </p>
              <h1 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">
                Booking details
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/78 sm:text-base">
                {isPaid
                  ? "Your payment has been received and your booking has been added to your account."
                  : "Stripe checkout is complete. Your booking details are below while the payment confirmation finishes processing."}
              </p>
            </div>
            <div className="inline-flex items-center gap-2 self-start rounded-full bg-white/12 px-4 py-2 text-sm font-semibold">
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              {isPaid ? "Payment received" : "Payment processing"}
            </div>
          </div>
        </div>

        <div className="grid gap-4 border-b border-[#eee6f4] bg-[#fbf8fd] p-6 sm:grid-cols-3 sm:p-8">
          <div className="rounded-2xl border border-[#e6dcf0] bg-white p-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[#6c35c3]">
              <UserRound className="h-4 w-4" aria-hidden="true" />
              Booking for
            </div>
            <p className="mt-3 text-lg font-black text-[#2a0c4f]">{childName}</p>
          </div>
          <div className="rounded-2xl border border-[#e6dcf0] bg-white p-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[#6c35c3]">
              <CreditCard className="h-4 w-4" aria-hidden="true" />
              Monthly payment
            </div>
            <p className="mt-3 text-lg font-black text-[#2a0c4f]">
              {hasPriceForEveryClass ? formatCurrency(monthlyTotal) : "Price confirmed by Stripe"}
            </p>
          </div>
          <div className="rounded-2xl border border-[#e6dcf0] bg-white p-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[#6c35c3]">
              <CalendarDays className="h-4 w-4" aria-hidden="true" />
              Confirmed at
            </div>
            <p className="mt-3 text-lg font-black text-[#2a0c4f]">
              {formatDateTime(group.paidAt ?? group.created_at)}
            </p>
          </div>
        </div>

        <div className="p-6 sm:p-8">
          <h2 className="text-xl font-black text-[#2a0c4f]">Classes booked</h2>
          {classDetails.length > 0 ? (
            <div className="mt-4 space-y-3">
              {classDetails.map((item) => (
                <article
                  key={item.id}
                  className="rounded-2xl border border-[#e6dcf0] bg-white p-4 shadow-[0_12px_30px_-28px_rgba(31,20,54,0.55)]"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="text-lg font-black text-[#2E2A33]">{item.name}</h3>
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-sm font-medium text-[#2E2A33]/72">
                        <span>{item.weekday}</span>
                        <span className="inline-flex items-center gap-1">
                          <Clock3 className="h-4 w-4" aria-hidden="true" />
                          {item.time}
                        </span>
                        {item.durationMinutes ? <span>{item.durationMinutes} mins</span> : null}
                      </div>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="text-sm font-bold text-[#2a0c4f]">
                        {bookingType === "competition"
                          ? "Included in monthly total"
                          : item.price != null
                            ? `${formatCurrency(item.price)} / month`
                            : "Price confirmed by Stripe"}
                      </p>
                      <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#6c35c3]">
                        {item.status === "finalized" ? "Finalized" : "Pending confirmation"}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="mt-3 rounded-2xl border border-[#f0d2a3] bg-[#fff8ec] p-4 text-sm text-[#80530f]">
              We found the booking group, but no class items were attached to it.
            </p>
          )}

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/account?tab=bookings&refresh=bookings"
              className="inline-flex h-12 items-center justify-center rounded-full bg-[#6c35c3] px-6 text-sm font-bold text-white shadow-[0_12px_24px_-12px_rgba(69,34,124,0.78)] transition hover:bg-[#5b2ca7]"
            >
              View my account
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
