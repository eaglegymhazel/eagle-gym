import { redirect } from "next/navigation";
import { getBookingContext } from "@/lib/server/bookingContext";
import BookingClientShell from "./BookingClientShell";

type SearchParams = {
  childId?: string;
};

export default async function BookPage({
  searchParams,
}: {
  searchParams?: SearchParams | Promise<SearchParams>;
}) {
  const resolvedSearchParams = await searchParams;
  const { childId } = resolvedSearchParams ?? {};

  const bookingContext = await getBookingContext();
  if (bookingContext.status !== "existing") {
    redirect("/account?tab=children");
  }
  const children = bookingContext.children;
  if (!childId) {
    const firstChild = children[0];
    if (!firstChild?.id) {
      redirect("/account?tab=children");
    }
    redirect(`/book?childId=${encodeURIComponent(firstChild.id)}`);
  }
  const child = children.find((item) => item.id === childId);
  if (!child?.id) {
    redirect("/account?tab=children");
  }

  const childName = `${child.firstName ?? ""} ${child.lastName ?? ""}`.trim();
  const competitionEligible = child.competitionEligible === true;
  const shellProps = {
    childId: child.id,
    childName: childName || "selected child",
    children: children.map((item) => ({
      id: item.id,
      firstName: item.firstName,
      lastName: item.lastName,
      dateOfBirth: item.dateOfBirth,
    })),
    competitionEligible,
  };

  return (
    <section className="relative w-full overflow-hidden px-6 pb-12 pt-10">
      <div className="mx-auto w-full max-w-7xl">
        <BookingClientShell {...shellProps} />
      </div>
    </section>
  );
}
