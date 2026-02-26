export default function RecreationalReviewLoading() {
  return (
    <section className="relative w-full overflow-hidden bg-[#faf7fb] px-4 pb-12 pt-4 sm:px-6 sm:pt-6">
      <div className="pointer-events-none absolute inset-0 hidden lg:block">
        <div className="absolute inset-y-0 left-0 right-[calc(50%+32rem)]">
          <div className="absolute inset-y-[7%] left-2 w-px bg-[#6c35c3]/22" />
          <div className="absolute inset-y-[15%] left-6 w-px bg-[#6c35c3]/10" />
          <div className="absolute inset-y-[10%] left-12 w-[2px] bg-[#6c35c3]/18" />
          <div className="absolute inset-y-[20%] left-[74px] w-px bg-[#6c35c3]/8" />
        </div>
        <div className="absolute inset-y-0 left-[calc(50%+32rem)] right-0">
          <div className="absolute inset-y-[8%] right-2 w-px bg-[#6c35c3]/20" />
          <div className="absolute inset-y-[13%] right-7 w-[2px] bg-[#6c35c3]/26" />
          <div className="absolute inset-y-[22%] right-12 w-px bg-[#6c35c3]/9" />
        </div>
      </div>
      <div className="relative z-10 mx-auto w-full max-w-[1040px] space-y-6">
        <div className="h-24 animate-pulse rounded-2xl border border-[#e7e1f1] bg-white" />
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-4">
            <div className="h-36 animate-pulse rounded-2xl border border-[#e7e1f1] bg-white" />
            <div className="h-36 animate-pulse rounded-2xl border border-[#e7e1f1] bg-white" />
          </div>
          <div className="h-52 animate-pulse rounded-2xl border border-[#e7e1f1] bg-white" />
        </div>
      </div>
    </section>
  );
}
