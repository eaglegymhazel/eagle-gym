import { DAY_SHORT, formatTime } from "../utils";
import type { SelectedClassDetail } from "../types";
import { ArrowRight, ChevronDown } from "lucide-react";

type SelectionTrayProps = {
  selectedCount: number;
  selectedItems: SelectedClassDetail[];
  expanded: boolean;
  onToggleExpanded: () => void;
  onClear: () => void;
  onContinue: () => void;
  onRemove: (classId: string) => void;
};

export default function SelectionTray({
  selectedCount,
  selectedItems,
  expanded,
  onToggleExpanded,
  onClear,
  onContinue,
  onRemove,
}: SelectionTrayProps) {
  const previewItems = selectedItems.slice(0, 2);
  const previewRemaining = Math.max(0, selectedItems.length - previewItems.length);
  const canExpand = selectedCount > 0;
  const expandedOpen = expanded && canExpand;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#ddd4eb] bg-[linear-gradient(180deg,_rgba(255,255,255,0.96),_rgba(249,246,253,0.98))] px-3 py-1.5 shadow-[0_-10px_24px_-22px_rgba(40,22,74,0.3)] backdrop-blur-md sm:px-5">
      <div className="mx-auto w-full max-w-5xl">
        <div className="bg-[linear-gradient(180deg,_#ffffff_0%,_#f7f3fb_100%)] p-1 shadow-[0_10px_22px_-20px_rgba(57,33,102,0.44)]">
          <div className="flex items-center gap-1.5">
            <div className="min-w-0 flex-1 rounded-xl bg-white px-3 py-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
              {selectedCount > 0 && (
                <p className="truncate text-sm font-bold text-[#2a203c]">
                  Class selection
                </p>
              )}
              {previewItems.length > 0 && (
                <div className="mt-0.5 flex flex-wrap items-center gap-1">
                  {previewItems.map((item) => (
                    <span
                      key={item.id}
                      className="inline-flex max-w-[145px] items-center rounded-full bg-[#f6f1ff] px-2 py-0.5 text-[10px] font-semibold text-[#5b2ca7]"
                    >
                      <span className="truncate">
                        {(DAY_SHORT[item.weekday] ?? item.weekday)} {formatTime(item.startTime)}
                      </span>
                    </span>
                  ))}
                  {previewRemaining > 0 && (
                    <span className="text-[10px] font-semibold text-[#6e5894]">+{previewRemaining}</span>
                  )}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={onToggleExpanded}
              disabled={!canExpand}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#e2d6f3] bg-white text-[#634193] transition hover:bg-[#f8f4ff] disabled:cursor-not-allowed disabled:opacity-45"
              aria-expanded={expandedOpen}
              aria-label="Toggle selected classes tray"
            >
              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform duration-180 motion-reduce:transition-none ${
                  expandedOpen ? "rotate-180" : ""
                }`}
                aria-hidden="true"
              />
            </button>

            <button
              type="button"
              onClick={onClear}
              disabled={selectedCount === 0}
              className="inline-flex h-8 items-center justify-center rounded-full px-2 text-xs font-medium text-[#7b7391] transition hover:text-[#5f5776] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Clear
            </button>

            <button
              type="button"
              onClick={onContinue}
              disabled={selectedCount === 0}
              className="inline-flex h-9 items-center justify-center gap-1 rounded-full bg-[#6c35c3] px-4 text-xs font-bold !text-white shadow-[0_12px_24px_-12px_rgba(69,34,124,0.78)] transition hover:bg-[#5b2ca7] disabled:cursor-not-allowed disabled:opacity-50 disabled:!text-white [&>*]:!text-white"
            >
              {selectedCount === 0
                ? "Select classes to review"
                : `Review ${selectedCount} ${
                    selectedCount === 1 ? "selection" : "selections"
                  }`}
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div
          className={`overflow-hidden transition-[max-height,opacity,margin] duration-180 ease-out motion-reduce:transition-none ${
            expandedOpen ? "mt-1.5 max-h-48 opacity-100" : "mt-0 max-h-0 opacity-0"
          }`}
        >
          <div className="rounded-lg border border-[#e6daf8] bg-[#fcfaff] p-1.5">
            {selectedItems.length === 0 ? (
              <p className="px-1 py-2 text-xs text-[#2E2A33]/65">No classes selected.</p>
            ) : (
              <ul className="flex flex-wrap gap-1.5">
                {selectedItems.map((item) => (
                  <li
                    key={item.id}
                    className="inline-flex max-w-full items-center gap-1 rounded-full border border-[#e1d3f7] bg-white px-2.5 py-1"
                  >
                    <span className="truncate text-xs font-semibold text-[#2a203c]">
                      {(DAY_SHORT[item.weekday] ?? item.weekday)} {formatTime(item.startTime)}
                      {typeof item.durationMinutes === "number" ? ` | ${item.durationMinutes}m` : ""}
                      {item.isFull ? " | Fully booked" : ""}
                    </span>
                    <button
                      type="button"
                      onClick={() => onRemove(item.id)}
                      className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-[#d9c8f3] text-[10px] font-black text-[#6c35c3] transition hover:bg-[#f4ecff]"
                      aria-label={`Remove ${item.name}`}
                    >
                      {"\u00D7"}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
