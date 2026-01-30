import type { Metadata } from "next";
import { Baloo_2, Geist_Mono } from "next/font/google";
import "./globals.css";
import Nav from "./components/Nav";

export const metadata: Metadata = {
  title: "Eagle Gymnastics Academy",
  description: "Children’s gymnastics academy: recreational classes and competition training.",
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
      className={`${geistSans.variable} ${geistMono.variable} h-full`}
    >
      <body className="min-h-full bg-white text-gray-900 antialiased">
        <header className="pt-6">
          <div className="mx-auto max-w-5xl px-6">
            <div className="flex justify-center">
              <a href="/" aria-label="Eagle Gymnastics Academy home">
                <img
                  src="/brand/Logo.png"
                  alt="Eagle Gymnastics Academy"
                  className="h-48 w-auto"

                />
              </a>
            </div>

            <div className="mt-4">
              <Nav />
            </div>
          </div>
        </header>

        <section
          className="h-56 w-full overflow-hidden bg-center bg-cover bg-fixed"
          style={{ backgroundImage: "url('/brand/banner.png')" }}
          aria-label="Eagle Gymnastics Academy banner"
        />

        <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>

        <footer className="border-t border-black/5">
          <div className="mx-auto flex max-w-5xl items-center justify-center gap-4 px-6 py-6 sm:justify-start">
            <a
              href="https://www.facebook.com/eaglegymnasticsacademy/"
              aria-label="Facebook"
              className="inline-flex items-center justify-center hover:opacity-80"
            >
              <img
                src="/brand/socialmedia/facebook.png"
                alt="Facebook"
                className="h-5 w-5"
              />
            </a>
            <span className="inline-flex items-center justify-center">
              <img
                src="/brand/socialmedia/instagram.png"
                alt="Instagram"
                className="h-5 w-5"
              />
            </span>
            <span className="inline-flex items-center justify-center">
              <img
                src="/brand/socialmedia/youtube.png"
                alt="YouTube"
                className="h-5 w-5"
              />
            </span>
            <span className="inline-flex items-center justify-center">
              <img
                src="/brand/socialmedia/tiktok.png"
                alt="TikTok"
                className="h-5 w-5"
              />
            </span>
          </div>
        </footer>
      </body>
    </html>
  );
}
