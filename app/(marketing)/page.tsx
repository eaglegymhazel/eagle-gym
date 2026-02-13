import Image from "next/image";
import ReviewsSlider from "../components/ReviewsSlider";

const sections = [
  {
    title: "CLASSES",
    copy: "Founded by an experienced former squad gymnast, the club offers a safe, well-equipped environment for both recreational and competitive gymnastics, with a strong sense of community at its heart.",
    cta: "View Timetable",
    href: "/timetable",
    image: "/brand/placeholderImg/test3.png",
    tone: "bg-[#f7e9ff] text-[#2E2A33]",
  },
  {
    title: "COMPETITION",
    copy: "The Competition group, is for gymnasts who would like to compete at  floor and vault with the opportunity to progress into 4 piece competitions on the Bars, Beam, Floor and Vault. This section is invite only, once in the group there are many fun opportunities to take part in competitions, training days with other clubs and also a weekend training at Inverclyde national sports centre.",
    cta: "BOOK NOW",
    href: "/contact",
    image: "/brand/placeholderImg/test2.png",
    tone: "bg-[#e9f6ff] text-[#2E2A33]",
  },
  {
    title: "PRE-SCHOOL CLASSES",
    copy: "These classes are aimed at developing social and practical skills such as balance, co-ordination, strength & flexibility. They also enable children to develop creativity while interacting with other children in a fun, safe environment.",
    cta: "OUR PATHWAY",
    href: "/team",
    image: "/brand/placeholderImg/test4.png",
    tone: "bg-[#ffe8f4] text-[#2E2A33]",
  },
  {
    title: "MEMBERS",
    copy: "Exclusive video library and technique tips to help gymnasts practise safely at home.",
    cta: "VIEW RESOURCES",
    href: "/members",
    image: "/brand/placeholderImg/test1.png",
    tone: "bg-[#f3e7ff] text-[#2E2A33]",
  },
];

export default function Home() {
  return (
    <main className="w-full">
      <section className="w-full bg-[#f7f4fb]">
        <div className="mx-auto max-w-6xl px-4 pt-[40px] pb-[40px] sm:px-6 md:pt-[40px] md:pb-[40px]">
          <div className="grid grid-cols-1 items-start gap-8 md:grid-cols-[2fr_3fr] md:gap-12">
            <div className="text-left text-[#2E2A33]">
              <div className="mb-4 h-[3px] w-12 rounded-full bg-[#6c35c3]" />
              <h2 className="text-[clamp(32px,3vw,44px)] font-extrabold tracking-[-0.02em] leading-[1.1]">
                Build confidence, strength, and a love of movement
              </h2>
              <p className="mt-3 text-sm font-semi-bold uppercase tracking-[0.06em] text-[#2E2A33]/70">
                A supportive space for every gymnast to grow and progress.
              </p>
            </div>
            <div className="text-left mt-[24px]">
              <p className="max-w-[60ch] text-[16px] leading-[1.6] text-[#2E2A33]/75 sm:text-[17px]">
                Our gymnastics classes are a positive, supportive space for young people of all ages and abilities. From beginners taking their first steps to more experienced gymnasts building skills and confidence, every class is designed to help each individual progress at their own pace.
              </p>
            </div>
          </div>
        </div>
      </section>
      {sections.map((section, index) => {
        const isEven = index % 2 === 0;
        return (
          <div key={section.title}>
            <section className="grid min-h-[48vh] w-full grid-cols-1 md:grid-cols-2">
              <div
                className={[
                  "relative min-h-[240px] md:min-h-full",
                  isEven ? "order-1" : "order-2 md:order-2",
                ].join(" ")}
              >
                <Image
                  src={section.image}
                  alt={section.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority={index === 0}
                />
              </div>
              <div
                className={[
                  "flex items-center",
                  section.tone,
                  isEven ? "order-2" : "order-1 md:order-1",
                ].join(" ")}
              >
                <div className="w-full px-8 py-10 sm:px-12 lg:px-16">
                  <h2 className="text-3xl font-extrabold tracking-wide sm:text-4xl">
                    {section.title}
                  </h2>
                  <p className="mt-4 max-w-md text-base leading-relaxed sm:text-lg">
                    {section.copy}
                  </p>
                  <a
                    href={section.href}
                    className="mt-6 inline-flex items-center justify-center rounded-full border border-[#2E2A33] px-6 py-3 text-sm font-semibold tracking-wide transition hover:-translate-y-0.5 hover:bg-[#2E2A33] hover:text-white"
                  >
                    {section.cta}
                  </a>
                </div>
              </div>
            </section>

            {index === 1 ? (
              <section className="w-full bg-[#f3ecf7] px-6 py-16 text-center">
                <div className="mx-auto max-w-3xl">
                  <div>
                    <ReviewsSlider />
                  </div>
                </div>
              </section>
            ) : null}
          </div>
        );
      })}
    </main>
  );
}
