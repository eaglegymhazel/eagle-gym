import Link from "next/link";

export default function BookingSuccessPage() {
  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-2xl flex-col items-center justify-center px-6 py-16 text-center">
      <h1 className="text-3xl font-semibold text-[#143271]">Payment successful</h1>
      <p className="mt-4 text-base text-slate-700">
        Your Stripe checkout completed successfully. You can now continue with your booking.
      </p>
      <Link
        href="/book/recreational"
        className="mt-8 inline-flex rounded-md bg-[#143271] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#0f2758]"
      >
        Return to booking
      </Link>
    </main>
  );
}
