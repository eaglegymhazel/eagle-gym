import { headers } from "next/headers";
import { redirect } from "next/navigation";
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
  if (!childId) {
    redirect("/account?tab=children");
  }

  const headersList = headers();
  const resolvedHeaders =
    typeof (headersList as unknown as Promise<Headers>).then === "function"
      ? await (headersList as Promise<Headers>)
      : (headersList as Headers);
  const cookieHeader =
    typeof (resolvedHeaders as Headers).get === "function"
      ? resolvedHeaders.get("cookie") ?? ""
      : "";
  const host =
    typeof (resolvedHeaders as Headers).get === "function"
      ? resolvedHeaders.get("x-forwarded-host") ??
        resolvedHeaders.get("host") ??
        "localhost:3000"
      : "localhost:3000";
  const proto =
    typeof (resolvedHeaders as Headers).get === "function"
      ? resolvedHeaders.get("x-forwarded-proto") ?? "http"
      : "http";
  const baseUrl = `${proto}://${host}`;

  const bootstrapRes = await fetch(`${baseUrl}/api/account/bootstrap`, {
    method: "POST",
    headers: {
      cookie: cookieHeader,
    },
    cache: "no-store",
  });

  if (bootstrapRes.status === 401) {
    redirect("/login");
  }

  if (!bootstrapRes.ok) {
    redirect("/account?tab=children");
  }

  const bootstrap = await bootstrapRes.json();

  const children = Array.isArray(bootstrap?.children) ? bootstrap.children : [];
  const child = children.find((item: any) => item?.id === childId);
  if (!child?.id) {
    redirect("/account?tab=children");
  }

  const childName = `${child.firstName ?? ""} ${child.lastName ?? ""}`.trim();
  const competitionEligible = false;

  return (
    <section className="relative w-full overflow-hidden px-6 pb-12 pt-10">
      <div className="mx-auto w-full max-w-7xl">
        <BookingClientShell
          childId={child.id}
          childName={childName || "selected child"}
          children={children.map((item: any) => ({
            id: item.id,
            firstName: item.firstName,
            lastName: item.lastName,
          }))}
          competitionEligible={competitionEligible}
        />
      </div>
    </section>
  );
}
