import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Baloo_2, Geist_Mono } from "next/font/google";
import "./globals.css";
import Nav from "./components/Nav";

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
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="min-h-screen bg-[#f7f2ff] text-gray-900 antialiased">
        <div className="sticky top-0 z-50 border-b-[5px] border-[#6c35c3] bg-[#f7f2ff]/95 backdrop-blur">
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
                <div className="flex h-40 w-40 items-center justify-center rounded-full bg-[#f7f2ff] transition-all duration-300 hover:scale-125 hover:border-4 hover:border-[#6c35c3]">
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

        <div className="relative">
          <section
            className="h-[28rem] w-full overflow-hidden bg-center bg-cover bg-fixed"
            style={{ backgroundImage: "url('/brand/banner.png')" }}
            aria-label="Eagle Gymnastics Academy banner"
          />
          <svg
            className="pointer-events-none absolute -bottom-[94px] left-0 h-16 w-full"
            viewBox="0 0 1440 80"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="bannerWaveTop" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#e55dbe" />
                <stop offset="100%" stopColor="#c04aa1" />
              </linearGradient>
            </defs>
            <path
              d="M0,12 C240,-8 480,32 720,12 C960,-8 1200,32 1440,12 L1440,48 C1200,68 960,28 720,48 C480,68 240,28 0,48 Z"
              fill="url(#bannerWaveTop)"
            />
          </svg>

          <svg
            className="pointer-events-none absolute -bottom-[70px] left-0 h-24 w-full"
            viewBox="0 0 1440 120"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="bannerWave" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#6c35c3" />
                <stop offset="100%" stopColor="#4f2598" />
              </linearGradient>
            </defs>
            <path
              d="M0,15 C240,-10 480,50 720,15 C960,-10 1200,50 1440,15 L1440,105 C1200,130 960,70 720,105 C480,130 240,70 0,105 Z"
              fill="url(#bannerWave)"
            />
          </svg>
        </div>

        <main className="mx-auto mt-20 max-w-5xl px-6 py-8">
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
      </body>
    </html>
  );
}
