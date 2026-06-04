import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarDays, CheckCircle2, Clock3, CreditCard, UserRound, UtensilsCrossed } from "lucide-react";
import { supabaseAdmin } from "@/lib/admin";
import { getBookingContext } from "@/lib/server/bookingContext";
import { SUMMER_CAMP_2026, formatCurrency } from "@/lib/summerCamps";

type SearchParams = {
  bookingGroupId?: string;
};

type SummerCampBookingGroupRow = {
  id: string;
  accountId: string;
  childId: string;
  slug: string;
  status: string;
  totalAmountPence: number | null;
  paid_at: string | null;
  created_at: string | null;
};

type SummerCampBookingRow = {
  id: string;
  campDate: string;
  status: string;
};

type SummerCampSessionRow = {
  campDate: string;
  title: string | null;
  startTime: string | null;
  endTime: string | null;
};

function formatDateTime(value: string | null): string {
  if (!value) return "Pending";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Pending";
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
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

function formatCampDate(value: string): string {
  const date = new Date(`${value}T12:00:00Z`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
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

export default async function SummerCampBookingSuccessPage({
  searchParams,
}: {
  searchParams?: SearchParams | Promise<SearchParams>;
}) {
  const resolvedSearchParams = await searchParams;
  const bookingGroupId = resolvedSearchParams?.bookingGroupId?.trim() ?? "";

  if (!bookingGroupId) {
    return (
      <MessageState
        title="Payment successful"
        message="Your Stripe checkout completed successfully."
        actionHref="/summer-camps/2026/book"
        actionLabel="Return to booking"
      />
    );
  }

  const bookingContext = await getBookingContext();
  if (bookingContext.status === "unauthorized") {
    redirect(`/login?redirect=${encodeURIComponent(`/summer-camps/2026/success?bookingGroupId=${bookingGroupId}`)}`);
  }
  if (bookingContext.status !== "existing") {
    redirect("/account");
  }

  const { data: groupData, error: groupError } = await supabaseAdmin
    .from("SummerCampBookingGroups")
    .select('id,"accountId","childId",slug,status,"totalAmountPence",paid_at,created_at')
    .eq("id", bookingGroupId)
    .eq("accountId", bookingContext.accountId)
    .maybeSingle();

  if (groupError) {
    throw new Error(groupError.message);
  }

  const group = groupData as SummerCampBookingGroupRow | null;
  if (!group) {
    return (
      <MessageState
        title="Booking not found"
        message="We could not find this summer camp booking on your account."
        actionHref="/summer-camps/2026/book"
        actionLabel="Back to summer camp"
      />
    );
  }

  const [{ data: bookingData, error: bookingError }, { data: sessionData, error: sessionError }] =
    await Promise.all([
      supabaseAdmin
        .from("SummerCampBookings")
        .select('id,"campDate",status')
        .eq("bookingGroupId", bookingGroupId)
        .in("status", ["pending", "active"]),
      supabaseAdmin
        .from("SummerCampSessions")
        .select('campDate:"campDate",title,startTime:"startTime",endTime:"endTime"')
        .eq("slug", group.slug),
    ]);

  if (bookingError) {
    throw new Error(bookingError.message);
  }
  if (sessionError) {
    throw new Error(sessionError.message);
  }

  const bookings = ((bookingData ?? []) as SummerCampBookingRow[]).slice().sort((a, b) =>
    a.campDate.localeCompare(b.campDate)
  );
  const sessionByDate = new Map(
    ((sessionData ?? []) as SummerCampSessionRow[]).map((row) => [row.campDate, row])
  );
  const child = bookingContext.children.find((item) => item.id === group.childId);
  const childName =
    `${child?.firstName ?? ""} ${child?.lastName ?? ""}`.trim() || "Selected child";
  const isPaid = group.status === "paid";
  const paidAmount =
    typeof group.totalAmountPence === "number" ? formatCurrency(group.totalAmountPence / 100) : "Confirmed by Stripe";

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
                {SUMMER_CAMP_2026.title}
              </p>
              <h1 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">
                Booking details
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/78 sm:text-base">
                {isPaid
                  ? "Your payment has been received and your summer camp booking has been added to your account."
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
              Amount paid
            </div>
            <p className="mt-3 text-lg font-black text-[#2a0c4f]">{paidAmount}</p>
          </div>
          <div className="rounded-2xl border border-[#e6dcf0] bg-white p-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[#6c35c3]">
              <CalendarDays className="h-4 w-4" aria-hidden="true" />
              Confirmed at
            </div>
            <p className="mt-3 text-lg font-black text-[#2a0c4f]">
              {formatDateTime(group.paid_at ?? group.created_at)}
            </p>
          </div>
        </div>

        <div className="p-6 sm:p-8">
          <h2 className="text-xl font-black text-[#2a0c4f]">Days booked</h2>
          {bookings.length > 0 ? (
            <div className="mt-4 space-y-3">
              {bookings.map((item) => {
                const session = sessionByDate.get(item.campDate);
                return (
                  <article
                    key={item.id}
                    className="rounded-2xl border border-[#e6dcf0] bg-white p-4 shadow-[0_12px_30px_-28px_rgba(31,20,54,0.55)]"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h3 className="text-lg font-black text-[#2E2A33]">
                          {formatCampDate(item.campDate)}
                        </h3>
                        <div className="mt-2 flex flex-wrap items-center gap-3 text-sm font-medium text-[#2E2A33]/72">
                          <span>{session?.title?.trim() || SUMMER_CAMP_2026.title}</span>
                          <span className="inline-flex items-center gap-1">
                            <Clock3 className="h-4 w-4" aria-hidden="true" />
                            {formatTimeRange(session?.startTime ?? null, session?.endTime ?? null)}
                          </span>
                        </div>
                      </div>
                      <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#6c35c3]">
                        {item.status === "active" ? "Confirmed" : "Pending confirmation"}
                      </p>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <p className="mt-3 rounded-2xl border border-[#f0d2a3] bg-[#fff8ec] p-4 text-sm text-[#80530f]">
              We found the booking group, but no camp days were attached to it.
            </p>
          )}

          <div className="mt-8 rounded-[1.75rem] border border-[#e7e1f1] bg-[#fbf8fd] px-4 py-3 shadow-[0_16px_34px_-30px_rgba(34,24,56,0.2)] sm:px-5 sm:py-4">
            <div className="grid divide-y divide-[#ece3f4] sm:grid-cols-2 sm:divide-x sm:divide-y-0">
              <article className="flex items-center gap-4 px-2 py-4 sm:px-4 sm:py-3">
                <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#f1d7df] bg-[#fff8fa] text-[#b42348]">
                  <UtensilsCrossed className="h-4 w-4" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[#b42348]">
                    Packed Lunch
                  </p>
                  <p className="mt-1 text-base font-black tracking-tight text-[#1f1a25]">
                    Bring lunch and drinks
                  </p>
                  <p className="mt-1 text-sm leading-6 text-[#2E2A33]/68">
                    Children should arrive each day with a packed lunch and drinks.
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
                    Each booked camp day runs from 10am until 3pm.
                  </p>
                </div>
              </article>
            </div>
          </div>

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
