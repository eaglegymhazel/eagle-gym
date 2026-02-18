type SchedulePageHeaderProps = {
  childName: string;
  ageBandLabel: string;
};

export default function SchedulePageHeader({
  childName,
  ageBandLabel,
}: SchedulePageHeaderProps) {
  const initials = getInitials(childName);

  return (
    <header className="space-y-3">
      <div className="h-1.5 w-18 rounded-full bg-gradient-to-r from-[#6c35c3] to-[#8f66d7]" />
      <h1 className="text-3xl font-black tracking-tight text-[#1f1a25] sm:text-4xl">
        Recreational Classes
      </h1>
      <div className="sticky top-24 z-30 rounded-2xl border border-[#ddd6e9] bg-white px-3 py-3 shadow-[0_8px_20px_-16px_rgba(40,28,62,0.3)] sm:top-20 sm:px-4">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(145deg,_#f0dbff_0%,_#d8bcf7_100%)] text-[11px] font-black text-[#4a236f] ring-1 ring-[#d8c6ee]">
            {initials}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-[#2a203c] sm:text-base">
              Booking for {childName}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <span className="inline-flex items-center rounded-full bg-[#f8f5fc] px-2.5 py-0.5 text-[11px] font-semibold text-[#54446e] ring-1 ring-[#e4dced]">
                {ageBandLabel}
              </span>
              <span className="inline-flex items-center rounded-full bg-[#f8f5fc] px-2.5 py-0.5 text-[11px] font-semibold text-[#54446e] ring-1 ring-[#e4dced]">
                Recreational Gymnastics
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

function getInitials(name: string): string {
  const parts = name
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length === 0) return "EG";
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : "";
  const initials = `${first}${last}`.toUpperCase();
  return initials || "EG";
}
