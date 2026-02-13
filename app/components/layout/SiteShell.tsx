import Image from "next/image";
import Link from "next/link";
import LoginBadge from "../LoginBadge";
import Nav from "../Nav";

export default function SiteShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
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
              <LoginBadge />
            </div>
          </div>

          <header className="pt-2">
            <div className="mx-auto max-w-5xl px-6">
              <div className="mt-2">
                <Nav />
              </div>
            </div>
          </header>

            <div className="absolute -bottom-6 left-5 z-10 translate-y-[124px]">
            <Link href="/" aria-label="Eagle Gymnastics Academy home">
              <Image
                src="/brand/logo_v8.png"
                alt="Eagle Gymnastics Academy"
                width={1000}
                height={1024}
                  className="h-[14.5rem] w-auto max-w-none object-contain drop-shadow-[0_18px_30px_rgba(0,0,0,0.35)] transition-transform duration-200 hover:scale-110 sm:h-[17rem]"
                priority
              />
            </Link>
          </div>
        </div>
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
