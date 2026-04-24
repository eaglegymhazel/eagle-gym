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
          <div className="relative flex w-full items-center gap-2 py-2 sm:gap-4 lg:min-h-[96px]">
            <div className="shrink-0 lg:justify-self-start">
              <Link href="/" aria-label="Eagle Gymnastics Academy home">
                <Image
                  src="/brand/new_logo1.png"
                  alt="Eagle Gymnastics Academy"
                  width={180}
                  height={184}
                  className="w-[5rem] max-w-none object-contain drop-shadow-[0_10px_14px_rgba(0,0,0,0.22)] transition-transform duration-200 hover:scale-105 sm:w-[5.8rem] lg:w-[6.4rem]"
                  priority
                />
              </Link>
            </div>
            <div className="min-w-0 flex-1 lg:absolute lg:left-1/2 lg:top-1/2 lg:min-w-fit lg:flex-none lg:-translate-x-1/2 lg:-translate-y-1/2">
              <Nav
                disableMobileMenu={disableMobileNavMenu}
                mobileRightLink={disableMobileNavMenu ? undefined : mobileRightLink}
              />
            </div>
            <div className="absolute right-16 top-1/2 -translate-y-1/2 lg:hidden">
              <LoginBadge />
            </div>
            <div className="hidden lg:absolute lg:right-0 lg:top-1/2 lg:block lg:-translate-y-1/2">
              <LoginBadge />
            </div>
          </div>
          {disableMobileNavMenu && mobileRightLink ? (
            <div className="flex justify-end pb-2 lg:hidden">
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

      <main className="mt-0 w-full px-0 pt-0 pb-4">{children}</main>

      <footer className="border-t border-black/10 bg-[#f7f2fb]">
        <div className="mx-auto grid w-full max-w-6xl gap-5 px-4 py-5 sm:px-6 md:grid-cols-2 md:gap-8">

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#5f5177]">
              Contact
            </p>
            <div className="space-y-1 text-sm text-[#2E2A33]/85">
              <p>
                Phone:{" "}
                <a href="tel:01418401454" className="font-semibold hover:underline">
                  0141 840 1454
                </a>
              </p>
              <p>
                Email:{" "}
                <a href="mailto:Eaglegym1@gmail.com" className="font-semibold hover:underline">
                  Eaglegym1@gmail.com
                </a>
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#5f5177]">
              Quick links
            </p>
            <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm font-semibold text-[#143271]">
              <Link href="/about" className="hover:underline">
                About
              </Link>
              <Link href="/timetable" className="hover:underline">
                Timetable
              </Link>
              <Link href="/news" className="hover:underline">
                Updates
              </Link>
              <Link href="/contact" className="hover:underline">
                Contact
              </Link>
              <FooterAuthLink />
            </div>
            <div className="flex items-center gap-3 pt-1">
              <a
                href="https://www.facebook.com/eaglegymnasticsacademy/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="inline-flex h-9 w-9 items-center justify-center border border-[#d9cde7] bg-white transition hover:opacity-80"
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
                className="inline-flex h-9 w-9 items-center justify-center border border-[#d9cde7] bg-white transition hover:opacity-80"
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
        </div>

        <div className="border-t border-black/10">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-1 px-4 py-3 text-xs text-[#2E2A33]/75 sm:px-6 md:flex-row md:items-center md:justify-between">
            <p>© {currentYear} Eagle Gymnastics Academy. All rights reserved.</p>
            <p>Registered coaching and class operations in Paisley.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
