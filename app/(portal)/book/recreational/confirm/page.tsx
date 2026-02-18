type SearchParams = {
  childId?: string;
  classIds?: string;
  intentId?: string;
};

export default async function RecreationalConfirmPlaceholderPage({
  searchParams,
}: {
  searchParams?: SearchParams | Promise<SearchParams>;
}) {
  const resolvedSearchParams = await searchParams;
  const childId = resolvedSearchParams?.childId ?? "";
  const classIds = (resolvedSearchParams?.classIds ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
  const intentId = resolvedSearchParams?.intentId ?? "";

  return (
    <section className="w-full bg-[#faf7fb] px-4 pb-12 pt-8 sm:px-6 sm:pt-10">
      <div className="mx-auto w-full max-w-3xl rounded-2xl border border-[#e8ddf8] bg-white p-6 shadow-[0_14px_30px_-24px_rgba(42,32,60,0.42)] sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#6e2ac0]">
          Next step placeholder
        </p>
        <h1 className="mt-2 text-2xl font-black tracking-tight text-[#1f1a25] sm:text-3xl">
          Confirm your booking
        </h1>
        <p className="mt-2 text-sm text-[#2E2A33]/75 sm:text-base">
          Intent created. Hook this page into your payment/checkout flow next.
        </p>

        <dl className="mt-5 space-y-2 rounded-xl border border-dashed border-[#d9c8f1] bg-[#fcf9ff] p-4 text-xs text-[#5f4a82]">
          <div className="flex gap-2">
            <dt className="font-semibold">intentId:</dt>
            <dd className="break-all">{intentId || "missing"}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="font-semibold">childId:</dt>
            <dd className="break-all">{childId || "missing"}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="font-semibold">class count:</dt>
            <dd>{classIds.length}</dd>
          </div>
        </dl>

        <button
          type="button"
          className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-[#6e2ac0] px-6 text-sm font-semibold text-white"
        >
          Complete booking
        </button>
      </div>
    </section>
  );
}

