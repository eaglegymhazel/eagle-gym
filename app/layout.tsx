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
          <div className="sticky top-0 z-50 border-b-[2px] border-[#6c35c3] bg-[#faf7fb]/95 backdrop-blur">
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
              <Link href="/" aria-label="Multi-Sport home">
                <div className="relative h-40 w-40 transition-all duration-300 hover:scale-125">
                  <span className="absolute left-[5px] top-0 h-full w-full rounded-full border-2 border-[#6e2ac0] bg-[#faf7fb] transition-all duration-300 hover:border-2 hover:border-[#6c35c3]" />
                  <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-full">
                    <Image
                      src="/brand/logo2.png"
                      alt="Multi-Sport"
                      width={400}
                      height={400}
                      className="h-32 w-auto scale-150 object-contain sm:h-36"
                    />
                  </div>
                </div>
              </Link>
              </div>
              <div className="absolute -bottom-6 right-5 z-10 translate-y-10">
                <Link href="/" aria-label="Eagle Gymnastics Academy home">
                  <div className="flex h-40 w-40 items-center justify-center rounded-full border-2 border-[#6e2ac0] bg-[#faf7fb] transition-all duration-300 hover:scale-125 hover:border-2 hover:border-[#6c35c3]">
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

          <div className="relative pb-12">
            <BannerSlideshow />
            <div className="group absolute inset-0 flex items-center justify-center">
              <img
                src="/brand/overlay.png"
              alt=""
              className="slogan-bounce h-auto w-[20%] pointer-events-auto group-hover:animate-[slogan-wobble_500ms_ease-in-out]"
            />
          </div>
          <div className="absolute inset-0 flex items-end justify-center pb-1.5">
            <a href="/book" className="block">
              <img
                src="/brand/bookbutton.png"
                alt="Book Now"
                className="h-48 w-auto transition-transform duration-200 hover:scale-105"
              />
            </a>
          </div>
          <svg
            className="pointer-events-none absolute bottom-6 left-0 z-20 h-10 w-full"
            viewBox="0 0 1440 80"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="bannerWaveTop" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#e3bbe9" />
                <stop offset="100%" stopColor="#e3bbe9" />
              </linearGradient>
            </defs>
            <path
              d="M0,12 C240,-8 480,32 720,12 C960,-8 1200,32 1440,12 L1440,48 C1200,68 960,28 720,48 C480,68 240,28 0,48 Z"
              fill="url(#bannerWaveTop)"
            />
          </svg>

        </div>

          <main className="mt-0 w-full px-0 py-4">
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
