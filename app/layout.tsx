import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Baloo_2, Geist_Mono } from "next/font/google";
import "./globals.css";
import Nav from "./components/Nav";
import BannerSlideshow from "./components/BannerSlideshow";

export const metadata: Metadata = {
  title: "Eagle Gymnastics Academy",
  description:
    "Children's gymnastics academy: recreational classes and competition training.",
};

const geistSans = Baloo_2({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable}`}
      style={{ backgroundColor: "#faf7fb" }}
    >
      <body
        className="min-h-screen overflow-x-hidden bg-[#faf7fb] text-[#2E2A33] antialiased"
        style={{ backgroundColor: "#faf7fb" }}
      >
        <div
          className="min-h-screen bg-[#faf7fb]"
          style={{ backgroundColor: "#faf7fb" }}
        >
          <div className="sticky top-0 z-50 bg-[#faf7fb]/95 backdrop-blur">
          <div className="relative">
            <div className="bg-[#6c35c3] text-white">
              <div className="flex w-full items-center gap-4 px-3 py-2 text-base font-semibold tracking-wide">
                <div className="relative flex-1 overflow-hidden">
                  <div className="marquee-track" aria-hidden="true">
                    <div className="marquee-group pr-8">
                      <span>
                        &bull; Welcome to the New Eagle Gymnastics Academy
                        Website! &bull;
                      </span>
                      <span>
                        &bull; Welcome to the New Eagle Gymnastics Academy
                        Website! &bull;
                      </span>
                      <span>
                        &bull; Welcome to the New Eagle Gymnastics Academy
                        Website! &bull;
                      </span>
                      <span>
                        &bull; Welcome to the New Eagle Gymnastics Academy
                        Website! &bull;
                      </span>
                    </div>
                    <div className="marquee-group pr-8">
                      <span>
                        &bull; Welcome to the New Eagle Gymnastics Academy
                        Website! &bull;
                      </span>
                      <span>
                        &bull; Welcome to the New Eagle Gymnastics Academy
                        Website! &bull;
                      </span>
                      <span>
                        &bull; Welcome to the New Eagle Gymnastics Academy
                        Website! &bull;
                      </span>
                      <span>
                        &bull; Welcome to the New Eagle Gymnastics Academy
                        Website! &bull;
                      </span>
                    </div>
                  </div>
                </div>
                <span className="inline-flex items-center gap-2 cursor-default whitespace-nowrap">
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="11" width="18" height="11" rx="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  Login
                </span>
              </div>
            </div>

            <header className="pt-2">
              <div className="mx-auto max-w-5xl px-6">
                <div className="mt-2">
                  <Nav />
                </div>
              </div>
            </header>

            <div className="absolute -bottom-6 left-5 z-10 translate-y-10">
              <Link href="/" aria-label="Eagle Gymnastics Academy home">
                <div className="flex h-40 w-40 items-center justify-center rounded-full border-2 border-white bg-[#faf7fb] shadow-xl shadow-black/30 transition-all duration-300 hover:scale-125 hover:border-4 hover:border-[#6c35c3]">
                  <Image
                    src="/brand/Logo.png"
                    alt="Eagle Gymnastics Academy"
                    width={1000}
                    height={1024}
                    className="h-32 w-auto max-w-none object-contain sm:h-36"
                    priority
                  />
                </div>
              </Link>
            </div>
          </div>
        </div>

          <div className="relative pb-0">
            <BannerSlideshow />
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.08) 55%, rgba(0,0,0,0.14) 100%)",
              }}
            />
            <div className="group absolute inset-0 z-10 flex flex-col items-center justify-center -translate-y-[75px] text-center">
              <div className="flex max-w-[480px] flex-col items-center gap-5">
                <img
                  src="/brand/overlay.png"
                  alt=""
                  className="slogan-bounce pointer-events-auto block h-auto w-[320px] max-w-[85vw] translate-y-[85px] group-hover:animate-[slogan-wobble_500ms_ease-in-out]"
                />
                <a
                  href="/book"
                  className="group relative inline-flex min-h-[56px] items-center justify-center rounded-full border-[4px] border-[#6c35c3] bg-white px-12 py-2 text-base font-semibold uppercase tracking-[0.1em] text-[#16326f] shadow-[0_5px_0_rgba(107,91,255,0.35)] transition-all duration-200 ease-out hover:-translate-y-[2px] hover:bg-[#f2ecff] hover:border-[#5a30c7] hover:shadow-[0_3px_0_rgba(107,91,255,0.22)] active:translate-y-[1px] active:shadow-[0_2px_0_rgba(107,91,255,0.3)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6c35c3] focus-visible:ring-offset-4"
                >
                  <span className="cta-text">Book now</span>
                  <span className="pointer-events-none absolute -top-3 -right-3 h-7 w-7 text-[#ffdc6a]" aria-hidden="true">
                    <svg viewBox="0 0 24 24" className="h-full w-full" fill="currentColor" aria-hidden="true">
                      <path d="M12 2.5l2.72 5.51 6.08.88-4.4 4.29 1.04 6.06L12 16.9l-5.44 2.34 1.04-6.06-4.4-4.29 6.08-.88L12 2.5z" />
                    </svg>
                  </span>
                </a>
              </div>
            </div>
            <div
              className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-[10px]"
              style={{
                background:
                  "linear-gradient(to bottom, rgba(247,244,251,0) 40%, #f7f4fb 100%)",
              }}
            />
          </div>
          <main className="mt-0 w-full px-0 pt-0 pb-4">
            {children}
          </main>

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
      </body>
    </html>
  );
}
