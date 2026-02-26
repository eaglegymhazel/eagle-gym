import type { LucideIcon } from "lucide-react";

type AdminNavItemProps = {
  label: string;
  icon: LucideIcon;
  isActive: boolean;
  onSelect: () => void;
};

export default function AdminNavItem({
  label,
  icon: Icon,
  isActive,
  onSelect,
}: AdminNavItemProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-current={isActive ? "page" : undefined}
      className={[
        "group relative flex min-h-12 w-full cursor-pointer items-center gap-3 rounded-[13px] px-3.5 py-2.5 text-left text-[15px] transition-colors duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6e2ac0] focus-visible:ring-offset-2",
        isActive
          ? "bg-[rgba(110,42,192,0.08)] font-semibold text-[#6e2ac0]"
          : "bg-transparent font-medium text-black/80 hover:bg-black/[0.04] active:bg-black/[0.08]",
      ].join(" ")}
    >
      <span
        aria-hidden
        className={[
          "absolute left-1 top-1 bottom-1 w-1 rounded-full transition-opacity",
          isActive ? "bg-[#6e2ac0] opacity-100" : "bg-[#6e2ac0] opacity-0",
        ].join(" ")}
      />
      <Icon
        className={[
          "h-5 w-5 shrink-0 transition-colors duration-200",
          isActive ? "text-[#6e2ac0]" : "text-black/65",
        ].join(" ")}
        aria-hidden="true"
      />
      <span>{label}</span>
    </button>
  );
}
