export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-amber-50 via-sky-50 to-emerald-50 px-6 py-12 sm:px-10">
        <div className="pointer-events-none absolute -top-20 -left-20 h-64 w-64 rounded-full bg-sky-300/35 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-orange-200/45 blur-3xl" />

        <div className="relative">
          <p className="inline-flex items-center rounded-full border bg-white/80 px-3 py-1 text-xs font-semibold text-gray-700">
            Paisley West End - 11 Knox Street
          </p>

          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-gray-900 sm:text-5xl">
            A warm, joyful home for young gymnasts
          </h1>

          <p className="mt-4 max-w-3xl text-base leading-relaxed text-gray-700 sm:text-lg">
            Welcome to Eagle, Paisley&apos;s West End gymnastics club - right here in the old St Mirren Social Club at 11 Knox Street. We&apos;re easy to reach by public transport, with our own parking right next to the building.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href="/timetable"
              className="rounded-xl border bg-white px-5 py-3 text-sm font-medium text-gray-900 shadow-sm hover:bg-amber-50"
            >
              View Timetable
            </a>
            <a
              href="/contact"
              className="rounded-xl border px-5 py-3 text-sm font-medium text-gray-900 hover:bg-emerald-50"
            >
              Contact Us
            </a>
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="mt-10 rounded-3xl border bg-white p-7 shadow-sm sm:p-8">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-semibold tracking-tight text-gray-900">
              A club built on care, confidence, and friendship
            </h2>
            <p className="mt-3 text-gray-700 leading-relaxed">
              Founded by former squad gymnast and experienced coach Hazel Watt, who&apos;s been inspiring young athletes in Renfrewshire since 2001, our club is all about combining energy, discipline, and friendship. We&apos;re a big family where everyone from total beginners to competition-ready gymnasts feels at home.
            </p>
            <p className="mt-3 text-gray-700 leading-relaxed">
              Our purpose-built gym is packed with Olympic-standard equipment, giving children the chance to train like the champions they see on TV, in a safe and supportive environment.
            </p>
          </div>
          <div className="rounded-2xl bg-gradient-to-br from-amber-50 via-white to-sky-50 p-5">
            <h3 className="text-sm font-semibold text-gray-900">What parents love</h3>
            <ul className="mt-3 space-y-2 text-sm text-gray-700">
              <li className="flex gap-2">
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-amber-400" />
                Friendly coaches who know every child by name
              </li>
              <li className="flex gap-2">
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-amber-400" />
                Clear progress paths from first cartwheel to competition
              </li>
              <li className="flex gap-2">
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-amber-400" />
                A safe, welcoming space that feels like a family
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Pathways */}
      <section className="mt-10">
        <div className="flex items-end justify-between gap-6">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">
              Choose your pathway
            </h2>
            <p className="mt-2 max-w-2xl text-gray-700">
              Whether your child wants to tumble for fun or shine on the competition floor, we have something for them.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div className="group relative overflow-hidden rounded-3xl border bg-gradient-to-br from-amber-50 via-white to-sky-50 p-6">
            <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-amber-200/45 blur-2xl transition-transform group-hover:scale-110" />

            <div className="relative">
              <p className="inline-flex items-center rounded-full bg-white/80 px-3 py-1 text-xs font-medium text-gray-700">
                Recreational
              </p>

              <h3 className="mt-3 text-xl font-semibold text-gray-900">
                Recreational Classes
              </h3>

              <p className="mt-2 text-gray-700">
                Weekly classes designed for confidence, coordination, and fun - perfect for beginners and developing gymnasts.
              </p>

              <ul className="mt-4 space-y-2 text-sm text-gray-700">
                <li className="flex gap-2">
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-amber-400" />
                  One, two, or three sessions per week
                </li>
                <li className="flex gap-2">
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-amber-400" />
                  Friendly coaching and structured progress
                </li>
                <li className="flex gap-2">
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-amber-400" />
                  Great for building strong foundations
                </li>
              </ul>

              <div className="mt-6 flex flex-wrap gap-3">
                <a
                  href="/book-recreational"
                  className="rounded-xl bg-orange-200 px-5 py-3 text-sm font-semibold text-gray-900 shadow-sm hover:bg-orange-300"
                >
                  Book Recreational
                </a>
                <a
                  href="/about"
                  className="rounded-xl border bg-white/80 px-5 py-3 text-sm font-medium text-gray-900 hover:bg-amber-50"
                >
                  Learn more
                </a>
              </div>
            </div>
          </div>

          <div className="group relative overflow-hidden rounded-3xl border bg-gradient-to-br from-teal-50 via-white to-rose-50 p-6">
            <div className="pointer-events-none absolute -left-16 -bottom-16 h-44 w-44 rounded-full bg-teal-200/50 blur-2xl transition-transform group-hover:scale-110" />

            <div className="relative">
              <p className="inline-flex items-center rounded-full bg-white/80 px-3 py-1 text-xs font-medium text-gray-700">
                Competition
              </p>

              <h3 className="mt-3 text-xl font-semibold text-gray-900">
                Competition Training
              </h3>

              <p className="mt-2 text-gray-700">
                More intensive training for gymnasts progressing towards competitions, with structured goals and increased weekly hours.
              </p>

              <ul className="mt-4 space-y-2 text-sm text-gray-700">
                <li className="flex gap-2">
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-teal-400" />
                  Tailored training hours and pathways
                </li>
                <li className="flex gap-2">
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-teal-400" />
                  Skill development, strength, and conditioning
                </li>
                <li className="flex gap-2">
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-teal-400" />
                  Supportive coaching for competition goals
                </li>
              </ul>

              <div className="mt-6 flex flex-wrap gap-3">
                <a
                  href="/book-competition"
                  className="rounded-xl bg-teal-200 px-5 py-3 text-sm font-semibold text-gray-900 shadow-sm hover:bg-teal-300"
                >
                  Book Competition
                </a>
                <a
                  href="/news"
                  className="rounded-xl border bg-white/80 px-5 py-3 text-sm font-medium text-gray-900 hover:bg-teal-50"
                >
                  Competition news
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Closing message */}
      <section className="mt-10 rounded-3xl border bg-gradient-to-br from-white via-amber-50 to-sky-50 p-7">
        <h2 className="text-lg font-semibold text-gray-900">
          A place to grow, make friends, and discover what you&apos;re capable of
        </h2>
        <p className="mt-2 text-gray-700 leading-relaxed">
          At Eagle, gymnastics isn&apos;t just a sport - it&apos;s a place to grow, make friends, and discover what you&apos;re capable of.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <a
            href="/contact"
            className="rounded-xl border px-5 py-3 text-sm font-medium text-gray-900 hover:bg-amber-50"
          >
            Ask a question
          </a>
          <a
            href="/timetable"
            className="rounded-xl border px-5 py-3 text-sm font-medium text-gray-900 hover:bg-sky-50"
          >
            See class times
          </a>
        </div>
      </section>
    </>
  );
}
