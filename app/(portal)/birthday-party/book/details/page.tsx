import Link from "next/link";
import { redirect } from "next/navigation";
import BirthdayPartyDetailsClient from "./BirthdayPartyDetailsClient";
import { getBookingContext } from "@/lib/server/bookingContext";
import {
  getBirthdayPartyAccountSummary,
  getBirthdayPartySlot,
  getBirthdayPartySlotDisplay,
  isBirthdayPartySlotAvailableForAccount,
  parseBirthdayPartySlotId,
} from "@/lib/server/birthdayPartyBookings";

type SearchParams = {
  slotId?: string;
};

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
        <div className="mt-5">
          <Link
            href="/birthday-party/book"
            className="inline-flex h-11 items-center justify-center rounded-full border border-[#d8c7f4] bg-white px-5 text-sm font-semibold text-[#5b2ca7] transition hover:bg-[#faf6ff]"
          >
            Back to booking
          </Link>
        </div>
      </div>
    </section>
  );
}

export default async function BirthdayPartyDetailsPage({
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
  const slotId = resolvedSearchParams?.slotId?.trim() ?? "";
  const parsedSlot = parseBirthdayPartySlotId(slotId);

  if (!slotId || !parsedSlot) {
    return (
      <ErrorState
        title="Choose a party date first"
        message="Please return to the booking page and select an available birthday party date."
      />
    );
  }

  const [accountSummary, slot, slotAvailable] = await Promise.all([
    getBirthdayPartyAccountSummary(bookingContext.accountId),
    getBirthdayPartySlot(parsedSlot.slotDate, parsedSlot.startTime, parsedSlot.endTime),
    isBirthdayPartySlotAvailableForAccount(
      parsedSlot.slotDate,
      parsedSlot.startTime,
      parsedSlot.endTime,
      bookingContext.accountId
    ),
  ]);

  if (!accountSummary) {
    redirect("/account");
  }

  if (!slot || !slotAvailable) {
    return (
      <ErrorState
        title="Birthday party slot not available"
        message="This slot is no longer available. Please return to the booking page and choose another date."
      />
    );
  }

  const slotDisplay = getBirthdayPartySlotDisplay(slot);

  return (
    <BirthdayPartyDetailsClient
      accountName={accountSummary.fullName}
      slotId={slotId}
      slotLabel={slotDisplay.formattedDate}
      timeLabel={slotDisplay.formattedTime}
    />
  );
}
