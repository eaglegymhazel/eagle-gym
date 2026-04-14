"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

const videos = [
  {
    title: "Warm-up Routine",
    description: "A short, energetic warm-up for all levels.",
    url: "https://www.youtube.com/embed/VcgCuA3bGzk?si=xwqHWkP9Qp22o875",
  },
  {
    title: "Stretching and Flexibility",
    description: "Gentle stretching to improve flexibility safely.",
    url: "https://www.youtube.com/embed/bLNUH7-T_o4?si=DuMRnZMCsVcy32pV",
  },
  {
    title: "Beginner Skills",
    description: "Foundations for new gymnasts at home.",
    url: "https://www.youtube.com/embed/jeNwE4VXqgs?si=WthMIvoGq2xLakxu",
  },
  {
    title: "Strength Circuit",
    description: "Bodyweight exercises to build strength.",
    url: "https://www.youtube.com/embed/Nk-j0k7b2Q8?si=1kY7TFMHTDk-78ek",
  },
];

type TabKey = "stretching" | "videos" | "progression" | "body-shape";

const tabs: Array<{ key: TabKey; label: string }> = [
  { key: "stretching", label: "Stretching" },
  { key: "videos", label: "Videos" },
  { key: "progression", label: "Progression" },
  { key: "body-shape", label: "Body Shape" },
];

const tabContent: Record<
  TabKey,
  {
    title: string;
    intro: string;
    image: string;
    focus: string[];
    steps: string[];
  }
> = {
  stretching: {
    title: "Build mobility with control",
    intro:
      "Start warm, move with control, and hold each shape with steady breathing.",
    image: "/brand/img10.JPG",
    focus: [
      "Hamstrings and calves",
      "Hip flexors and glutes",
      "Shoulders and upper back",
      "Ankles and wrists",
    ],
    steps: [
      "Raise body temperature for 3-5 minutes before static stretching.",
      "Use dynamic mobility first, then static holds for 20-30 seconds.",
      "Keep all stretches smooth and controlled with no bouncing.",
      "Finish with deep breathing and gentle walking to cool down.",
    ],
  },
  videos: {
    title: "Coach-led video library",
    intro:
      "Use short sessions often, and revisit key clips before practice days.",
    image: "/brand/img13.webp",
    focus: [
      "Warm-up and preparation",
      "Technique refreshers",
      "Strength and control",
      "Safe home practice",
    ],
    steps: [
      "Choose one technical focus per session.",
      "Watch first, then rehearse in short sets.",
      "Prioritize form before speed.",
      "Stop and reset when quality drops.",
    ],
  },
  progression: {
    title: "Progress one step at a time",
    intro:
      "Strong basics create faster long-term progress and better confidence.",
    image: "/brand/img15.webp",
    focus: [
      "Shape quality",
      "Take-off and landing",
      "Rhythm and timing",
      "Consistency under fatigue",
    ],
    steps: [
      "Start with the easiest variation and own it.",
      "Increase only one variable at a time.",
      "Keep reps short and high quality.",
      "Review with a coach before moving to harder progressions.",
    ],
  },
  "body-shape": {
    title: "Train clean body positions",
    intro:
      "Strong shapes improve every skill from basics through advanced work.",
    image: "/brand/img22.JPG",
    focus: ["Hollow", "Arch", "Tuck", "Straight line"],
    steps: [
      "Keep core tension through every position.",
      "Use straight arms and pointed toes as a baseline standard.",
      "Control transitions between shapes.",
      "Repeat simple drills daily to lock in quality.",
    ],
  },
};

function VideoGrid({ items }: { items: typeof videos }) {
  return (
    <div className="mt-6 grid gap-4 md:grid-cols-2">
      {items.map((video) => (
        <article
          key={video.title}
          className="border border-[#d9cde7] bg-white p-3"
        >
          <div className="relative aspect-video w-full overflow-hidden bg-black/10">
            <iframe
              src={video.url}
              title={video.title}
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
          <h3 className="mt-3 text-base font-bold text-[#143271]">{video.title}</h3>
          <p className="mt-1 text-sm text-[#2E2A33]/78">{video.description}</p>
        </article>
      ))}
    </div>
  );
}

export default function MembersPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("stretching");
  const active = tabContent[activeTab];

  const selectedVideos = useMemo(() => {
    if (activeTab === "stretching") {
      return videos.filter((video) => video.title.toLowerCase().includes("stretching"));
    }
    return videos;
  }, [activeTab]);

  return (
    <main className="w-full bg-[#faf7fb]">
      <section className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div>
          <h1 className="text-4xl font-extrabold leading-tight text-[#143271] sm:text-5xl">
            Train with structure between sessions
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-8 text-[#2E2A33]/78 sm:text-[17px]">
            Home resources to build confidence, coordination, and quality movement
            habits with guidance that mirrors club coaching standards.
          </p>
          <div className="mt-7 grid gap-3 sm:grid-cols-3">
            {["Safe warm-ups", "Skill progressions", "Body shape drills"].map((item) => (
              <div key={item} className="border border-[#d9cde7] bg-white px-4 py-3">
                <p className="text-sm font-semibold text-[#2E2A33]">{item}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid min-h-[360px] grid-cols-2 gap-3">
          <div className="relative overflow-hidden border border-[#d9cde7]">
            <Image
              src="/brand/img21.JPG"
              alt="Gymnast training at Eagle Gymnastics Academy"
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 50vw, 24vw"
              priority
            />
          </div>
          <div className="grid gap-3">
            <div className="relative overflow-hidden border border-[#d9cde7]">
              <Image
                src="/brand/img12.JPG"
                alt="Coach supporting gymnast progression"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 50vw, 24vw"
                priority
              />
            </div>
            <div className="relative overflow-hidden border border-[#d9cde7]">
              <Image
                src="/brand/img1.JPG"
                alt="Gymnastics facility space"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 50vw, 24vw"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-[#e3d8ec] bg-white">
        <div className="mx-auto w-full max-w-6xl px-4 py-4 sm:px-6">
          <div
            role="tablist"
            aria-label="Members resources"
            className="flex flex-wrap gap-2"
          >
            {tabs.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  aria-controls={`panel-${tab.key}`}
                  id={`tab-${tab.key}`}
                  onClick={() => setActiveTab(tab.key)}
                  className={[
                    "min-h-10 border px-4 text-sm font-semibold transition",
                    isActive
                      ? "border-[#6c35c3] bg-[#6c35c3] text-[#f9f6fa]"
                      : "border-[#d9cde7] bg-white text-[#143271] hover:bg-[#f6f1fb]",
                  ].join(" ")}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div id={`panel-${activeTab}`} role="tabpanel" aria-labelledby={`tab-${activeTab}`}>
          <h2 className="text-3xl font-extrabold leading-tight text-[#143271]">
            {active.title}
          </h2>
          <p className="mt-4 text-base leading-8 text-[#2E2A33]/78 sm:text-[17px]">
            {active.intro}
          </p>

          <div className="mt-7 border border-[#d9cde7] bg-white">
            <p className="border-b border-[#ece3f4] px-4 py-3 text-xs font-bold uppercase tracking-[0.14em] text-[#6c35c3]">
              Session Focus
            </p>
            <div className="grid gap-0 sm:grid-cols-2">
              {active.focus.map((item, index) => (
                <div
                  key={item}
                  className={[
                    "border-[#ece3f4] px-4 py-3",
                    index % 2 === 0 ? "sm:border-r" : "",
                    index < active.focus.length - (active.focus.length % 2 === 0 ? 2 : 1)
                      ? "border-b"
                      : "",
                  ].join(" ")}
                >
                  <p className="text-sm font-semibold text-[#2E2A33]">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 border border-[#d9cde7] bg-white">
            <p className="border-b border-[#ece3f4] px-4 py-3 text-xs font-bold uppercase tracking-[0.14em] text-[#6c35c3]">
              Practice Structure
            </p>
            <ol className="space-y-0">
              {active.steps.map((step, index) => (
                <li
                  key={step}
                  className={[
                    "flex gap-3 px-4 py-3",
                    index < active.steps.length - 1 ? "border-b border-[#ece3f4]" : "",
                  ].join(" ")}
                >
                  <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center bg-[#6c35c3] text-xs font-bold text-[#f9f6fa]">
                    {index + 1}
                  </span>
                  <p className="text-sm leading-7 text-[#2E2A33]/82">{step}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>

        <div>
          <div className="relative min-h-[320px] overflow-hidden border border-[#d9cde7]">
            <Image
              src={active.image}
              alt={`${active.title} guidance image`}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 42vw"
            />
          </div>
          <VideoGrid items={selectedVideos} />
        </div>
      </section>
    </main>
  );
}
