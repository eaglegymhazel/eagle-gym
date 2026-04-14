import Image from "next/image";
import Link from "next/link";
import LoginBadge from "../LoginBadge";
import Nav from "../Nav";

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
  return (
    <div
      className="min-h-screen bg-[#faf7fb]"
      style={{ backgroundColor: "#faf7fb" }}
    >
      <div className="sticky top-0 z-50 bg-[#faf7fb]/95 backdrop-blur">
        <div className="mx-auto w-full max-w-6xl px-3 sm:px-4 lg:px-6">
          <div className="relative flex w-full items-center gap-2 py-2 sm:gap-4">
            <div className="shrink-0">
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
            <div className="min-w-0 flex-1">
              <Nav
                disableMobileMenu={disableMobileNavMenu}
                mobileRightLink={mobileRightLink}
              />
            </div>
            <div className="absolute right-16 top-1/2 -translate-y-1/2 lg:hidden">
              <LoginBadge />
            </div>
            <div className="hidden shrink-0 lg:block">
              <LoginBadge />
            </div>
          </div>
        </div>
        <div className="h-px w-full bg-[#6c35c3]/20" />
      </div>

      <main className="mt-0 w-full px-0 pt-0 pb-4">{children}</main>

      <footer className="border-t border-black/5">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-4 px-6 py-6 text-sm font-semibold text-[#2a0c4f]/80 sm:justify-between">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span>Call:</span>
            <a
              href="tel:01418401454"
              className="underline-offset-4 hover:underline"
            >
              0141 840 1454
            </a>
            <span className="hidden sm:inline">|</span>
            <span>Email:</span>
            <a
              href="mailto:Eaglegym1@gmail.com"
              className="underline-offset-4 hover:underline"
            >
              Eaglegym1@gmail.com
            </a>
          </div>
          <a
            href="https://www.facebook.com/eaglegymnasticsacademy/"
            aria-label="Facebook"
            className="inline-flex items-center justify-center hover:opacity-80"
          >
            <Image
              src="/brand/socialmedia/facebook.png"
              alt="Facebook"
              width={20}
              height={20}
              className="h-5 w-5"
            />
          </a>
          <span className="inline-flex items-center justify-center">
            <Image
              src="/brand/socialmedia/instagram.png"
              alt="Instagram"
              width={20}
              height={20}
              className="h-5 w-5"
            />
          </span>
          <span className="inline-flex items-center justify-center">
            <Image
              src="/brand/socialmedia/youtube.png"
              alt="YouTube"
              width={20}
              height={20}
              className="h-5 w-5"
            />
          </span>
          <span className="inline-flex items-center justify-center">
            <Image
              src="/brand/socialmedia/tiktok.png"
              alt="TikTok"
              width={20}
              height={20}
              className="h-5 w-5"
            />
          </span>
        </div>
      </footer>
    </div>
  );
}
