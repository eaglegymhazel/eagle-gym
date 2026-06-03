import type { Metadata } from "next";
import ContactForm from "./ContactForm";

const ADDRESS = "11 Knox St, Paisley PA1 2QJ, United Kingdom";
const PHONE_DISPLAY = "0141 840 1454";
const PHONE_TEL = "01418401454";
const MAP_QUERY = encodeURIComponent(ADDRESS);

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Contact Eagle Gymnastics Academy in Paisley for class information, bookings, birthday parties, and general enquiries.",
  alternates: {
    canonical: "/contact",
  },
};

export default function ContactPage() {
  return (
    <main className="w-full overflow-x-hidden bg-[#faf7fb]">
      <section className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
        <h1 className="text-4xl font-extrabold leading-tight text-[#143271] sm:text-5xl">
          Speak to Eagle Gymnastics Academy
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-8 text-[#2E2A33]/78 sm:text-[17px]">
          Questions about classes, pathways, or availability? Reach out and we
          will help you find the right next step.
        </p>
      </section>

      <section className="mx-auto grid w-full max-w-5xl gap-6 overflow-x-hidden px-4 pb-10 sm:px-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="min-w-0 border border-[#d9cde7] bg-white p-5 sm:p-6">
          <h2 className="text-2xl font-extrabold leading-tight text-[#143271]">
            Send a Message
          </h2>
          <p className="mt-3 text-sm leading-7 text-[#2E2A33]/78">
            If you have any questions about classes, bookings, memberships, or the club in general, please use the form below and a member of our team will get back to you as soon as possible. Whether you&apos;re looking to join, arrange a trial, or simply need more information, we&apos;re happy to help.
          </p>
          <div className="mt-5">
            <ContactForm />
          </div>
        </div>

        <div className="min-w-0 space-y-6">
          <div className="min-w-0 border border-[#d9cde7] bg-white px-5 py-5 sm:px-6">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#143271]">
              Phone
            </p>
            <a
              className="mt-2 inline-block text-base font-semibold text-[#2E2A33] hover:underline"
              href={`tel:${PHONE_TEL}`}
            >
              {PHONE_DISPLAY}
            </a>

            <p className="mt-5 text-xs font-bold uppercase tracking-[0.14em] text-[#143271]">
              Address
            </p>
            <p className="mt-2 text-sm font-semibold text-[#2E2A33]">{ADDRESS}</p>

            <a
              className="mt-5 inline-flex min-h-11 items-center justify-center border border-[#143271] px-5 py-2.5 text-xs font-bold uppercase tracking-[0.08em] text-[#143271] transition hover:bg-[#143271] hover:text-[#f9f6fa]"
              href={`https://www.google.com/maps/search/?api=1&query=${MAP_QUERY}`}
              target="_blank"
              rel="noreferrer"
            >
              Open in Google Maps
            </a>
          </div>

          <div className="min-w-0 overflow-hidden border border-[#d9cde7] bg-white">
            <div className="aspect-[16/10] w-full min-h-[260px]">
              <iframe
                title="Map: Eagle Gymnastics Academy"
                className="h-full w-full"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                src={`https://www.google.com/maps?q=${MAP_QUERY}&output=embed`}
              />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
