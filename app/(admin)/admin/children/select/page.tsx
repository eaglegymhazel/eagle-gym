import ChildPicker from "@/components/admin/ChildPicker";
import { MOCK_CHILDREN, type Child } from "@/components/admin/mockChildren";

export default function AdminChildSelectPage() {
  const childPickerProps = {
    children: MOCK_CHILDREN,
    recentChildren: MOCK_CHILDREN.slice(0, 6).map((child) => child.id),
    onSelect: (child: Child) => {
      console.log(child);
    },
  };

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      <section className="rounded-2xl border border-[#e8ddf8] bg-white p-5 shadow-[0_16px_32px_-24px_rgba(42,32,60,0.55)]">
        <h1 className="text-2xl font-black tracking-tight text-[#1f1a25]">Child Picker</h1>
        <p className="mt-1 text-sm text-[#5e516f]">
          UI-only child selection for coaches and administrators.
        </p>
        <div className="mt-5">
          <ChildPicker {...childPickerProps} />
        </div>
      </section>
    </main>
  );
}
