import { LockKeyhole } from "lucide-react";

type SearchParams = {
  error?: string;
  next?: string;
};

function getSafeDestination(value: string | undefined): string {
  if (!value?.startsWith("/") || value.startsWith("//")) return "/";
  return value;
}

export default async function SiteAccessPage({
  searchParams,
}: {
  searchParams?: SearchParams | Promise<SearchParams>;
}) {
  const resolvedSearchParams = await searchParams;
  const destination = getSafeDestination(resolvedSearchParams?.next);
  const error = resolvedSearchParams?.error;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#faf7fb] px-4 py-12 sm:px-6">
      <section className="w-full max-w-lg rounded-[2rem] border border-[#ded1ef] bg-white p-6 text-center shadow-[0_24px_60px_-42px_rgba(31,20,54,0.45)] sm:p-10">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#f2ebfb] text-[#6c35c3]">
          <LockKeyhole className="h-7 w-7" aria-hidden="true" />
        </div>

        <p className="mt-5 text-xs font-bold uppercase tracking-[0.18em] text-[#6c35c3]">
          Eagle Gymnastics Club
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-[#2a0c4f]">
          We&apos;re getting the new website ready
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#2E2A33]/75">
          The website is currently available for pre-launch testing. Please enter
          the access password to continue.
        </p>

        <form
          action="/api/site-gate/unlock"
          method="post"
          className="mx-auto mt-7 max-w-sm text-left"
        >
          <input type="hidden" name="next" value={destination} />
          <label
            htmlFor="site-password"
            className="text-sm font-bold text-[#2a0c4f]"
          >
            Access password
          </label>
          <input
            id="site-password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            autoFocus
            className="mt-2 h-12 w-full rounded-xl border border-[#d8c7f4] bg-white px-4 text-base text-[#2E2A33] outline-none transition focus:border-[#6c35c3] focus:ring-4 focus:ring-[#6c35c3]/10"
          />

          {error === "password" ? (
            <p className="mt-2 text-sm font-semibold text-[#8b1f35]">
              That password wasn&apos;t recognised. Please try again.
            </p>
          ) : null}
          {error === "configuration" ? (
            <p className="mt-2 text-sm font-semibold text-[#8b1f35]">
              Site access has not been configured correctly. Please contact the
              website administrator.
            </p>
          ) : null}

          <button
            type="submit"
            className="mt-5 inline-flex h-12 w-full cursor-pointer items-center justify-center rounded-full bg-[#6c35c3] px-6 text-sm font-bold text-white shadow-[0_12px_24px_-12px_rgba(69,34,124,0.78)] transition hover:bg-[#5b2ca7]"
          >
            Enter website
          </button>
        </form>
      </section>
    </main>
  );
}
