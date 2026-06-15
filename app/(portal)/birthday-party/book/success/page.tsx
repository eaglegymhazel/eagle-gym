import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarDays, Clock3, CreditCard, Gift, Mail } from "lucide-react";
import { getBookingContext } from "@/lib/server/bookingContext";
import { supabaseAdmin } from "@/lib/admin";
import { getBirthdayPartySlotDisplay } from "@/lib/server/birthdayPartyBookings";

type SearchParams = {
  bookingId?: string;
};

type BirthdayPartySuccessBookingRow = {
  id: string;
  accountId: string;
  slot_date: string;
  start_time: string;
  end_time: string;
  totalAmountPence: number;
  birthdayChildFirstName: string | null;
  birthdayChildLastName: string | null;
  birthdayChildDateOfBirth: string | null;
  paid_at: string | null;
  status: string;
};

function formatCurrency(amountPence: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(amountPence / 100);
}

function formatDateOfBirth(dateValue: string | null): string {
  if (!dateValue) return "Not provided";
  const date = new Date(`${dateValue}T12:00:00Z`);
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function ErrorState({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  return (
    <section className="w-full bg-[#faf7fb] px-4 pb-12 pt-8 sm:px-6 sm:pt-10">
      <div className="mx-auto w-full max-w-3xl rounded-2xl border border-[#f3ccd5] bg-[#fff5f7] p-6 shadow-[0_14px_30px_-24px_rgba(42,32,60,0.42)]">
        <h1 className="text-2xl font-black tracking-tight text-[#7b2437] sm:text-3xl">{title}</h1>
        <p className="mt-2 text-sm text-[#7b2437]/80 sm:text-base">{message}</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/account"
            className="inline-flex h-11 items-center justify-center rounded-full bg-[#6c35c3] px-5 text-sm font-semibold text-white !text-white transition hover:bg-[#5b2ca7]"
          >
            Back to account
          </Link>
        </div>
      </div>
    </section>
  );
}

export default async function BirthdayPartySuccessPage({
  searchParams,
}: {
  searchParams?: SearchParams | Promise<SearchParams>;
}) {
  const bookingContext = await getBookingContext();

  if (bookingContext.status === "unauthorized") {
    redirect("/login?redirect=/birthday-party/book");
  }

  if (bookingContext.status !== "existing") {
    redirect("/account");
  }

  const resolvedSearchParams = await searchParams;
  const bookingId = resolvedSearchParams?.bookingId?.trim() ?? "";

  if (!bookingId) {
    return (
      <ErrorState
        title="Booking confirmation not found"
        message="We couldn't load this birthday party booking confirmation. Please check your account or contact the club if you need help."
      />
    );
  }

  const { data, error } = await supabaseAdmin
    .from("BirthdayPartyBookings")
    .select(
      'id,"accountId",slot_date,start_time,end_time,"totalAmountPence","birthdayChildFirstName","birthdayChildLastName","birthdayChildDateOfBirth",paid_at,status'
    )
    .eq("id", bookingId)
    .eq("accountId", bookingContext.accountId)
    .maybeSingle();

  if (error) {
    return (
      <ErrorState
        title="Unable to load booking confirmation"
        message="There was a problem loading this birthday party booking. Please check your account or contact the club if you need help."
      />
    );
  }

  const booking = data as BirthdayPartySuccessBookingRow | null;

  if (!booking) {
    return (
      <ErrorState
        title="Booking confirmation not found"
        message="We couldn't find a birthday party booking for this account. Please check your account or contact the club if you need help."
      />
    );
  }

  const slotDisplay = getBirthdayPartySlotDisplay({
    slotDate: booking.slot_date,
    startTime: booking.start_time,
    endTime: booking.end_time,
  });
  const birthdayChildName =
    `${booking.birthdayChildFirstName?.trim() ?? ""} ${booking.birthdayChildLastName?.trim() ?? ""}`.trim() ||
    "Not provided";
  const isConfirmed =
    booking.status === "confirmed" || booking.status === "paid";

  return (
    <section className="w-full bg-[#faf7fb] px-4 pb-12 pt-8 sm:px-6 sm:pt-10">
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <div className="rounded-[28px] border border-[#e7e1f1] bg-white p-6 shadow-[0_18px_40px_-30px_rgba(42,32,60,0.48)] sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-5">
              <div className="space-y-3">
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#b42348]">Birthday Party Booking</p>
                <h1 className="text-3xl font-black tracking-tight text-[#143271] sm:text-4xl">
                  {isConfirmed ? "Payment received" : "Payment processing"}
                </h1>
                <p className="max-w-2xl text-sm text-[#5f4a82] sm:text-base">
                  {isConfirmed
                    ? "Your birthday party booking has been confirmed. You can use the details below to check the party date and who the booking was made for."
                    : "Stripe checkout is complete. We are waiting for payment confirmation before adding this birthday party to your account."}
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-[#eee6f7] bg-[#fcfbff] p-4">
                  <div className="flex items-center gap-2 text-[#b42348]">
                    <Gift className="h-4 w-4" aria-hidden="true" />
                    <p className="text-xs font-semibold uppercase tracking-[0.16em]">Birthday child</p>
                  </div>
                  <p className="mt-2 text-lg font-black text-[#143271]">{birthdayChildName}</p>
                  <p className="mt-1 text-sm text-[#5f4a82]">
                    Date of birth: {formatDateOfBirth(booking.birthdayChildDateOfBirth)}
                  </p>
                </div>

                <div className="rounded-2xl border border-[#eee6f7] bg-[#fcfbff] p-4">
                  <div className="flex items-center gap-2 text-[#6c35c3]">
                    <CreditCard className="h-4 w-4" aria-hidden="true" />
                    <p className="text-xs font-semibold uppercase tracking-[0.16em]">Amount paid</p>
                  </div>
                  <p className="mt-2 text-lg font-black text-[#143271]">
                    {formatCurrency(booking.totalAmountPence)}
                  </p>
                  <p className="mt-1 text-sm text-[#5f4a82]">
                    Status: {isConfirmed ? "Confirmed" : "Processing"}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-[#e7e1f1] bg-white p-5 shadow-[0_10px_24px_-20px_rgba(34,24,56,0.36)]">
                <h2 className="text-lg font-black text-[#1f1a25]">Booking summary</h2>
                <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <dt className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#6c35c3]">
                      <CalendarDays className="h-4 w-4" aria-hidden="true" />
                      Party date
                    </dt>
                    <dd className="mt-1 text-base font-semibold text-[#2E2A33]">{slotDisplay.formattedDate}</dd>
                  </div>
                  <div>
                    <dt className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#6c35c3]">
                      <Clock3 className="h-4 w-4" aria-hidden="true" />
                      Party time
                    </dt>
                    <dd className="mt-1 text-base font-semibold text-[#2E2A33]">{slotDisplay.formattedTime}</dd>
                  </div>
                </dl>
              </div>
            </div>

            <aside className="lg:sticky lg:top-28 lg:self-start">
              <div className="rounded-2xl border border-[#e7e1f1] bg-white p-5 shadow-[0_10px_24px_-20px_rgba(34,24,56,0.36)]">
                <h2 className="text-lg font-black text-[#1f1a25]">Need to contact us?</h2>
                <p className="mt-3 text-sm text-[#5f4a82]">
                  If you need to update any party details or ask a question before the booking date, you can get in touch with the club directly.
                </p>

                <div className="mt-5 flex flex-col gap-3">
                  <Link
                    href="/contact"
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#6c35c3] px-5 text-sm font-semibold text-white !text-white transition hover:bg-[#5b2ca7]"
                  >
                    <Mail className="h-4 w-4" aria-hidden="true" />
                    Contact us
                  </Link>
                  <Link
                    href="/account"
                    className="inline-flex h-11 items-center justify-center rounded-full border border-[#d8c7f4] bg-white px-5 text-sm font-semibold text-[#5b2ca7] transition hover:bg-[#faf6ff]"
                  >
                    Back to account
                  </Link>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </section>
  );
}
