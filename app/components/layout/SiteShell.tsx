import Image from "next/image";
import Link from "next/link";
import LoginBadge from "../LoginBadge";
import Nav from "../Nav";
import FooterAuthLink from "./FooterAuthLink";

export default function SiteShell({
  children,
  disableMobileNavMenu = false,
  mobileRightLink,
}: {
  children: React.ReactNode;
  disableMobileNavMenu?: boolean;
  mobileRightLink?: {
    href: string;
    label: string;
  };
}) {
  const currentYear = new Date().getFullYear();

  return (
    <div
      className="min-h-screen bg-[#faf7fb]"
      style={{ backgroundColor: "#faf7fb" }}
    >
      <div className="sticky top-0 z-50 bg-[#faf7fb]/95 backdrop-blur">
        <div className="mx-auto w-full max-w-6xl px-3 sm:px-4 lg:px-6">
          <div className="relative flex w-full items-center gap-2 py-2 sm:gap-4 md:min-h-[108px] xl:min-h-[96px]">
            <div className="shrink-0 md:fixed md:left-4 md:top-2 md:z-[55] xl:left-6">
              <Link href="/" aria-label="Eagle Gymnastics Academy home">
                <Image
                  src="/brand/new_logo1.png"
                  alt="Eagle Gymnastics Academy"
                  width={180}
                  height={184}
                  className="w-[5rem] max-w-none object-contain drop-shadow-[0_10px_14px_rgba(0,0,0,0.22)] transition-transform duration-200 hover:scale-105 sm:w-[5.8rem] xl:w-[6.4rem]"
                  priority
                />
              </Link>
            </div>
            <div className="min-w-0 flex-1 xl:absolute xl:left-1/2 xl:top-1/2 xl:min-w-fit xl:flex-none xl:-translate-x-1/2 xl:-translate-y-1/2">
              <Nav
                disableMobileMenu={disableMobileNavMenu}
                mobileRightLink={disableMobileNavMenu ? undefined : mobileRightLink}
              />
            </div>
            <div className="absolute right-[6.25rem] top-1/2 -translate-y-1/2 sm:right-[7.75rem] md:fixed md:right-4 md:top-5 md:translate-y-0 xl:hidden">
              <LoginBadge />
            </div>
            {disableMobileNavMenu ? (
              <div
                id="admin-mobile-nav-slot"
                className="absolute right-3 top-1/2 z-[60] -translate-y-1/2 sm:right-4 md:right-[13.25rem] xl:hidden"
              />
            ) : null}
            <div className="hidden xl:fixed xl:right-6 xl:top-6 xl:block xl:translate-y-0">
              <LoginBadge />
            </div>
          </div>
          {disableMobileNavMenu && mobileRightLink ? (
            <div className="flex justify-end pb-2 xl:hidden">
              <Link
                href={mobileRightLink.href}
                className="inline-flex h-9 items-center rounded-md border border-[#d9cdef] bg-white px-3 text-[11px] font-semibold uppercase tracking-[0.04em] text-[#4d2d79] transition hover:bg-[#f8f3ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6c35c3]/40"
              >
                {mobileRightLink.label}
              </Link>
            </div>
          ) : null}
        </div>
        <div className="h-px w-full bg-[#6c35c3]/20" />
      </div>

      <main className="mt-0 w-full px-0 pt-0 pb-0">{children}</main>

      <footer className="border-t border-[#dacfe8] bg-[#f6f0f9]">
        <div className="w-full px-4 py-8 sm:px-6 lg:px-10 lg:py-9">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)_minmax(0,0.95fr)] lg:items-start">
            <div className="min-w-0">
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#6c35c3]">
                Eagle Gymnastics Academy
              </p>
              <p className="mt-3 max-w-md text-sm leading-7 text-[#2E2A33]/78">
                Recreational classes, competition training, summer camps, and birthday parties in a safe, energetic gymnastics environment in Paisley.
              </p>
              <div className="mt-5 flex flex-col gap-2 text-sm font-semibold text-[#143271] sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-4 sm:gap-y-2">
                <a href="tel:01418401454" className="hover:text-[#6c35c3] hover:underline">
                  0141 840 1454
                </a>
                <a href="mailto:Eaglegym1@gmail.com" className="hover:text-[#6c35c3] hover:underline">
                  Eaglegym1@gmail.com
                </a>
              </div>
            </div>

            <div className="min-w-0">
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#6c35c3]">
                Quick Links
              </p>
              <div className="mt-4 flex flex-wrap gap-x-5 gap-y-3 text-sm font-semibold text-[#143271]">
                <Link href="/book" className="transition hover:text-[#6c35c3]">
                  Book
                </Link>
                <Link href="/team" className="transition hover:text-[#6c35c3]">
                  About
                </Link>
                <Link href="/timetable" className="transition hover:text-[#6c35c3]">
                  Timetable
                </Link>
                <Link href="/news" className="transition hover:text-[#6c35c3]">
                  News and Media
                </Link>
                <Link href="/contact" className="transition hover:text-[#6c35c3]">
                  Contact Us
                </Link>
                <FooterAuthLink />
              </div>

              <div className="mt-5 flex items-center gap-3">
                <a
                  href="https://www.facebook.com/eaglegymnasticsacademy/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#d8cde6] bg-white shadow-[0_10px_22px_-18px_rgba(34,21,54,0.45)] transition hover:-translate-y-0.5 hover:border-[#c7b5e2] hover:bg-[#fbf8ff]"
                >
                  <Image
                    src="/brand/socialmedia/facebook.png"
                    alt="Facebook"
                    width={20}
                    height={20}
                    className="h-5 w-5"
                  />
                </a>
                <a
                  href="https://www.instagram.com/eaglegymnasticsacademy/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#d8cde6] bg-white shadow-[0_10px_22px_-18px_rgba(34,21,54,0.45)] transition hover:-translate-y-0.5 hover:border-[#c7b5e2] hover:bg-[#fbf8ff]"
                >
                  <Image
                    src="/brand/socialmedia/instagram.png"
                    alt="Instagram"
                    width={20}
                    height={20}
                    className="h-5 w-5"
                  />
                </a>
              </div>
            </div>

            <div className="min-w-0 lg:text-right">
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#6c35c3]">
                Affiliated With
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-3 lg:justify-end">
                <Image
                  src="/brand/NGA_logo.jpg"
                  alt="National Gymnastics Association"
                  width={708}
                  height={679}
                  unoptimized
                  className="h-10 w-auto object-contain"
                />
                <Image
                  src="/brand/IGA_logo.jpg"
                  alt="Independent Gymnastics Association"
                  width={733}
                  height={89}
                  unoptimized
                  className="h-6 w-auto object-contain"
                />
              </div>
              <p className="mt-4 max-w-sm text-sm leading-7 text-[#2E2A33]/72 lg:ml-auto">
                Registered coaching and class operations in Paisley, with pathways for both recreational and competition gymnastics.
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-[#dacfe8] bg-white/35">
          <div className="flex w-full flex-col gap-2 px-4 py-3 text-xs text-[#2E2A33]/72 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-10">
            <p>© {currentYear} Eagle Gymnastics Academy. All rights reserved.</p>
            <p>Affiliated with NGA and IGA.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
