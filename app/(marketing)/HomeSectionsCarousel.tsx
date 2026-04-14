"use client";

import Image from "next/image";
import Link from "next/link";

type HomeSection = {
  title: string;
  copy: string;
  cta: string;
  href: string;
  image: string;
  imagePosition?: string;
  tone: string;
};

export default function HomeSectionsCarousel({
  sections,
}: {
  sections: HomeSection[];
}) {
  return (
    <section className="w-full">
      <div>
        {sections.map((section, index) => {
          const isEven = index % 2 === 0;
          const isVideo = /\.(mp4|webm|ogg)$/i.test(section.image);

          return (
            <article
              key={section.title}
              className="grid w-full grid-cols-1 border-b border-[#e5dce8] md:min-h-[440px] md:grid-cols-2"
            >
              <div
                className={[
                  "relative min-h-[260px] overflow-hidden bg-[#eee7f1] md:min-h-full",
                  isEven ? "order-1" : "order-1 md:order-2",
                ].join(" ")}
              >
                {isVideo ? (
                  <video
                    className="absolute inset-0 h-full w-full object-cover"
                    src={section.image}
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="metadata"
                    aria-label={section.title}
                  />
                ) : (
                  <Image
                    src={section.image}
                    alt={section.title}
                    fill
                    className="object-cover"
                    style={{ objectPosition: section.imagePosition ?? "center" }}
                    sizes="(max-width: 768px) 100vw, 50vw"
                    priority={index === 0}
                  />
                )}
              </div>
              <div
                className={[
                  "flex items-center",
                  section.tone,
                  isEven ? "order-2" : "order-2 md:order-1",
                ].join(" ")}
              >
                <div className="w-full px-6 py-11 sm:px-10 md:px-12 lg:px-16">
                  <div className="mb-5 h-[3px] w-12 rounded-full bg-[#6c35c3]" />
                  <h2 className="text-[clamp(30px,3.2vw,46px)] font-extrabold tracking-[0.02em] leading-[1.05]">
                    {section.title}
                  </h2>
                  <p className="mt-5 max-w-[34rem] text-base leading-[1.72] text-[#2E2A33]/78 sm:text-[17px]">
                    {section.copy}
                  </p>
                  <Link
                    href={section.href}
                    className="mt-7 inline-flex min-h-11 items-center justify-center rounded-md border border-[#2E2A33] bg-white/55 px-5 py-2.5 text-sm font-bold uppercase tracking-[0.06em] text-[#2E2A33] transition hover:-translate-y-0.5 hover:bg-[#2E2A33] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6c35c3]/45"
                  >
                    {section.cta}
                  </Link>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
