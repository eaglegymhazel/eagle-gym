type SearchParams = {
  childId?: string;
};

export default async function CompetitionBookingPage({
  searchParams,
}: {
  searchParams?: SearchParams | Promise<SearchParams>;
}) {
  const resolvedSearchParams = await searchParams;
  const { childId } = resolvedSearchParams ?? {};

  return (
    <section className="w-full bg-white px-6 pb-16 pt-12">
      <div className="mx-auto w-full max-w-4xl text-left">
        <h1 className="text-3xl font-black tracking-tight text-[#1f1a25] sm:text-4xl">
          Competition booking flow (coming next)
        </h1>
        <p className="mt-3 text-sm text-[#2E2A33]/70">
          childId: {childId ?? "missing"}
        </p>
      </div>
    </section>
  );
}
