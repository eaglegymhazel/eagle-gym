import Link from "next/link";

export default function Nav() {
  return (
    <nav className="border-b border-black/5">
      <div className="mx-auto max-w-5xl px-6 py-3">
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-sm text-gray-700">
          <Link href="/about" className="rounded-full px-3 py-1 hover:bg-amber-50">
            About
          </Link>
          <Link href="/team" className="rounded-full px-3 py-1 hover:bg-sky-50">
            Team
          </Link>
          <Link href="/news" className="rounded-full px-3 py-1 hover:bg-rose-50">
            Competition News
          </Link>
          <Link href="/timetable" className="rounded-full px-3 py-1 hover:bg-emerald-50">
            Timetable
          </Link>
          <Link href="/contact" className="rounded-full px-3 py-1 hover:bg-amber-50">
            Contact
          </Link>

          <span className="hidden sm:inline h-6 w-px bg-black/10" aria-hidden />

          {/* If you want to keep these visible for now, keep them subtle */}
          <Link
            href="/members"
            className="rounded-full border border-black/10 bg-white px-3 py-1 text-gray-900 hover:bg-gray-50"
          >
            Members
          </Link>

          <Link
            href="/admin"
            className="rounded-full border border-black/10 bg-white px-3 py-1 text-gray-900 hover:bg-gray-50"
          >
            Admin
          </Link>
        </div>
      </div>
    </nav>
  );
}
