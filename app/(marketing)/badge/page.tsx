"use client";

import { useEffect, useMemo, useState } from "react";
import MarketingPageIntro from "@/app/components/marketing/MarketingPageIntro";

type Badge = {
  id: string;
  title: string;
  skills: string[];
};

const badges: Badge[] = [
  {
    id: "badge-1",
    title: "Level 1",
    skills: [
      "Show three different shapes: straight, star, and tuck",
      "Eight rebound jumps from side to side on the floor",
      "Balance on two hands and one foot",
      "Standing straight jumps from springboard",
      "Sit in tuck position and roll backwards",
      "Hang on bar in tuck shape",
      "Four consecutive bunny jumps",
      "Walk along a floor beam or bench",
      "Show back support and front support position",
      "Upper body dish",
    ],
  },
  {
    id: "badge-2",
    title: "Gymnastics Badge 2",
    skills: Array.from({ length: 10 }, (_, i) => `Skill ${i + 1}`),
  },
];

const STORAGE_KEY = "eagle-badge-progress";

const createEmptyState = () => {
  const state: Record<string, boolean[]> = {};
  badges.forEach((badge) => {
    state[badge.id] = Array.from({ length: badge.skills.length }, () => false);
  });
  return state;
};

export default function BadgePage() {
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(badges.map((badge) => [badge.id, false]))
  );
  const [progress, setProgress] = useState<Record<string, boolean[]>>(() => {
    if (typeof window === "undefined") return createEmptyState();
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return createEmptyState();
    try {
      const parsed = JSON.parse(stored) as Record<string, boolean[]>;
      return { ...createEmptyState(), ...parsed };
    } catch {
      return createEmptyState();
    }
  });

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  }, [progress]);

  const totals = useMemo(() => {
    const result: Record<string, { done: number; total: number }> = {};
    badges.forEach((badge) => {
      const current = progress[badge.id] || [];
      const done = current.filter(Boolean).length;
      result[badge.id] = { done, total: badge.skills.length };
    });
    return result;
  }, [progress]);

  const toggleSkill = (badgeId: string, index: number) => {
    setProgress((prev) => {
      const updated = [...(prev[badgeId] || [])];
      updated[index] = !updated[index];
      return { ...prev, [badgeId]: updated };
    });
  };

  const markAll = (badgeId: string, value: boolean) => {
    const badge = badges.find((b) => b.id === badgeId);
    if (!badge) return;
    setProgress((prev) => ({
      ...prev,
      [badgeId]: Array.from({ length: badge.skills.length }, () => value),
    }));
  };

  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-10">
      <MarketingPageIntro
        eyebrow="Members Progress"
        title="Badge Progress Tracker"
        description="Track progress toward each badge by checking off completed skills."
      />

      <div className="space-y-6">
        {badges.map((badge) => {
          const { done, total } = totals[badge.id] || {
            done: 0,
            total: badge.skills.length,
          };
          const percentage = Math.round((done / total) * 100);
          const isOpen = expanded[badge.id];

          return (
            <article
              key={badge.id}
              className="rounded-3xl border border-[#6c35c3]/10 bg-white/80 p-6 shadow-sm"
            >
              <header className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-[#2a0c4f]">
                    {badge.title}
                  </h2>
                  <p className="text-sm text-[#2a0c4f]/70">
                    {done}/{total} completed • {percentage}%
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => markAll(badge.id, true)}
                    className="rounded-full bg-[#6c35c3] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
                  >
                    Mark all complete
                  </button>
                  <button
                    type="button"
                    onClick={() => markAll(badge.id, false)}
                    className="rounded-full border border-[#6c35c3]/20 px-4 py-2 text-sm font-semibold text-[#2a0c4f] transition hover:bg-[#f3e7ff]"
                  >
                    Reset
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setExpanded((prev) => ({
                        ...prev,
                        [badge.id]: !prev[badge.id],
                      }))
                    }
                    className="rounded-full border border-[#6c35c3]/20 px-4 py-2 text-sm font-semibold text-[#2a0c4f] transition hover:bg-[#f3e7ff]"
                    aria-expanded={isOpen}
                  >
                    {isOpen ? "Hide skills" : "Show skills"}
                  </button>
                </div>
              </header>

              <div className="mt-4">
                <div className="h-3 overflow-hidden rounded-full bg-[#f0e6ff]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#de59b6] via-[#8f4bd6] to-[#6c35c3] transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>

              {isOpen ? (
                <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {badge.skills.map((skill, index) => (
                    <label
                      key={skill}
                      className="flex items-center gap-3 rounded-2xl border border-[#6c35c3]/15 bg-white px-4 py-3 text-sm font-semibold text-[#2a0c4f]"
                    >
                      <input
                        type="checkbox"
                        checked={progress[badge.id]?.[index] || false}
                        onChange={() => toggleSkill(badge.id, index)}
                        className="h-5 w-5 accent-[#6c35c3]"
                      />
                      <span>{skill}</span>
                    </label>
                  ))}
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}
