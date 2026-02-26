type SchedulePageHeaderProps = {
  childName: string;
};

export default function SchedulePageHeader({
  childName,
}: SchedulePageHeaderProps) {
  return (
    <header className="space-y-3">
      <div className="h-1.5 w-18 rounded-full bg-gradient-to-r from-[#6c35c3] to-[#8f66d7]" />
      <h1 className="text-3xl font-black tracking-tight text-[#1f1a25] sm:text-4xl">
        Recreational Classes
      </h1>
      <div className="px-0.5 py-0.5">
        <div className="inline-flex items-center rounded-full border border-[#6c35c3]/25 bg-white/85 px-4 py-1.5 text-sm font-semibold uppercase tracking-[0.18em] text-[#2a203c]/70 shadow-[0_12px_28px_-18px_rgba(31,26,37,0.5)] backdrop-blur">
          Booking for{" "}
          <span className="ml-1 font-bold text-[#2a203c]">
            {childName || "selected child"}
          </span>
        </div>
      </div>
    </header>
  );
}
