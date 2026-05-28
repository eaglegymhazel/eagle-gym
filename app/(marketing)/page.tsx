"use client";

import Link from "next/link";
import ReviewsSlider from "../components/ReviewsSlider";
import { useAuth } from "../components/auth/AuthProvider";
import HomeSectionsCarousel from "./HomeSectionsCarousel";

const sections = [
  {
    title: "CLASSES",
    copy: "Founded by an experienced former squad gymnast, the club offers a safe, well-equipped environment for both recreational and competitive gymnastics, with a strong sense of community at its heart.",
    cta: "View Timetable",
    href: "/timetable",
    image: "/brand/test3.png",
    imagePosition: "center top",
    tone: "bg-[#f7e9ff] text-[#2E2A33]",
  },
  {
    title: "COMPETITION",
    copy: "The Competition group, is for gymnasts who would like to compete at  floor and vault with the opportunity to progress into 4 piece competitions on the Bars, Beam, Floor and Vault. This section is invite only, once in the group there are many fun opportunities to take part in competitions, training days with other clubs and also a weekend training at Inverclyde national sports centre.",
    cta: "SIGN UP",
    href: "/login",
    image: "/brand/vid1.MP4",
    tone: "bg-[#e9f6ff] text-[#2E2A33]",
  },
  {
    title: "BIRTHDAY PARTIES",
    copy: "Our gymnasium is available every Saturday from 3:00pm to 4:30pm for birthday parties, giving children a fun and active celebration packed with movement, games, and memorable moments.",
    cta: "BOOK PARTY",
    href: "/birthday-party",
    image: "/birthdays/birthday3.png",
    tone: "bg-[#ffe8f4] text-[#2E2A33]",
  },
  {
    title: "NEWS AND EVENTS",
    copy: "Catch up with everything new happening at Eagle Gymnastics Academy, from the latest updates to upcoming events and club news.",
    cta: "READ NEWS",
    href: "/news",
    image: "/brand/img3.JPG",
    tone: "bg-[#f3e7ff] text-[#2E2A33]",
  },
];

export default function Home() {
  const { user } = useAuth();
  const bookingHref = user?.email ? "/book" : "/login?redirect=/book";

  return (
    <main className="w-full">
      <HomeSectionsCarousel sections={sections} />

      <section className="w-full border-t border-[#e2d7e9] bg-[#f6f0f8] px-6 py-18 md:py-20">
        <div className="mx-auto max-w-6xl">
          <ReviewsSlider />
        </div>
      </section>

      <section className="w-full bg-[linear-gradient(135deg,#efe6fb_0%,#e7daf8_52%,#ddd0f2_100%)] px-4 py-10 text-center text-[#143271] sm:px-6 sm:py-14">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-4xl font-black tracking-tight text-[#143271] sm:text-5xl">
            Ready to join?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-[#2E2A33]/76 sm:text-base">
            Find the right class and start your booking in a few simple steps.
          </p>
          <Link
            href={bookingHref}
            className="group relative mt-7 inline-flex min-h-[58px] items-center justify-center gap-2.5 overflow-hidden rounded-full border-2 border-[#f9f6fa] bg-[#f9f6fa]/92 bg-[linear-gradient(90deg,#6f3bc9,#6c35c3,#5f2eb6)] [background-position:left_center] [background-repeat:no-repeat] [background-size:0%_100%] px-9 py-3 text-sm font-bold uppercase tracking-[0.08em] text-[#2a0c4f] shadow-[0_10px_26px_-16px_rgba(24,14,39,0.65)] backdrop-blur-[2px] transition-[transform,border-color,box-shadow,background-size,color] duration-320 ease-out hover:-translate-y-[2px] hover:border-[#f9f6fa] hover:text-white hover:[background-size:100%_100%] hover:shadow-[0_14px_30px_-18px_rgba(24,14,39,0.75)] active:translate-y-[1px] active:shadow-[0_8px_20px_-14px_rgba(24,14,39,0.55)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f9f6fa]/70 focus-visible:ring-offset-4 sm:min-h-[64px] sm:px-12 sm:text-base"
          >
            Book classes
          </Link>
        </div>
      </section>
    </main>
  );
}
