import ContactForm from "./ContactForm";

const ADDRESS = "11 Knox St, Paisley PA1 2QJ, United Kingdom";
const PHONE_DISPLAY = "+44 141 840 1454";
const PHONE_TEL = "+441418401454";
const MAP_QUERY = encodeURIComponent(ADDRESS);

export default function ContactPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <header className="text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-gray-900 sm:text-4xl">
          Contact us
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-base text-gray-700">
          Questions about classes, availability, or which pathway is right? Send a message and we’ll get back to you.
        </p>
      </header>

      <section className="mt-10 grid gap-6 lg:grid-cols-2">
        {/* Left: details + hours */}
        <div className="rounded-3xl border border-black/5 bg-white p-7 shadow-sm sm:p-8">
          <h2 className="text-xl font-semibold tracking-tight text-gray-900">
            Visit or call
          </h2>

          <dl className="mt-5 space-y-4 text-sm">
            <div>
              <dt className="font-medium text-gray-900">Address</dt>
              <dd className="mt-1 text-gray-700">{ADDRESS}</dd>
              <div className="mt-2">
                <a
                  className="text-sm font-semibold text-gray-900 hover:underline"
                  href={`https://www.google.com/maps/search/?api=1&query=${MAP_QUERY}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open in Google Maps
                </a>
              </div>
            </div>

            <div>
              <dt className="font-medium text-gray-900">Phone</dt>
              <dd className="mt-1">
                <a className="text-gray-700 hover:underline" href={`tel:${PHONE_TEL}`}>
                  {PHONE_DISPLAY}
                </a>
              </dd>
            </div>
          </dl>

          <div className="mt-8">
            <h3 className="text-sm font-semibold text-gray-900">Opening times</h3>
            <div className="mt-3 rounded-2xl bg-gray-50 p-4 ring-1 ring-black/5">
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-center justify-between">
                  <span>Monday</span>
                  <span className="font-medium text-gray-900">9:00–17:00</span>
                </li>
                <li className="flex items-center justify-between">
                  <span>Tuesday</span>
                  <span className="font-medium text-gray-900">9:00–17:00</span>
                </li>
                <li className="flex items-center justify-between">
                  <span>Wednesday</span>
                  <span className="font-medium text-gray-900">9:00–17:00</span>
                </li>
                <li className="flex items-center justify-between">
                  <span>Thursday</span>
                  <span className="font-medium text-gray-900">9:00–17:00</span>
                </li>
                <li className="flex items-center justify-between">
                  <span>Friday</span>
                  <span className="font-medium text-gray-900">9:00–17:00</span>
                </li>
                <li className="flex items-center justify-between">
                  <span>Saturday</span>
                  <span className="font-medium text-gray-900">9:00–17:00</span>
                </li>
                <li className="flex items-center justify-between">
                  <span>Sunday</span>
                  <span className="font-medium text-gray-900">9:00–17:00</span>
                </li>
              </ul>
            </div>

            <p className="mt-3 text-xs text-gray-500">
              Times shown are placeholders for now. We can later pull these from Sanity without changing the layout.
            </p>
          </div>
        </div>

        {/* Right: map + form */}
        <div className="space-y-6">
          <div className="overflow-hidden rounded-3xl border border-black/5 bg-white shadow-sm">
            <div className="aspect-[4/3] w-full">
              <iframe
                title="Map: Eagle Gymnastics Academy"
                className="h-full w-full"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                src={`https://www.google.com/maps?q=${MAP_QUERY}&output=embed`}
              />
            </div>
          </div>

          <div className="rounded-3xl border border-black/5 bg-white p-7 shadow-sm sm:p-8">
            <h2 className="text-xl font-semibold tracking-tight text-gray-900">
              Send a message
            </h2>
            <p className="mt-2 text-sm text-gray-700">
              Leave your details and we’ll reply as soon as we can.
            </p>

            <div className="mt-6">
              <ContactForm />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
