export default function RecreationalReviewLoading() {
  return (
    <section className="w-full bg-[#faf7fb] px-4 pb-12 pt-8 sm:px-6 sm:pt-10">
      <div className="mx-auto w-full max-w-[1040px] space-y-6">
        <div className="h-36 animate-pulse rounded-2xl border border-[#e8ddf8] bg-white" />
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-4">
            <div className="h-36 animate-pulse rounded-2xl border border-[#e8ddf8] bg-white" />
            <div className="h-36 animate-pulse rounded-2xl border border-[#e8ddf8] bg-white" />
          </div>
          <div className="h-52 animate-pulse rounded-2xl border border-[#e8ddf8] bg-white" />
        </div>
      </div>
    </section>
  );
}

