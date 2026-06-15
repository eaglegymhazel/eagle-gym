import Link from "next/link";
import { CreditCard } from "lucide-react";

export default function BookingCancelPage() {
  return (
    <main className="flex min-h-[65vh] w-full items-center justify-center bg-[#faf7fb] px-4 py-12 sm:px-6">
      <section className="w-full max-w-2xl rounded-[2rem] border border-[#ded1ef] bg-white p-6 text-center shadow-[0_24px_60px_-42px_rgba(31,20,54,0.45)] sm:p-10">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#f2ebfb] text-[#6c35c3]">
          <CreditCard className="h-7 w-7" aria-hidden="true" />
        </div>

        <h1 className="mt-5 text-3xl font-black tracking-tight text-[#2a0c4f]">
          Your booking is not complete
        </h1>
        <p className="mx-auto mt-3 max-w-lg text-base leading-7 text-[#2E2A33]/75">
          Don&apos;t worry, no payment has been taken. Return to your account when
          you&apos;re ready to start your booking again.
        </p>

        <div className="mt-8 flex justify-center">
          <Link
            href="/account"
            className="inline-flex h-12 items-center justify-center rounded-full bg-[#6c35c3] px-6 text-sm font-bold text-white transition hover:bg-[#5b2ca7]"
          >
            Return to my account
          </Link>
        </div>
      </section>
    </main>
  );
}
