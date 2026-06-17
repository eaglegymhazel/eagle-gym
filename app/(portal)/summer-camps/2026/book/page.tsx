import { redirect } from "next/navigation";
import { getBookingContext } from "@/lib/server/bookingContext";
import {
  SUMMER_CAMP_2026,
  getSummerCampDayIds,
  parseSummerCampSelection,
} from "@/lib/summerCamps";
import SummerCampBookingClient from "./SummerCampBookingClient";

type SearchParams = {
  childId?: string;
  days?: string;
};

export default async function SummerCampBookingPage({
  searchParams,
}: {
  searchParams?: SearchParams | Promise<SearchParams>;
}) {
  const resolvedSearchParams = await searchParams;
  const childId = resolvedSearchParams?.childId;
  const selectedDayIds = parseSummerCampSelection(resolvedSearchParams?.days).filter((dayId) =>
    getSummerCampDayIds(SUMMER_CAMP_2026).has(dayId)
  );
  const bookingContext = await getBookingContext();
  if (bookingContext.status !== "existing") {
    redirect("/account?tab=children");
  }

  const children = bookingContext.children.map((item) => ({
    id: item.id,
    firstName: item.firstName,
    lastName: item.lastName,
  }));
  const selectedChild = childId
    ? bookingContext.children.find((item) => item.id === childId)
    : bookingContext.children[0];

  if (!selectedChild?.id) {
    redirect("/account?tab=children");
  }

  if (!childId || childId !== selectedChild.id) {
    const daysParam = selectedDayIds.length > 0
      ? `&days=${encodeURIComponent(selectedDayIds.join(","))}`
      : "";
    redirect(`/summer-camps/2026/book?childId=${encodeURIComponent(selectedChild.id)}${daysParam}`);
  }

  // TODO: Capacity tracking per day should be wired in once summer camp inventory is persisted.
  return (
    <SummerCampBookingClient
      camp={SUMMER_CAMP_2026}
      childId={selectedChild.id}
      childOptions={children}
      initialSelectedDayIds={selectedDayIds}
    />
  );
}
