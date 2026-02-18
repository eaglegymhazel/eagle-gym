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
      className="space-y-1.5"
    >
      <div className="px-1 sm:px-2">
        <h2 className="flex w-full items-center gap-1.5 whitespace-nowrap text-base font-black text-[#20192e] after:ml-2 after:block after:h-px after:flex-1 after:bg-[#c6b5dd] after:content-['']">
          <CalendarDays className="h-4 w-4 text-[#654f88]" aria-hidden="true" />
          {weekday}
        </h2>
      </div>
      <div className="space-y-1.5">
        {classes.map((item) => (
          <ClassRow
            key={item.id}
            item={item}
            selected={selectedIds.has(item.id)}
            onToggle={onToggleClass}
          />
        ))}
      </div>
    </section>
  );
}
