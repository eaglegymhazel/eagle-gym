"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

type StudentProfileTabsProps = {
  children: ReactNode;
  isCompetitionStudent: boolean;
};

type TabKey = "profile" | "badges";
type BadgeTrack = "recreational" | "competition";
type BadgeDefinition = {
  id: string;
  code: string;
  title: string;
  skills: string[];
  track: BadgeTrack;
};

const levelOneSkills = [
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
];

function placeholderSkills(prefix: string): string[] {
  return Array.from({ length: 10 }, (_, index) => `${prefix} skill ${index + 1}`);
}

const recreationalBadges: BadgeDefinition[] = [
  {
    id: "rec-1",
    code: "R01",
    title: "Level 1",
    skills: levelOneSkills,
    track: "recreational",
  },
  ...Array.from({ length: 9 }, (_, index) => {
    const badgeNumber = index + 2;
    const levelTitle = `Level ${badgeNumber}`;
    return {
      id: `rec-${badgeNumber}`,
      code: `R${String(badgeNumber).padStart(2, "0")}`,
      title: levelTitle,
      skills: placeholderSkills(levelTitle),
      track: "recreational" as const,
    };
  }),
];

const competitionBadges: BadgeDefinition[] = Array.from({ length: 10 }, (_, index) => {
  const badgeNumber = index + 1;
  const badgeTitle = `Competition Badge ${badgeNumber}`;
  return {
    id: `comp-${badgeNumber}`,
    code: `C${String(badgeNumber).padStart(2, "0")}`,
    title: badgeTitle,
    skills: placeholderSkills(badgeTitle),
    track: "competition" as const,
  };
});

const allBadgeDefinitions = [...recreationalBadges, ...competitionBadges];

function createEmptyProgressMap(definitions: BadgeDefinition[]): Record<string, boolean[]> {
  return Object.fromEntries(
    definitions.map((badge) => [badge.id, Array.from({ length: badge.skills.length }, () => false)])
  );
}

function badgeStatus(done: number, total: number): "Not started" | "In progress" | "Complete" {
  if (done <= 0) return "Not started";
  if (done >= total) return "Complete";
  return "In progress";
}

function statusClass(status: "Not started" | "In progress" | "Complete"): string {
  if (status === "Complete") return "border-[#bdddc9] bg-[#ebf7f0] text-[#1d6a3e]";
  if (status === "In progress") return "border-[#d9cfee] bg-[#f7f2ff] text-[#5a279f]";
  return "border-[#e5dfef] bg-[#fcfbfe] text-[#7f7591]";
}

export default function StudentProfileTabs({
  children,
  isCompetitionStudent,
}: StudentProfileTabsProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("profile");
  const [activeBadgeTrack, setActiveBadgeTrack] = useState<BadgeTrack>(
    isCompetitionStudent ? "competition" : "recreational"
  );
  const [expandedByBadgeId, setExpandedByBadgeId] = useState<Record<string, boolean>>({});
  const [progressByBadgeId, setProgressByBadgeId] = useState<Record<string, boolean[]>>(() =>
    createEmptyProgressMap(allBadgeDefinitions)
  );

  useEffect(() => {
    if (!isCompetitionStudent && activeBadgeTrack === "competition") {
      setActiveBadgeTrack("recreational");
    }
  }, [activeBadgeTrack, isCompetitionStudent]);

  const availableTracks = useMemo<BadgeTrack[]>(
    () => (isCompetitionStudent ? ["competition", "recreational"] : ["recreational"]),
    [isCompetitionStudent]
  );

  const badgesForActiveTrack = useMemo(
    () => (activeBadgeTrack === "competition" ? competitionBadges : recreationalBadges),
    [activeBadgeTrack]
  );

  const completedCountForTrack = (definitions: BadgeDefinition[]) =>
    definitions.reduce((count, badge) => {
      const done = (progressByBadgeId[badge.id] ?? []).filter(Boolean).length;
      return done === badge.skills.length ? count + 1 : count;
    }, 0);

  const toggleSkill = (badgeId: string, index: number) => {
    setProgressByBadgeId((prev) => {
      const current = [...(prev[badgeId] ?? [])];
      current[index] = !current[index];
      return { ...prev, [badgeId]: current };
    });
  };

  const markAll = (badgeId: string, value: boolean) => {
    const badge = allBadgeDefinitions.find((item) => item.id === badgeId);
    if (!badge) return;
    setProgressByBadgeId((prev) => ({
      ...prev,
      [badgeId]: Array.from({ length: badge.skills.length }, () => value),
    }));
  };

  const toggleExpanded = (badgeId: string) => {
    setExpandedByBadgeId((prev) => ({ ...prev, [badgeId]: !prev[badgeId] }));
  };

  const collapseAll = () => {
    setExpandedByBadgeId({});
  };

  const recreationalCompleted = completedCountForTrack(recreationalBadges);
  const competitionCompleted = completedCountForTrack(competitionBadges);
  const hasExpandedBadges = badgesForActiveTrack.some((badge) => expandedByBadgeId[badge.id]);

  return (
    <div>
      <div className="mb-3 inline-flex border border-[#d8ceeb] bg-white">
        <button
          type="button"
          onClick={() => setActiveTab("profile")}
          className={[
            "cursor-pointer px-6 py-2 text-base font-semibold transition",
            activeTab === "profile"
              ? "bg-[#ede2ff] text-[#3f1d74] shadow-[inset_0_-2px_0_0_#6e2ac0]"
              : "bg-white text-[#5d4f75] hover:bg-[#faf7ff]",
          ].join(" ")}
          aria-pressed={activeTab === "profile"}
        >
          Profile
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("badges")}
          className={[
            "cursor-pointer border-l border-[#d8ceeb] px-6 py-2 text-base font-semibold transition",
            activeTab === "badges"
              ? "bg-[#ede2ff] text-[#3f1d74] shadow-[inset_0_-2px_0_0_#6e2ac0]"
              : "bg-white text-[#5d4f75] hover:bg-[#faf7ff]",
          ].join(" ")}
          aria-pressed={activeTab === "badges"}
        >
          Badges
        </button>
      </div>

      {activeTab === "profile" ? (
        children
      ) : (
        <section className="border border-[#ddd3ea] bg-white">
          <div>
            <header className="border-b border-[#e8e0f2] px-5 py-5 md:px-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#726587]">
                    Coach badge tracker
                  </p>
                  <p className="mt-1 text-sm font-medium text-[#5f5177]">
                    Recreational: {recreationalCompleted}/10 complete
                    {isCompetitionStudent ? ` | Competition: ${competitionCompleted}/10 complete` : ""}
                  </p>
                </div>
                <Link
                  href="/admin?tab=students"
                  className="inline-flex w-full cursor-pointer items-center justify-center gap-1.5 border border-[#c7b4e5] bg-[#f7f2ff] px-3.5 py-2 text-sm font-semibold text-[#4f2390] shadow-[0_1px_0_rgba(255,255,255,0.8)_inset] transition hover:border-[#b398dd] hover:bg-[#f1e8ff] active:bg-[#ebddff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6e2ac0]/35 md:w-auto"
                >
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                  Back to Student Management
                </Link>
              </div>

              <div className="mt-3 flex items-center gap-2">
                  <div
                    className={[
                      "grid h-8 w-[340px] max-w-full overflow-hidden border border-[#ddd4ea] bg-white",
                      availableTracks.length === 2 ? "grid-cols-2" : "grid-cols-1",
                    ].join(" ")}
                  >
                    {availableTracks.map((track, index) => {
                      const isActive = activeBadgeTrack === track;
                      const label = track === "competition" ? "Competition (10)" : "Recreational (10)";
                      return (
                        <button
                          key={track}
                          type="button"
                          onClick={() => setActiveBadgeTrack(track)}
                          disabled={availableTracks.length === 1}
                          className={[
                            "relative h-8 w-full overflow-hidden px-3 text-xs font-semibold uppercase tracking-[0.05em] transition-colors duration-200",
                            availableTracks.length === 2 && index === 0 ? "border-r border-[#ddd4ea]" : "",
                            isActive
                              ? track === "competition"
                                ? "text-[#a26b00]"
                                : "text-[#0a6e3b]"
                              : "bg-white text-[#6f6384] hover:bg-[#faf7ff]",
                            availableTracks.length === 1 ? "cursor-default" : "cursor-pointer",
                          ].join(" ")}
                        >
                          <span
                            aria-hidden
                            className={[
                              "absolute inset-0 transition-transform duration-200 ease-out",
                              track === "competition"
                                ? "origin-right bg-[#c89200]/28"
                                : "origin-left bg-[#0f8d4e]/24",
                              isActive ? "scale-x-100" : "scale-x-0",
                            ].join(" ")}
                          />
                          <span className="relative z-10">{label}</span>
                        </button>
                      );
                    })}
                  </div>
                  <button
                    type="button"
                    onClick={collapseAll}
                    disabled={!hasExpandedBadges}
                    className={[
                      "h-8 border px-2.5 text-xs font-semibold transition",
                      hasExpandedBadges
                        ? "cursor-pointer border-[#ddd4ea] bg-white text-[#6f6384] hover:bg-[#faf7ff]"
                        : "cursor-not-allowed border-[#e9e4f0] bg-[#f8f6fb] text-[#a095b0]",
                    ].join(" ")}
                  >
                    Collapse all
                  </button>
              </div>
            </header>

            <div className="space-y-2 px-5 py-5 md:px-6 lg:max-w-[1120px]">
              {badgesForActiveTrack.map((badge) => {
                const progress = progressByBadgeId[badge.id] ?? [];
                const done = progress.filter(Boolean).length;
                const total = badge.skills.length;
                const percentage = Math.round((done / total) * 100);
                const progressWidth = done > 0 ? Math.max(percentage, 3) : 0;
                const status = badgeStatus(done, total);
                const isExpanded = expandedByBadgeId[badge.id] === true;
                const badgeCompleted = done === total;
                const progressBarColor = badge.track === "competition" ? "#e0b21a" : "#6c35c3";

                return (
                  <article key={badge.id} className="overflow-hidden border border-[#e7e0f1] bg-white">
                    <button
                      type="button"
                      onClick={() => toggleExpanded(badge.id)}
                      className={[
                        "w-full cursor-pointer px-4 py-3 text-left",
                        badgeCompleted
                          ? "bg-[#f7fcf9] hover:bg-[#f3faf6]"
                          : "bg-white hover:bg-[#fcfafe]",
                      ].join(" ")}
                      aria-expanded={isExpanded}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex h-6 items-center border border-[#d7cbe8] bg-[#f7f2ff] px-2 text-[11px] font-semibold text-[#4f2390]">
                              {badge.code}
                            </span>
                            <h3 className="truncate text-base font-semibold text-[#24193a]">{badge.title}</h3>
                            <span
                              className={[
                                "inline-flex h-6 items-center border px-2 text-[11px] font-semibold",
                                statusClass(status),
                              ].join(" ")}
                            >
                              {status}
                            </span>
                          </div>
                          <p className="mt-1 text-sm font-medium text-[#574b69]">
                            {done}/{total} skills complete | {percentage}%
                          </p>
                        </div>
                        <div className="flex items-center">
                          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[#ddd4ea] bg-white text-[#7c6f91] transition hover:bg-[#faf7ff] hover:ring-2 hover:ring-[#6e2ac0]/20">
                            <svg
                              viewBox="0 0 20 20"
                              className={[
                                "h-3.5 w-3.5 transition-transform duration-200",
                                isExpanded ? "rotate-180" : "rotate-0",
                              ].join(" ")}
                              aria-hidden="true"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M5 7l5 5 5-5" />
                            </svg>
                          </span>
                        </div>
                      </div>
                      <div className="mt-2 h-2.5 overflow-hidden bg-[#f4eff9]">
                        <div
                          className="h-full transition-all duration-200"
                          style={{ width: `${progressWidth}%`, backgroundColor: progressBarColor }}
                        />
                      </div>
                    </button>

                    {isExpanded ? (
                      <div className="border-t border-[#ece4f5] px-4 py-3">
                        <div className="mb-3 flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => markAll(badge.id, true)}
                            className="h-8 cursor-pointer border border-[#0f8d4e] bg-[#0f8d4e] px-2.5 text-xs font-semibold text-white hover:bg-[#0d7c45]"
                          >
                            Mark all complete
                          </button>
                          <button
                            type="button"
                            onClick={() => markAll(badge.id, false)}
                            className="h-8 cursor-pointer border border-[#ddd4ea] bg-white px-2.5 text-xs font-semibold text-[#6f6384] hover:bg-[#faf7ff]"
                          >
                            Reset
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleExpanded(badge.id)}
                            className="h-8 cursor-pointer border border-[#ddd4ea] bg-white px-2.5 text-xs font-semibold text-[#6f6384] hover:bg-[#faf7ff]"
                          >
                            Collapse
                          </button>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                          {badge.skills.map((skill, index) => {
                            const isChecked = progress[index] || false;
                            return (
                              <label
                                key={`${badge.id}-skill-${index}`}
                                className={[
                                  "relative flex cursor-pointer items-start gap-2 overflow-hidden border px-3 py-2.5 text-sm text-[#2a203c] transition",
                                  isChecked
                                    ? "border-[#cfe8db] bg-[#fefcff]"
                                    : "border-[#ece4f5] bg-[#fefcff] hover:border-[#e1d7ef] hover:bg-[#fbf8ff]",
                                ].join(" ")}
                              >
                                <span
                                  aria-hidden
                                  className={[
                                    "absolute inset-0 origin-left bg-[#eef8f2] transition-transform duration-300 ease-out",
                                    isChecked ? "scale-x-100" : "scale-x-0",
                                  ].join(" ")}
                                />
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => toggleSkill(badge.id, index)}
                                  className="relative z-10 mt-0.5 h-4 w-4 accent-[#6c35c3]"
                                />
                                <span className="relative z-10">{skill}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
