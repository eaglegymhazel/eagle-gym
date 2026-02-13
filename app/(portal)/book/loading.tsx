export default function Loading() {
  return (
    <section className="relative w-full overflow-hidden bg-white px-6 pb-12 pt-12">
      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-3">
        <div className="h-3 w-32 rounded-full bg-[#efe8f6] animate-pulse" />
        <div className="h-10 w-72 rounded-2xl bg-[#efe8f6] animate-pulse" />
        <div className="h-5 w-56 rounded-full bg-[#f3eef8] animate-pulse" />
      </div>

      <div className="mx-auto mt-8 w-full max-w-6xl">
        <div className="grid min-h-[70vh] grid-cols-1 overflow-hidden rounded-[28px] md:grid-cols-2">
          {[0, 1].map((index) => (
            <div
              key={index}
              className={`flex min-h-[35vh] flex-col items-center justify-center gap-6 px-8 py-12 md:min-h-[70vh] ${
                index === 0 ? "bg-[#f4effa]" : "bg-[#241a3e]"
              }`}
            >
              <div className="h-3 w-24 rounded-full bg-white/30 animate-pulse" />
              <div className="h-10 w-64 rounded-2xl bg-white/20 animate-pulse" />
              <div className="h-4 w-52 rounded-full bg-white/20 animate-pulse" />
              <div className="h-[56px] w-[240px] rounded-full bg-white/30 animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
