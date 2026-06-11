import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, CreditCard, Gift, Mail, NotebookPen, Phone, Users } from "lucide-react";
import { getAdminBirthdayPartyBookingById } from "@/lib/server/adminBirthdayPartyBookings";
import { getBirthdayPartyCalendarSlots } from "@/lib/server/birthdayPartyBookings";
import DeleteBirthdayPartyBookingButton from "./DeleteBirthdayPartyBookingButton";
import RescheduleBirthdayPartyButton from "./RescheduleBirthdayPartyButton";

type BirthdayPartyAdminDetailPageProps = {
  params: Promise<{ bookingId: string }>;
};

function formatDate(value: string | null): string {
  if (!value) return "Not provided";
  const parsed = new Date(`${value}T12:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return "Not provided";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(parsed);
}

function formatDateTime(value: string | null): string {
  if (!value) return "Not provided";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Not provided";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
}

function formatTimeRange(startTime: string, endTime: string): string {
  const formatOne = (value: string) => {
    const [hourRaw, minuteRaw] = value.split(":");
    const hour = Number.parseInt(hourRaw ?? "", 10);
    const minute = Number.parseInt(minuteRaw ?? "", 10);
    if (Number.isNaN(hour) || Number.isNaN(minute)) return value;
    const date = new Date(Date.UTC(1970, 0, 1, hour, minute, 0, 0));
    return new Intl.DateTimeFormat("en-GB", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: "UTC",
    })
      .format(date)
      .replace(":00", "")
      .replace(" ", "")
      .toLowerCase();
  };

  return `${formatOne(startTime)}-${formatOne(endTime)}`;
}

function formatMoney(amountMinor: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(amountMinor / 100);
}

function displayText(value: string | null | undefined): string {
  return value?.trim() ? value : "Not provided";
}

function getStripePaymentUrl(paymentIntentId: string): string {
  return `https://dashboard.stripe.com/payments/${encodeURIComponent(paymentIntentId)}`;
}

export default async function BirthdayPartyAdminDetailPage({
  params,
}: BirthdayPartyAdminDetailPageProps) {
  const { bookingId } = await params;
  const booking = await getAdminBirthdayPartyBookingById(bookingId);

  if (!booking) {
    notFound();
  }

  const availableSlots = (await getBirthdayPartyCalendarSlots())
    .filter((slot) => slot.isAvailable)
    .map((slot) => ({
      id: slot.id,
      slotDate: slot.slotDate,
      startTime: slot.startTime,
      endTime: slot.endTime,
    }));
  const currentSlotLabel = `${formatDate(booking.slotDate)} | ${formatTimeRange(
    booking.startTime,
    booking.endTime
  )}`;

  return (
    <main className="mx-auto w-full max-w-7xl select-text px-4 py-6 sm:px-6 lg:py-8">
      <section className="border border-[#ddd3ea] bg-white select-text">
        <header className="relative overflow-hidden border-b border-[#e8e0f2] px-5 py-5 md:px-6">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-1/2 hidden w-[320px] -translate-x-1/2 items-center justify-center md:flex"
          >
            <svg viewBox="0 0 360 120" className="h-[92px] w-[290px] opacity-95">
              <g>
                <circle cx="92" cy="54" r="18" fill="#f9a8d4" />
                <circle cx="118" cy="42" r="16" fill="#c4b5fd" />
                <circle cx="143" cy="57" r="17" fill="#93c5fd" />
                <path d="M92 72v26" stroke="#c084fc" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M118 58v36" stroke="#a78bfa" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M143 74v22" stroke="#60a5fa" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M92 98c-4 0-7 2-9 6" stroke="#c084fc" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M118 94c3 0 6 2 8 5" stroke="#a78bfa" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M143 96c-4 0-6 2-8 5" stroke="#60a5fa" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M218 28l24 14-11 15h-26l-11-15 24-14Z" fill="#fbbf24" />
                <path d="M218 28v44" stroke="#d97706" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M206 57h24" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" opacity="0.9" />
                <circle cx="218" cy="76" r="4" fill="#f472b6" />
                <circle cx="278" cy="34" r="3.5" fill="#f472b6" />
                <circle cx="294" cy="47" r="3" fill="#93c5fd" />
                <circle cx="310" cy="30" r="3.5" fill="#c4b5fd" />
                <circle cx="290" cy="70" r="3.5" fill="#fbbf24" />
                <circle cx="320" cy="60" r="3.5" fill="#f472b6" />
                <path d="M272 56l5 5" stroke="#c084fc" strokeWidth="2" strokeLinecap="round" />
                <path d="M277 56l-5 5" stroke="#c084fc" strokeWidth="2" strokeLinecap="round" />
                <path d="M302 82l5 5" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" />
                <path d="M307 82l-5 5" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" />
              </g>
            </svg>
          </div>
          <div className="relative z-[1] flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#6f6287]">
              Birthday party booking
            </p>
            <h1 className="mt-2 text-2xl font-bold text-[#221833]">{booking.birthdayChildFullName}</h1>
            <p className="mt-1 text-sm text-[#5f5177]">
              {formatDate(booking.slotDate)} | {formatTimeRange(booking.startTime, booking.endTime)}
            </p>
            </div>
            <Link
              href="/admin?tab=birthday-parties"
              className="inline-flex w-full items-center justify-center gap-1.5 border border-[#c7b4e5] bg-[#f7f2ff] px-3.5 py-2 text-sm font-semibold text-[#4f2390] shadow-[0_1px_0_rgba(255,255,255,0.8)_inset] transition hover:border-[#b398dd] hover:bg-[#f1e8ff] active:bg-[#ebddff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6e2ac0]/35 md:w-auto"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back to birthday parties
            </Link>
          </div>
        </header>

        <div className="grid gap-0 lg:grid-cols-2">
          <section className="border-b border-[#e8e0f2] px-5 py-5 md:px-6 lg:border-b-0 lg:border-r">
            <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.08em] text-[#6f6287]">
              <Gift className="h-4 w-4 text-[#6e2ac0]" aria-hidden="true" />
              Birthday child
            </h2>
            <dl className="mt-3 grid grid-cols-1 gap-x-4 gap-y-2.5 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.06em] text-[#74688a]">
                  First name
                </dt>
                <dd className="mt-1 text-sm font-medium text-[#221833]">
                  {displayText(booking.birthdayChildFirstName)}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.06em] text-[#74688a]">
                  Last name
                </dt>
                <dd className="mt-1 text-sm font-medium text-[#221833]">
                  {displayText(booking.birthdayChildLastName)}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.06em] text-[#74688a]">
                  Date of birth
                </dt>
                <dd className="mt-1 text-sm font-medium text-[#221833]">
                  {formatDate(booking.birthdayChildDateOfBirth)}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.06em] text-[#74688a]">
                  Age turning
                </dt>
                <dd className="mt-1 text-sm font-medium text-[#221833]">
                  {typeof booking.ageTurningAtParty === "number" ? booking.ageTurningAtParty : "Unknown"}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.06em] text-[#74688a]">
                  Party size
                </dt>
                <dd className="mt-1 text-sm font-medium text-[#221833]">{booking.partySize}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.06em] text-[#74688a]">
                  Amount paid
                </dt>
                <dd className="mt-1 text-sm font-medium text-[#221833]">
                  {formatMoney(booking.totalAmountPence)}
                </dd>
              </div>
            </dl>
          </section>

          <section className="border-b border-[#e8e0f2] px-5 py-5 md:px-6 lg:border-b-0">
            <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.08em] text-[#6f6287]">
              <Users className="h-4 w-4 text-[#6e2ac0]" aria-hidden="true" />
              Account details
            </h2>
            <dl className="mt-3 grid grid-cols-1 gap-x-4 gap-y-2.5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <dt className="text-xs font-semibold uppercase tracking-[0.06em] text-[#74688a]">
                  Account name
                </dt>
                <dd className="mt-1 text-sm font-medium text-[#221833]">
                  {displayText(booking.accountFullName)}
                </dd>
              </div>
              <div>
                <dt className="flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.06em] text-[#74688a]">
                  <Phone className="h-3.5 w-3.5" aria-hidden="true" />
                  Contact number
                </dt>
                <dd className="mt-1 text-sm font-medium text-[#221833]">
                  {displayText(booking.accTelNo)}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.06em] text-[#74688a]">
                  Emergency contact
                </dt>
                <dd className="mt-1 text-sm font-medium text-[#221833]">
                  {displayText(booking.accEmergencyTelNo)}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.06em] text-[#74688a]">
                  <Mail className="h-3.5 w-3.5" aria-hidden="true" />
                  Account email
                </dt>
                <dd className="mt-1 break-all text-sm font-medium text-[#221833]">
                  {displayText(booking.email)}
                </dd>
              </div>
            </dl>
          </section>
        </div>

        <section className="border-b border-[#e8e0f2] px-5 py-5 md:px-6">
          <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.08em] text-[#6f6287]">
            <CalendarDays className="h-4 w-4 text-[#6e2ac0]" aria-hidden="true" />
            Party details
          </h2>
          <dl className="mt-3 grid grid-cols-1 gap-x-4 gap-y-2.5 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.06em] text-[#74688a]">
                Party date
              </dt>
              <dd className="mt-1 text-sm font-medium text-[#221833]">{formatDate(booking.slotDate)}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.06em] text-[#74688a]">
                Party time
              </dt>
              <dd className="mt-1 text-sm font-medium text-[#221833]">
                {formatTimeRange(booking.startTime, booking.endTime)}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.06em] text-[#74688a]">
                Booked on
              </dt>
              <dd className="mt-1 text-sm font-medium text-[#221833]">{formatDateTime(booking.bookedAt)}</dd>
            </div>
            <div>
              <dt className="flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.06em] text-[#74688a]">
                <CreditCard className="h-3.5 w-3.5" aria-hidden="true" />
                Paid on
              </dt>
              <dd className="mt-1 text-sm font-medium text-[#221833]">{formatDateTime(booking.paidAt)}</dd>
            </div>
          </dl>
          <div className="mt-6 flex flex-col gap-3 border-t border-[#eee6f6] pt-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
              {booking.stripePaymentIntentId ? (
                <a
                  href={getStripePaymentUrl(booking.stripePaymentIntentId)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-12 w-full items-center justify-center rounded-lg border border-[#d9ccef] bg-[#faf7ff] px-5 text-base font-semibold text-[#5b2ca7] transition hover:border-[#cbb6ea] hover:bg-[#f4eeff] hover:text-[#49228c] lg:w-auto"
                >
                  View payment in Stripe
                </a>
              ) : null}
              <RescheduleBirthdayPartyButton
                bookingId={booking.id}
                childName={booking.birthdayChildFullName}
                currentSlotLabel={currentSlotLabel}
                availableSlots={availableSlots}
              />
            </div>
            <DeleteBirthdayPartyBookingButton
              bookingId={booking.id}
              childName={booking.birthdayChildFullName}
              slotDateLabel={formatDate(booking.slotDate)}
              className="w-full lg:w-auto lg:min-w-[192px]"
            />
          </div>
        </section>

        <section className="px-5 py-5 md:px-6">
          <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.08em] text-[#6f6287]">
            <NotebookPen className="h-4 w-4 text-[#6e2ac0]" aria-hidden="true" />
            Booking notes
          </h2>
          <div className="mt-3 grid gap-4 lg:grid-cols-3">
            <div className="rounded-xl border border-[#ece4f5] bg-[#fcfbff] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.06em] text-[#74688a]">
                Health notes
              </p>
              <p className="mt-2 text-sm text-[#221833]">{displayText(booking.healthNotes)}</p>
            </div>
            <div className="rounded-xl border border-[#ece4f5] bg-[#fcfbff] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.06em] text-[#74688a]">
                Special requirements
              </p>
              <p className="mt-2 text-sm text-[#221833]">{displayText(booking.specialRequirements)}</p>
            </div>
            <div className="rounded-xl border border-[#ece4f5] bg-[#fcfbff] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.06em] text-[#74688a]">
                Additional notes
              </p>
              <p className="mt-2 text-sm text-[#221833]">{displayText(booking.additionalNotes)}</p>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}
