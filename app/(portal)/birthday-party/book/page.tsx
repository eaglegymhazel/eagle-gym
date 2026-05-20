import { redirect } from "next/navigation";
import BirthdayPartyBookingClient, {
  type BirthdayPartyBookingCalendarSlot,
  type BirthdayPartyBookingSlotOption,
} from "./BirthdayPartyBookingClient";
import { getBookingContext } from "@/lib/server/bookingContext";
import {
  calculateBirthdayPartyPrice,
  getBirthdayPartyAccountSummary,
  getBirthdayPartyCalendarSlots,
  getBirthdayPartySlotDisplay,
} from "@/lib/server/birthdayPartyBookings";

export default async function BirthdayPartyBookingPage() {
  const bookingContext = await getBookingContext();

  if (bookingContext.status === "unauthorized") {
    redirect("/login?redirect=/birthday-party/book");
  }

  if (bookingContext.status !== "existing") {
    redirect("/account");
  }

  const [accountSummary, calendarSlotsRaw] = await Promise.all([
    getBirthdayPartyAccountSummary(bookingContext.accountId),
    getBirthdayPartyCalendarSlots(),
  ]);

  if (!accountSummary) {
    redirect("/account");
  }

  const calendarSlots: BirthdayPartyBookingCalendarSlot[] = calendarSlotsRaw.map((slot) => {
    const display = getBirthdayPartySlotDisplay(slot);
    return {
      id: slot.id,
      slotDate: slot.slotDate,
      startTime: slot.startTime,
      endTime: slot.endTime,
      formattedDate: display.formattedDate,
      formattedTime: display.formattedTime,
      isAvailable: slot.isAvailable,
    };
  });

  const slots: BirthdayPartyBookingSlotOption[] = calendarSlots
    .filter((slot) => slot.isAvailable)
    .map((slot) => ({
      id: slot.id,
      slotDate: slot.slotDate,
      startTime: slot.startTime,
      endTime: slot.endTime,
      formattedDate: slot.formattedDate,
      formattedTime: slot.formattedTime,
    }));

  return (
    <BirthdayPartyBookingClient
      accountName={accountSummary.fullName}
      slots={slots}
      calendarSlots={calendarSlots}
      initialPricePreview={calculateBirthdayPartyPrice(12)}
    />
  );
}
