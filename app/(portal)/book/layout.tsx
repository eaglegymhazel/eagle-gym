import { redirect } from "next/navigation";
import { getBookingContext } from "@/lib/server/bookingContext";

export default async function BookLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const bookingContext = await getBookingContext();

  if (bookingContext.status === "unauthorized") {
    redirect("/login");
  }

  if (bookingContext.status !== "existing") {
    redirect("/account?tab=children");
  }

  return children;
}
