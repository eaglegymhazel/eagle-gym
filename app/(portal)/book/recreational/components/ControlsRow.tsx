type ControlsRowProps = {
  selectedCount: number;
  showSelectedOnly: boolean;
  onToggleShowSelectedOnly: () => void;
};

export default function ControlsRow({
  selectedCount,
  showSelectedOnly,
  onToggleShowSelectedOnly,
}: ControlsRowProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[#e7e1f0] bg-white px-2 py-1.5 shadow-[0_6px_14px_-12px_rgba(37,28,56,0.3)]">
      <span
        className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${
          selectedCount > 0
            ? "border-[#d3c5ea] bg-[#f4effb] text-[#4b2f79]"
            : "border-[#ebe6f2] bg-[#fbf9fe] text-[#584d6b]"
        }`}
      >
        Selected: {selectedCount}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={showSelectedOnly}
        onClick={onToggleShowSelectedOnly}
        className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold transition ${
          showSelectedOnly
            ? "border-[#6c35c3] bg-[#f1e9fd] text-[#4b2f79]"
            : "border-[#e5deef] bg-white text-[#4f4266] hover:bg-[#f8f5fc]"
        }`}
      >
        <span
          className={`inline-flex h-4 w-7 items-center rounded-full p-0.5 transition ${
            showSelectedOnly ? "bg-[#6c35c3]" : "bg-[#d8c7f4]"
          }`}
          aria-hidden="true"
        >
          <span
            className={`h-3 w-3 rounded-full bg-white transition ${
              showSelectedOnly ? "translate-x-3" : "translate-x-0"
            }`}
          />
        </span>
        Show selected only
      </button>
    </div>
  );
}
