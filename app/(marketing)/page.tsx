"use client";

import ReviewsSlider from "../components/ReviewsSlider";
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
    image: "/brand/bday1.png",
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
  return (
    <main className="w-full">
      <HomeSectionsCarousel sections={sections} />

      <section className="w-full border-t border-[#e2d7e9] bg-[#f6f0f8] px-6 py-18 md:py-20">
        <div className="mx-auto max-w-6xl">
          <ReviewsSlider />
        </div>
      </section>
    </main>
  );
}
