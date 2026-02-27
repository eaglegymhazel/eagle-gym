export default function StudentProfileLoading() {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:py-8">
      <section className="overflow-hidden border border-[#ddd3ea] bg-white">
        <header className="flex flex-col gap-4 border-b border-[#e8e0f2] px-5 py-5 md:flex-row md:items-start md:justify-between md:px-6">
          <div className="space-y-2">
            <div className="h-3 w-28 animate-pulse rounded-full bg-[#efe8f6]" />
            <div className="h-8 w-56 animate-pulse rounded-2xl bg-[#efe8f6]" />
            <div className="h-4 w-44 animate-pulse rounded-full bg-[#f3eef8]" />
          </div>
          <div className="h-10 w-52 animate-pulse rounded-md bg-[#f3eef8]" />
        </header>

        <div className="grid gap-0 lg:grid-cols-2">
          {[0, 1].map((index) => (
            <section
              key={`student-card-${index}`}
              className={[
                "px-5 py-5 md:px-6",
                index === 0 ? "border-b border-[#e8e0f2] lg:border-b-0 lg:border-r" : "border-b border-[#e8e0f2] lg:border-b-0",
              ].join(" ")}
            >
              <div className="h-4 w-36 animate-pulse rounded-full bg-[#efe8f6]" />
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {Array.from({ length: 6 }).map((_, itemIndex) => (
                  <div key={`top-${index}-${itemIndex}`} className="space-y-1.5">
                    <div className="h-2.5 w-24 animate-pulse rounded-full bg-[#f1ebf8]" />
                    <div className="h-4 w-full animate-pulse rounded-full bg-[#efe8f6]" />
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        <section className="border-b border-[#e8e0f2] px-5 py-5 md:px-6">
          <div className="h-4 w-32 animate-pulse rounded-full bg-[#efe8f6]" />
          <div className="mt-3 space-y-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={`booking-${index}`}
                className="h-12 animate-pulse rounded-md border border-[#ece4f5] bg-[#fcfafe]"
              />
            ))}
          </div>
        </section>

        <section className="px-5 py-5 md:px-6">
          <div className="h-4 w-36 animate-pulse rounded-full bg-[#efe8f6]" />
          <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={`medical-${index}`}
                className="h-20 animate-pulse rounded-md border border-[#ece4f5] bg-[#fcfafe]"
              />
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
