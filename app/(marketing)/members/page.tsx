"use client";

import { useMemo, useState } from "react";

const videos = [
  {
    title: "Warm-up Routine",
    description: "A short, energetic warm-up for all levels.",
    url: "https://www.youtube.com/embed/VcgCuA3bGzk?si=xwqHWkP9Qp22o875",
  },
  {
    title: "Stretching & Flexibility",
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

const tabs = [
  { key: "stretching" as const, label: "Stretching" },
  { key: "videos" as const, label: "Videos" },
  { key: "progression" as const, label: "Progression" },
  { key: "body-shape" as const, label: "Body shape" },
];

const progressionCards = [
  {
    title: "Step-by-step progressions",
    copy: "Master each step before moving on to the next skill.",
  },
  {
    title: "Quality over speed",
    copy: "Slow it down to build strong, confident technique.",
  },
  {
    title: "Coach check-ins",
    copy: "Ask a coach if you're unsure about a new step.",
  },
];

const bodyShapeCards = [
  {
    title: "Tight core",
    copy: "Keep your tummy engaged and your spine tall.",
  },
  {
    title: "Long lines",
    copy: "Straight arms and pointed toes for clean shapes.",
  },
  {
    title: "Soft landings",
    copy: "Bend knees slightly to absorb impact safely.",
  },
];

const stretchingGuide = [
  {
    title: "Start warm",
    copy: "Light jogging or skipping for 3–5 minutes to increase blood flow.",
  },
  {
    title: "Dynamic mobility",
    copy: "Leg swings, arm circles, and gentle twists to loosen joints.",
  },
  {
    title: "Hold & breathe",
    copy: "Static holds of 20–30 seconds, slow breaths, and no bouncing.",
  },
  {
    title: "Cool-down",
    copy: "Slow walking and deep breathing to bring the heart rate down.",
  },
];

const progressionGuide = [
  {
    title: "Prepare",
    copy: "Warm up, review shapes, and practice the easiest version first.",
  },
  {
    title: "Build",
    copy: "Add one challenge at a time (height, speed, or distance).",
  },
  {
    title: "Refine",
    copy: "Focus on posture, pointed toes, and steady landings.",
  },
  {
    title: "Repeat",
    copy: "Short, high‑quality sets beat long, tiring sessions.",
  },
];

const bodyShapeGuide = [
  {
    title: "Hollow body",
    copy: "Tummy tight, ribs in, arms by ears, and legs straight together.",
  },
  {
    title: "Arch body",
    copy: "Chest open, glutes tight, eyes forward, and legs long.",
  },
  {
    title: "Tuck",
    copy: "Knees hugged in, back rounded, chin tucked gently.",
  },
  {
    title: "Straight",
    copy: "Tall posture, shoulders down, toes pointed, eyes ahead.",
  },
];

const renderVideoCard = (video: (typeof videos)[number]) => (
  <article
    key={video.title}
    className="rounded-2xl border border-[#6c35c3]/10 bg-white/90 p-4 shadow-sm"
  >
    <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black/10">
      <iframe
        src={video.url}
        title={video.title}
        className="h-full w-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
    <div className="mt-4">
      <h2 className="text-lg font-semibold text-[#2a0c4f]">{video.title}</h2>
      <p className="mt-2 text-sm text-[#2a0c4f]/70">{video.description}</p>
    </div>
  </article>
);

export default function MembersPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("stretching");

  const stretchingVideos = useMemo(
    () =>
      videos.filter((video) =>
        video.title.toLowerCase().includes("stretching")
      ),
    []
  );

  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    index: number
  ) => {
    if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
    event.preventDefault();
    const nextIndex =
      event.key === "ArrowUp"
        ? (index - 1 + tabs.length) % tabs.length
        : (index + 1) % tabs.length;
    setActiveTab(tabs[nextIndex].key);
  };

  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-12">
      <div className="rounded-3xl border border-[#6c35c3]/10 bg-white/70 p-8 shadow-sm sm:p-10">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <p className="inline-flex items-center rounded-full border border-[#6c35c3]/15 bg-[#f3e7ff] px-4 py-1 text-sm font-semibold text-[#5a1c9c]">
              Members Area
            </p>
            <h1 className="mt-4 text-4xl font-bold text-[#2a0c4f]">
              Learn, practise, and progress
            </h1>
            <p className="mt-3 text-lg text-[#2a0c4f]/80">
              Technique guides, warm-ups, and skill development videos curated
              by our coaching team.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-[#2a0c4f] shadow-sm">
                Safe warm-ups
              </div>
              <div className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-[#2a0c4f] shadow-sm">
                Skill progressions
              </div>
              <div className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-[#2a0c4f] shadow-sm">
                Home practice
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-[#6c35c3]/10 bg-white/90 p-6">
            <h2 className="text-lg font-semibold text-[#2a0c4f]">
              Practice reminders
            </h2>
            <ul className="mt-4 space-y-3 text-sm text-[#2a0c4f]/75">
              <li>Warm up before every session.</li>
              <li>Focus on quality over speed.</li>
              <li>Stop if anything feels uncomfortable.</li>
              <li>Ask a coach if you're unsure.</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[240px_1fr]">
        <aside
          role="tablist"
          aria-label="Members resources"
          className="flex gap-3 overflow-x-auto rounded-2xl border border-[#6c35c3]/10 bg-white/80 p-4 shadow-sm lg:flex-col lg:gap-2 lg:overflow-visible"
        >
          {tabs.map((tab, index) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                role="tab"
                aria-selected={isActive}
                aria-controls={`panel-${tab.key}`}
                id={`tab-${tab.key}`}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                onKeyDown={(event) => handleKeyDown(event, index)}
                className={[
                  "whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#de59b6] focus-visible:ring-offset-2",
                  isActive
                    ? "bg-[#6c35c3] text-white shadow-sm"
                    : "bg-[#f7f2ff] text-[#2a0c4f]/80 hover:bg-[#f3e7ff]",
                ].join(" ")}
              >
                {tab.label}
              </button>
            );
          })}
        </aside>

        <div className="space-y-6">
          <div
            id={`panel-${activeTab}`}
            role="tabpanel"
            aria-labelledby={`tab-${activeTab}`}
            className="rounded-2xl border border-[#6c35c3]/10 bg-white/80 p-6 shadow-sm transition-all duration-200"
          >
            {activeTab === "stretching" ? (
              <div className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-[#6c35c3]/15 bg-[#f7f2ff] p-4">
                    <h3 className="text-lg font-semibold text-[#2a0c4f]">
                      Stretching basics
                    </h3>
                    <p className="mt-2 text-sm text-[#2a0c4f]/75">
                      Stretching helps improve flexibility and reduces the risk
                      of injury. Always warm up first and move slowly into each
                      stretch.
                    </p>
                    <div className="mt-4 space-y-3 text-sm text-[#2a0c4f]/75">
                      {stretchingGuide.map((step) => (
                        <div key={step.title} className="rounded-xl bg-white p-3">
                          <p className="font-semibold text-[#5a1c9c]">
                            {step.title}
                          </p>
                          <p className="mt-1">{step.copy}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-[#6c35c3]/15 bg-white p-4">
                    <h3 className="text-lg font-semibold text-[#2a0c4f]">
                      Key areas to focus
                    </h3>
                    <ul className="mt-3 space-y-2 text-sm text-[#2a0c4f]/75">
                      <li>Hamstrings and calves</li>
                      <li>Hip flexors and glutes</li>
                      <li>Shoulders and chest</li>
                      <li>Back and core mobility</li>
                    </ul>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div className="h-24 rounded-xl bg-[#ffe3f4]" />
                      <div className="h-24 rounded-xl bg-[#e3f0ff]" />
                      <div className="h-24 rounded-xl bg-[#e9ddff]" />
                      <div className="h-24 rounded-xl bg-[#f3e7ff]" />
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[#2a0c4f]">
                    Stretching videos
                  </h3>
                  <div className="mt-4 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                    {stretchingVideos.length > 0
                      ? stretchingVideos.map(renderVideoCard)
                      : videos.map(renderVideoCard)}
                  </div>
                </div>
              </div>
            ) : null}

            {activeTab === "videos" ? (
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {videos.map(renderVideoCard)}
              </div>
            ) : null}

            {activeTab === "progression" ? (
              <div className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-[#6c35c3]/15 bg-[#f7f2ff] p-4">
                    <h3 className="text-lg font-semibold text-[#2a0c4f]">
                      Progression pathway
                    </h3>
                    <p className="mt-2 text-sm text-[#2a0c4f]/75">
                      Skills grow best when each step is secure. Use short,
                      focused sessions and repeat quality drills.
                    </p>
                    <div className="mt-4 space-y-3 text-sm text-[#2a0c4f]/75">
                      {progressionGuide.map((step) => (
                        <div key={step.title} className="rounded-xl bg-white p-3">
                          <p className="font-semibold text-[#5a1c9c]">
                            {step.title}
                          </p>
                          <p className="mt-1">{step.copy}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-[#6c35c3]/15 bg-white p-4">
                    <h3 className="text-lg font-semibold text-[#2a0c4f]">
                      Common focus points
                    </h3>
                    <div className="mt-3 space-y-2 text-sm text-[#2a0c4f]/75">
                      <div className="rounded-xl bg-[#f7f2ff] p-3">
                        Strong takeoff and tight body shape.
                      </div>
                      <div className="rounded-xl bg-[#f7f2ff] p-3">
                        Balanced landing with soft knees.
                      </div>
                      <div className="rounded-xl bg-[#f7f2ff] p-3">
                        Consistent rhythm and control.
                      </div>
                    </div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div className="h-24 rounded-xl bg-[#e3f0ff]" />
                      <div className="h-24 rounded-xl bg-[#ffe3f4]" />
                      <div className="h-24 rounded-xl bg-[#e9ddff]" />
                      <div className="h-24 rounded-xl bg-[#f3e7ff]" />
                    </div>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {progressionCards.map((card) => (
                    <div
                      key={card.title}
                      className="rounded-2xl border border-[#6c35c3]/15 bg-white p-4"
                    >
                      <h3 className="text-base font-semibold text-[#2a0c4f]">
                        {card.title}
                      </h3>
                      <p className="mt-2 text-sm text-[#2a0c4f]/75">
                        {card.copy}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {activeTab === "body-shape" ? (
              <div className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-[#6c35c3]/15 bg-[#f7f2ff] p-4">
                    <h3 className="text-lg font-semibold text-[#2a0c4f]">
                      Body shapes foundation
                    </h3>
                    <p className="mt-2 text-sm text-[#2a0c4f]/75">
                      Great gymnastics starts with strong body shapes. Practise
                      these daily for better control on every skill.
                    </p>
                    <div className="mt-4 space-y-3 text-sm text-[#2a0c4f]/75">
                      {bodyShapeGuide.map((shape) => (
                        <div key={shape.title} className="rounded-xl bg-white p-3">
                          <p className="font-semibold text-[#5a1c9c]">
                            {shape.title}
                          </p>
                          <p className="mt-1">{shape.copy}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-[#6c35c3]/15 bg-white p-4">
                    <h3 className="text-lg font-semibold text-[#2a0c4f]">
                      Coaching cues
                    </h3>
                    <div className="mt-3 space-y-2 text-sm text-[#2a0c4f]/75">
                      <div className="rounded-xl bg-[#f7f2ff] p-3">
                        “Ribs in, tummy tight.”
                      </div>
                      <div className="rounded-xl bg-[#f7f2ff] p-3">
                        “Long arms and pointed toes.”
                      </div>
                      <div className="rounded-xl bg-[#f7f2ff] p-3">
                        “Eyes forward, steady balance.”
                      </div>
                    </div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div className="h-24 rounded-xl bg-[#e9ddff]" />
                      <div className="h-24 rounded-xl bg-[#e3f0ff]" />
                      <div className="h-24 rounded-xl bg-[#ffe3f4]" />
                      <div className="h-24 rounded-xl bg-[#f3e7ff]" />
                    </div>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {bodyShapeCards.map((card) => (
                    <div
                      key={card.title}
                      className="rounded-2xl border border-[#6c35c3]/15 bg-white p-4"
                    >
                      <h3 className="text-base font-semibold text-[#2a0c4f]">
                        {card.title}
                      </h3>
                      <p className="mt-2 text-sm text-[#2a0c4f]/75">
                        {card.copy}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
