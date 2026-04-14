"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";

type ArticleSection = {
  heading: string;
  paragraphs: string[];
};

type ArticleContent = {
  title: string;
  date: string;
  tag: "Announcements";
  deck: string;
  heroImage: string;
  sections: ArticleSection[];
  images: { src: string; caption: string }[];
  callout: { title: string; items: string[] };
};

const ARTICLES: Record<string, ArticleContent> = {
  "new-chapter-online-for-eagle-gymnastics-academy": {
    title: "A New Chapter Online for Eagle Gymnastics Academy",
    date: "14 Apr 2026",
    tag: "Announcements",
    deck:
      "A complete redesign that introduces clearer information, integrated booking, progress tracking, and a dedicated members area.",
    heroImage: "/brand/img23.JPG",
    sections: [
      {
        heading: "A New Website for the Club",
        paragraphs: [
          "We're pleased to introduce the new Eagle Gymnastics Academy website - a complete redesign that marks a significant step forward for the club and its members.",
          "The new site has been built from the ground up to better reflect how the club operates today. It is faster, clearer, and designed to make it easier for parents and gymnasts to find the information they need without friction.",
          "From class information to club updates, everything has been simplified and structured to be more accessible across both desktop and mobile.",
        ],
      },
      {
        heading: "Integrated Booking",
        paragraphs: [
          "One of the most important additions is a fully integrated booking system. This replaces the previous process with a more reliable and streamlined way to manage class registrations.",
          "Parents can now view available classes, select sessions, and complete bookings in a single flow. This reduces manual handling and provides a clearer overview of each gymnast's schedule.",
        ],
      },
      {
        heading: "Progress Tracking",
        paragraphs: [
          "Alongside booking, the new system introduces progress tracking for gymnasts. As children work through their skills and badge levels, their progress can now be recorded and viewed in one place.",
          "This gives both parents and gymnasts a clearer sense of development over time, rather than relying on informal updates.",
        ],
      },
      {
        heading: "Members Area and Future Improvements",
        paragraphs: [
          "The website also introduces a dedicated members area. This will act as a central hub for club-related content that goes beyond weekly classes.",
          "Over time, this will include training videos, guidance material, and additional resources to support gymnasts outside of the gym. The aim is to extend learning beyond sessions, while keeping everything organised and accessible.",
          "This update also lays the groundwork for future improvements. The new system allows the club to expand its digital offering over time, whether through additional features, improved communication, or more detailed tracking of gymnast development.",
        ],
      },
      {
        heading: "Designed Around Eagle Gymnastics Academy",
        paragraphs: [
          "From a design perspective, the site has been updated to better represent the club's identity. The layout places more focus on real imagery from within the club, highlighting the environment, coaching, and gymnasts themselves.",
          "Navigation has been simplified, and key actions - such as booking classes - are now more prominent.",
          "Overall, the new website is designed to support both the day-to-day running of the club and the long-term development of its members. It provides a more structured, transparent, and scalable foundation as Eagle Gymnastics Academy continues to grow.",
        ],
      },
    ],
    images: [
      { src: "/brand/img1.JPG", caption: "A clearer view of the club environment." },
      { src: "/brand/img13.webp", caption: "Real imagery from within the academy." },
      { src: "/brand/img15.webp", caption: "Supporting progression inside and outside the gym." },
      { src: "/brand/img20.JPG", caption: "A stronger digital foundation for members." },
    ],
    callout: {
      title: "What's New",
      items: [
        "Integrated online booking",
        "Gymnast progress tracking",
        "Dedicated members area",
        "Clearer navigation and mobile-friendly pages",
      ],
    },
  },
};

export default function NewsArticlePage() {
  const params = useParams();
  const slug = typeof params?.slug === "string" ? params.slug : "";
  const article = ARTICLES[slug.toLowerCase().trim()];

  if (!article) {
    return (
      <main className="mx-auto w-full max-w-3xl px-6 py-10">
        <Link href="/news" className="text-sm font-semibold text-[#6c35c3]">
          Back to News
        </Link>
        <p className="mt-8">Article not found</p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-10">
      <div className="mb-8">
        <Link href="/news" className="text-sm font-semibold text-[#6c35c3]">
          Back to News
        </Link>
      </div>

      <header className="space-y-4">
        <div className="space-y-2">
          <h1>{article.title}</h1>
          <div className="flex flex-wrap items-center gap-3 text-sm text-[#2E2A33]/70">
            <span>{article.date}</span>
            <span className="rounded-full bg-[#f3ecfb] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#6c35c3]">
              {article.tag}
            </span>
          </div>
          <p className="text-base text-[#2E2A33]/70">{article.deck}</p>
        </div>
        <div className="relative aspect-[16/9] max-h-[360px] overflow-hidden rounded-lg bg-[#eee7f1]">
          <Image
            src={article.heroImage}
            alt={article.title}
            fill
            className="object-cover object-top"
            sizes="(max-width: 896px) 100vw, 896px"
            priority
          />
        </div>
      </header>

      <article className="mt-8 space-y-10 text-[#2E2A33]">
        {article.sections.map((section, index) => (
          <section key={section.heading} className="space-y-4">
            <h2>{section.heading}</h2>
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph} className="text-base leading-8 text-[#2E2A33]/78">
                {paragraph}
              </p>
            ))}

            {article.images[index] ? (
              <figure className="pt-2">
                <div className="relative aspect-[16/9] overflow-hidden rounded-lg bg-[#eee7f1]">
                  <Image
                    src={article.images[index].src}
                    alt={article.images[index].caption}
                    fill
                    className="object-cover"
                    sizes="(max-width: 896px) 100vw, 896px"
                  />
                </div>
                <figcaption className="mt-2 text-sm text-[#2E2A33]/60">
                  {article.images[index].caption}
                </figcaption>
              </figure>
            ) : null}
          </section>
        ))}

        <div className="rounded-lg border border-[#6c35c3]/20 bg-[#f7f2fb] p-5">
          <p className="text-sm font-semibold text-[#6c35c3]">
            {article.callout.title}
          </p>
          <ul className="mt-3 space-y-1 text-sm text-[#2E2A33]/80">
            {article.callout.items.map((item) => (
              <li key={item}>- {item}</li>
            ))}
          </ul>
        </div>
      </article>
    </main>
  );
}
