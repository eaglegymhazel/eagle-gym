import ClassRow from "./ClassRow";
import type { ClassCardItem } from "../types";
import { weekdayToId } from "../utils";
import { CalendarDays } from "lucide-react";

type DaySectionProps = {
  weekday: string;
  classes: ClassCardItem[];
  selectedIds: Set<string>;
  onToggleClass: (item: ClassCardItem) => void;
};

export default function DaySection({
  weekday,
  classes,
  selectedIds,
  onToggleClass,
}: DaySectionProps) {
  return (
    <section
      id={weekdayToId(weekday)}
      data-day-section="true"
      data-day-name={weekday}
      className="pt-4 first:pt-0"
    >
      <div className="px-1 sm:px-1.5">
        <h2 className="flex w-full items-center gap-1.5 whitespace-nowrap text-[19px] font-black text-[#143271] sm:text-[20px] lg:mx-auto lg:w-[96%] lg:max-w-[980px]">
          <CalendarDays className="h-4 w-4 text-[#8f88a3]" aria-hidden="true" />
          {weekday}
        </h2>
        <div className="relative mt-3 space-y-1 pl-8 lg:mx-auto lg:w-[96%] lg:max-w-[980px] lg:pl-5">
          <span
            aria-hidden="true"
            className="absolute left-[11px] top-1.5 bottom-1.5 w-0 rounded-full border-l-2 border-dashed border-[#b7accf] lg:left-[8px]"
          />
          {classes.map((item) => (
            <ClassRow
              key={item.id}
              weekday={weekday}
              item={item}
              selected={selectedIds.has(item.id)}
              onToggle={onToggleClass}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
