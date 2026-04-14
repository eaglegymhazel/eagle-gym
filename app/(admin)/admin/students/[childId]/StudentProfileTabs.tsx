"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import * as Dialog from "@radix-ui/react-dialog";
import { ArrowLeft } from "lucide-react";

type StudentProfileTabsProps = {
  children: ReactNode;
  childId: string;
  studentName: string;
  dateOfBirthLabel: string;
  ageLabel: string;
  initialAssignedBadges: AdminAssignedBadge[];
  initialAvailableBadges: AdminBadgeDefinitionOption[];
};

type TabKey = "profile" | "badges";

type AdminBadgeSkill = {
  id: string;
  name: string;
  description: string | null;
  sortOrder: number;
  completedAt: string | null;
};

type AdminAssignedBadge = {
  assignmentId: string;
  badgeId: string;
  name: string;
  description: string | null;
  category: string | null;
  isCompleted: boolean;
  completedAt: string | null;
  dateAwarded: string | null;
  datePaid: string | null;
  skills: AdminBadgeSkill[];
};

type AdminBadgeDefinitionOption = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
};

type BadgeApiResponse = {
  assignedBadges?: AdminAssignedBadge[];
  availableBadges?: AdminBadgeDefinitionOption[];
  error?: string;
};

function badgeStatus(done: number, total: number, isCompleted: boolean): "Not started" | "In progress" | "Complete" {
  if (isCompleted || (total > 0 && done >= total)) return "Complete";
  if (done <= 0) return "Not started";
  return "In progress";
}

function statusClass(status: "Not started" | "In progress" | "Complete"): string {
  if (status === "Complete") return "border-[#bdddc9] bg-[#ebf7f0] text-[#1d6a3e]";
  if (status === "In progress") return "border-[#d9cfee] bg-[#f7f2ff] text-[#5a279f]";
  return "border-[#e5dfef] bg-[#fcfbfe] text-[#7f7591]";
}

function formatDate(value: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateInputValue(value: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function categoryLabel(category: string | null): string {
  return category?.trim() || "Uncategorised";
}

export default function StudentProfileTabs({
  children,
  childId,
  studentName,
  dateOfBirthLabel,
  ageLabel,
  initialAssignedBadges,
  initialAvailableBadges,
}: StudentProfileTabsProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("profile");
  const [assignedBadges, setAssignedBadges] = useState(initialAssignedBadges);
  const [availableBadges, setAvailableBadges] = useState(initialAvailableBadges);
  const [selectedBadgeId, setSelectedBadgeId] = useState(initialAvailableBadges[0]?.id ?? "");
  const [expandedByAssignmentId, setExpandedByAssignmentId] = useState<Record<string, boolean>>({});
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [savingSkillKey, setSavingSkillKey] = useState<string | null>(null);
  const [savingAssignmentId, setSavingAssignmentId] = useState<string | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<AdminAssignedBadge | null>(null);
  const [deletingAssignmentId, setDeletingAssignmentId] = useState<string | null>(null);
  const [assignError, setAssignError] = useState<string | null>(null);
  const [skillError, setSkillError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const completeCount = useMemo(
    () => assignedBadges.filter((badge) => badge.isCompleted).length,
    [assignedBadges]
  );
  const hasExpandedBadges = assignedBadges.some((badge) => expandedByAssignmentId[badge.assignmentId]);

  const selectedBadgeStillAvailable = availableBadges.some((badge) => badge.id === selectedBadgeId);
  const selectedValue = selectedBadgeStillAvailable ? selectedBadgeId : availableBadges[0]?.id ?? "";
  const selectedBadge = availableBadges.find((badge) => badge.id === selectedValue) ?? null;
  const isSavingSkill = savingSkillKey !== null;
  const isSavingAssignment = savingAssignmentId !== null;
  const isDeletingBadge = deletingAssignmentId !== null;
  const isMutating = isSavingSkill || isSavingAssignment || isDeletingBadge;

  const toggleExpanded = (assignmentId: string) => {
    setExpandedByAssignmentId((prev) => ({ ...prev, [assignmentId]: !prev[assignmentId] }));
  };

  const collapseAll = () => {
    setExpandedByAssignmentId({});
  };

  const assignBadge = async () => {
    const badgeId = selectedValue;
    if (!badgeId || isAssigning || isMutating) return;

    setIsAssigning(true);
    setAssignError(null);

    try {
      const response = await fetch("/api/admin/child-badges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ childId, badgeId }),
      });
      const payload = (await response.json()) as BadgeApiResponse;

      if (!response.ok) {
        throw new Error(payload.error ?? "The badge could not be assigned.");
      }

      const nextAssigned = payload.assignedBadges ?? [];
      const nextAvailable = payload.availableBadges ?? [];
      setAssignedBadges(nextAssigned);
      setAvailableBadges(nextAvailable);
      setSelectedBadgeId(nextAvailable[0]?.id ?? "");
      setIsAssignDialogOpen(false);
      setExpandedByAssignmentId((prev) => {
        const next = { ...prev };
        nextAssigned.forEach((badge) => {
          if (badge.badgeId === badgeId) next[badge.assignmentId] = true;
        });
        return next;
      });
    } catch (error) {
      setAssignError(error instanceof Error ? error.message : "The badge could not be assigned.");
    } finally {
      setIsAssigning(false);
    }
  };

  const setSkillCompleted = async (
    assignmentId: string,
    badgeSkillId: string,
    completed: boolean
  ) => {
    const mutationKey = `${assignmentId}:${badgeSkillId}`;
    if (savingSkillKey || isDeletingBadge) return;

    setSavingSkillKey(mutationKey);
    setSkillError(null);

    try {
      const response = await fetch("/api/admin/child-badges", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignmentId, badgeSkillId, completed }),
      });
      const payload = (await response.json()) as BadgeApiResponse;

      if (!response.ok) {
        throw new Error(payload.error ?? "The skill progress could not be saved.");
      }

      setAssignedBadges(payload.assignedBadges ?? []);
      setAvailableBadges(payload.availableBadges ?? []);
    } catch (error) {
      setSkillError(error instanceof Error ? error.message : "The skill progress could not be saved.");
    } finally {
      setSavingSkillKey(null);
    }
  };

  const updateAssignmentTracking = async (
    assignmentId: string,
    updates: { dateAwarded?: string | null; datePaid?: string | null }
  ) => {
    if (savingSkillKey || savingAssignmentId || isDeletingBadge) return;

    setSavingAssignmentId(assignmentId);
    setSkillError(null);

    try {
      const response = await fetch("/api/admin/child-badges", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignmentId, ...updates }),
      });
      const payload = (await response.json()) as BadgeApiResponse;

      if (!response.ok) {
        throw new Error(payload.error ?? "Badge tracking fields could not be saved.");
      }

      setAssignedBadges(payload.assignedBadges ?? []);
      setAvailableBadges(payload.availableBadges ?? []);
    } catch (error) {
      setSkillError(
        error instanceof Error ? error.message : "Badge tracking fields could not be saved."
      );
    } finally {
      setSavingAssignmentId(null);
    }
  };

  const deleteAssignedBadge = async () => {
    if (!deleteCandidate || isMutating || isAssigning) return;

    setDeletingAssignmentId(deleteCandidate.assignmentId);
    setDeleteError(null);

    try {
      const response = await fetch("/api/admin/child-badges", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignmentId: deleteCandidate.assignmentId }),
      });
      const payload = (await response.json()) as BadgeApiResponse;

      if (!response.ok) {
        throw new Error(payload.error ?? "The badge assignment could not be deleted.");
      }

      setAssignedBadges(payload.assignedBadges ?? []);
      setAvailableBadges(payload.availableBadges ?? []);
      setSelectedBadgeId((payload.availableBadges ?? [])[0]?.id ?? "");
      setExpandedByAssignmentId((prev) => {
        const next = { ...prev };
        delete next[deleteCandidate.assignmentId];
        return next;
      });
      setDeleteCandidate(null);
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : "The badge assignment could not be deleted.");
    } finally {
      setDeletingAssignmentId(null);
    }
  };

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
          <header className="border-b border-[#e8e0f2] px-5 py-5 md:px-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#6f6287]">
                  Student profile
                </p>
                <h1 className="mt-2 text-2xl font-bold text-[#221833]">{studentName}</h1>
                <p className="mt-1 text-sm text-[#5f5177]">
                  {dateOfBirthLabel} | {ageLabel}
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
          </header>
          <header className="border-b border-[#e8e0f2] px-5 py-5 md:px-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#726587]">
                  Coach badge tracker
                </p>
                <p className="mt-1 text-sm font-medium text-[#5f5177]">
                  {assignedBadges.length} assigned | {completeCount} complete
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
              <Dialog.Root
                open={isAssignDialogOpen}
                onOpenChange={(open) => {
                  setIsAssignDialogOpen(open);
                  if (open) {
                    setAssignError(null);
                    setSelectedBadgeId(availableBadges[0]?.id ?? "");
                  }
                }}
              >
                <Dialog.Trigger asChild>
                  <button
                    type="button"
                    disabled={availableBadges.length === 0 || isAssigning || isMutating}
                    className={[
                      "h-10 border px-4 text-sm font-semibold transition sm:w-auto",
                      availableBadges.length > 0 && !isAssigning && !isMutating
                        ? "cursor-pointer border-[#0f8d4e] bg-[#0f8d4e] text-white hover:bg-[#0d7c45]"
                        : "cursor-not-allowed border-[#e9e4f0] bg-[#f8f6fb] text-[#a095b0]",
                    ].join(" ")}
                  >
                    Assign badge
                  </button>
                </Dialog.Trigger>
                <Dialog.Portal>
                  <Dialog.Overlay className="fixed inset-0 z-[100] bg-black/45" />
                  <Dialog.Content className="fixed inset-x-3 top-1/2 z-[101] max-h-[86vh] -translate-y-1/2 overflow-hidden border border-[#d8ceeb] bg-white shadow-2xl sm:left-1/2 sm:right-auto sm:w-[min(680px,calc(100vw-32px))] sm:-translate-x-1/2">
                    <div className="border-b border-[#e8e0f2] px-4 py-4 sm:px-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <Dialog.Title className="text-lg font-bold text-[#24193a]">
                            Assign badge
                          </Dialog.Title>
                          <Dialog.Description className="mt-1 text-sm text-[#5f5177]">
                            Choose a badge to assign to this student.
                          </Dialog.Description>
                        </div>
                        <Dialog.Close asChild>
                          <button
                            type="button"
                            className="inline-flex h-9 w-9 shrink-0 items-center justify-center border border-[#ddd4ea] text-[#6f6384] hover:bg-[#faf7ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6e2ac0]/35"
                            aria-label="Close assign badge dialog"
                          >
                            <svg
                              viewBox="0 0 24 24"
                              className="h-4 w-4"
                              aria-hidden="true"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                            >
                              <path d="M6 6l12 12" />
                              <path d="M18 6l-12 12" />
                            </svg>
                          </button>
                        </Dialog.Close>
                      </div>
                    </div>

                    <div className="max-h-[52vh] overflow-y-auto px-4 py-4 sm:px-5">
                      {availableBadges.length === 0 ? (
                        <div className="border border-dashed border-[#d8ceeb] bg-[#fcfafe] px-4 py-5">
                          <p className="text-sm font-semibold text-[#24193a]">No badges available</p>
                          <p className="mt-1 text-sm text-[#5f5177]">
                            Every active badge has already been assigned to this student.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2" role="radiogroup" aria-label="Available badges">
                          {availableBadges.map((badge) => {
                            const isSelected = selectedValue === badge.id;
                            return (
                              <button
                                key={badge.id}
                                type="button"
                                onClick={() => setSelectedBadgeId(badge.id)}
                                className={[
                                  "w-full border px-3 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6e2ac0]/35",
                                  isSelected
                                    ? "border-[#6e2ac0] bg-[#f7f2ff]"
                                    : "border-[#ece4f5] bg-white hover:bg-[#fcfafe]",
                                ].join(" ")}
                                role="radio"
                                aria-checked={isSelected}
                              >
                                <span className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
                                  <span className="inline-flex w-fit items-center border border-[#d7cbe8] bg-white px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.04em] text-[#4f2390]">
                                    {categoryLabel(badge.category)}
                                  </span>
                                  <span className="text-sm font-semibold text-[#24193a]">{badge.name}</span>
                                </span>
                                {badge.description ? (
                                  <span className="mt-1 block text-sm text-[#6c607d]">
                                    {badge.description}
                                  </span>
                                ) : null}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div className="border-t border-[#e8e0f2] px-4 py-4 sm:px-5">
                      {assignError ? (
                        <p className="mb-3 text-sm font-medium text-[#a72020]">{assignError}</p>
                      ) : null}
                      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                        <Dialog.Close asChild>
                          <button
                            type="button"
                            className="h-10 border border-[#ddd4ea] bg-white px-4 text-sm font-semibold text-[#6f6384] hover:bg-[#faf7ff]"
                          >
                            Cancel
                          </button>
                        </Dialog.Close>
                        <button
                          type="button"
                          onClick={assignBadge}
                          disabled={!selectedBadge || isAssigning}
                          className={[
                            "h-10 border px-4 text-sm font-semibold transition",
                            selectedBadge && !isAssigning
                              ? "cursor-pointer border-[#0f8d4e] bg-[#0f8d4e] text-white hover:bg-[#0d7c45]"
                              : "cursor-not-allowed border-[#e9e4f0] bg-[#f8f6fb] text-[#a095b0]",
                          ].join(" ")}
                        >
                          {isAssigning ? "Adding..." : "Add badge"}
                        </button>
                      </div>
                    </div>
                  </Dialog.Content>
                </Dialog.Portal>
              </Dialog.Root>
              <button
                type="button"
                onClick={collapseAll}
                disabled={!hasExpandedBadges || isMutating}
                className={[
                  "h-10 border px-3 text-sm font-semibold transition",
                  hasExpandedBadges && !isMutating
                    ? "cursor-pointer border-[#ddd4ea] bg-white text-[#6f6384] hover:bg-[#faf7ff]"
                    : "cursor-not-allowed border-[#e9e4f0] bg-[#f8f6fb] text-[#a095b0]",
                ].join(" ")}
              >
                Collapse all
              </button>
              {availableBadges.length === 0 ? (
                <p className="text-sm text-[#6f6384] sm:ml-1">
                  No active badges left to assign.
                </p>
              ) : null}
            </div>
            {skillError ? <p className="mt-2 text-sm font-medium text-[#a72020]">{skillError}</p> : null}
            {deleteError ? <p className="mt-2 text-sm font-medium text-[#a72020]">{deleteError}</p> : null}
          </header>

          <div
            className={[
              "space-y-2 px-5 py-5 md:px-6 lg:max-w-[1120px]",
              isMutating ? "cursor-wait" : "",
            ].join(" ")}
            aria-busy={isMutating}
          >
            {assignedBadges.length === 0 ? (
              <div className="border border-dashed border-[#d8ceeb] bg-[#fcfafe] px-4 py-6">
                <h2 className="text-base font-semibold text-[#24193a]">No badges assigned</h2>
                <p className="mt-1 text-sm text-[#5f5177]">
                  Assign a badge to start tracking progress for this student.
                </p>
              </div>
            ) : (
              assignedBadges.map((badge) => {
                const total = badge.skills.length;
                const done = badge.skills.filter((skill) => skill.completedAt).length;
                const percentage = total > 0 ? Math.round((done / total) * 100) : 0;
                const progressWidth = done > 0 ? Math.max(percentage, 3) : 0;
                const status = badgeStatus(done, total, badge.isCompleted);
                const isExpanded = expandedByAssignmentId[badge.assignmentId] === true;
                const isThisBadgeDeleting = deletingAssignmentId === badge.assignmentId;
                const isThisAssignmentSaving = savingAssignmentId === badge.assignmentId;
                const dateAwardedValue = formatDateInputValue(badge.dateAwarded);
                const datePaidValue = formatDateInputValue(badge.datePaid);
                const isTrackingLocked = !badge.isCompleted;

                return (
                  <article
                    key={badge.assignmentId}
                    className={[
                      "overflow-hidden border border-[#e7e0f1] bg-white",
                      isThisBadgeDeleting ? "opacity-70" : "",
                    ].join(" ")}
                  >
                    <button
                      type="button"
                      onClick={() => toggleExpanded(badge.assignmentId)}
                      disabled={isMutating}
                      className={[
                        "w-full px-4 py-3 text-left",
                        isMutating ? "cursor-wait" : "cursor-pointer",
                        status === "Complete"
                          ? "bg-[#f7fcf9] hover:bg-[#f3faf6]"
                          : "bg-white hover:bg-[#fcfafe]",
                      ].join(" ")}
                      aria-expanded={isExpanded}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex h-6 items-center border border-[#d7cbe8] bg-[#f7f2ff] px-2 text-[11px] font-semibold text-[#4f2390]">
                              {categoryLabel(badge.category)}
                            </span>
                            <h3 className="truncate text-base font-semibold text-[#24193a]">{badge.name}</h3>
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
                            {badge.completedAt ? ` | Completed ${formatDate(badge.completedAt)}` : ""}
                          </p>
                          {badge.description ? (
                            <p className="mt-1 text-sm text-[#6c607d]">{badge.description}</p>
                          ) : null}
                        </div>
                        <div className="flex items-center gap-2">
                          {isThisBadgeDeleting ? (
                            <span className="inline-flex h-5 w-5 animate-spin rounded-full border-2 border-[#d6c9e7] border-t-[#6c35c3]" />
                          ) : null}
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
                          className="h-full bg-[#6c35c3] transition-all duration-200"
                          style={{ width: `${progressWidth}%` }}
                        />
                      </div>
                    </button>

                    {isExpanded ? (
                      <div className="border-t border-[#ece4f5] px-4 py-3">
                        <section className="mb-4 border border-[#e3d8f0] bg-[#faf7ff] px-3 py-3">
                          <div className="mb-2 flex items-center justify-between gap-2">
                            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#5f4b83]">
                              Award & payment tracking
                            </p>
                            {isThisAssignmentSaving ? (
                              <span className="inline-flex h-4 w-4 animate-spin rounded-full border-2 border-[#d6c9e7] border-t-[#6c35c3]" />
                            ) : null}
                          </div>
                          <p className="mb-3 text-xs text-[#6f6384]">
                            {isTrackingLocked
                              ? "Complete all badge skills to enable these date fields."
                              : "Track when the badge was awarded and when payment was received."}
                          </p>
                          <div className="grid gap-3 sm:grid-cols-2">
                            <label className="flex flex-col gap-1 text-sm text-[#2a203c]">
                              <span className="font-medium text-[#574b69]">Date awarded</span>
                              <div className="flex items-center gap-2">
                                <input
                                  type="date"
                                  value={dateAwardedValue}
                                  disabled={isMutating || isTrackingLocked}
                                  onChange={(event) =>
                                    updateAssignmentTracking(badge.assignmentId, {
                                      dateAwarded: event.target.value || null,
                                    })
                                  }
                                  className="h-9 min-w-0 flex-1 border border-[#d8ceeb] bg-white px-2 text-sm text-[#2a203c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6e2ac0]/35 disabled:cursor-not-allowed disabled:bg-[#f3eefb]"
                                />
                                <button
                                  type="button"
                                  disabled={isMutating || isTrackingLocked || !dateAwardedValue}
                                  onClick={() =>
                                    updateAssignmentTracking(badge.assignmentId, {
                                      dateAwarded: null,
                                    })
                                  }
                                  className={[
                                    "h-9 border px-2.5 text-xs font-semibold transition",
                                    !isMutating && !isTrackingLocked && dateAwardedValue
                                      ? "cursor-pointer border-[#ddd4ea] bg-white text-[#6f6384] hover:bg-[#faf7ff]"
                                      : "cursor-not-allowed border-[#e9e4f0] bg-[#f8f6fb] text-[#a095b0]",
                                  ].join(" ")}
                                >
                                  Clear
                                </button>
                              </div>
                            </label>
                            <label className="flex flex-col gap-1 text-sm text-[#2a203c]">
                              <span className="font-medium text-[#574b69]">Date paid</span>
                              <div className="flex items-center gap-2">
                                <input
                                  type="date"
                                  value={datePaidValue}
                                  disabled={isMutating || isTrackingLocked}
                                  onChange={(event) =>
                                    updateAssignmentTracking(badge.assignmentId, {
                                      datePaid: event.target.value || null,
                                    })
                                  }
                                  className="h-9 min-w-0 flex-1 border border-[#d8ceeb] bg-white px-2 text-sm text-[#2a203c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6e2ac0]/35 disabled:cursor-not-allowed disabled:bg-[#f3eefb]"
                                />
                                <button
                                  type="button"
                                  disabled={isMutating || isTrackingLocked || !datePaidValue}
                                  onClick={() =>
                                    updateAssignmentTracking(badge.assignmentId, {
                                      datePaid: null,
                                    })
                                  }
                                  className={[
                                    "h-9 border px-2.5 text-xs font-semibold transition",
                                    !isMutating && !isTrackingLocked && datePaidValue
                                      ? "cursor-pointer border-[#ddd4ea] bg-white text-[#6f6384] hover:bg-[#faf7ff]"
                                      : "cursor-not-allowed border-[#e9e4f0] bg-[#f8f6fb] text-[#a095b0]",
                                  ].join(" ")}
                                >
                                  Clear
                                </button>
                              </div>
                            </label>
                          </div>
                        </section>

                        <section className="border border-[#ece4f5] bg-[#fefcff] px-3 py-3">
                          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.08em] text-[#5f4b83]">
                            Skills checklist
                          </p>
                          {badge.skills.length === 0 ? (
                            <p className="text-sm text-[#5f5177]">No skills have been defined for this badge.</p>
                          ) : (
                            <div className="grid gap-3 sm:grid-cols-2">
                              {badge.skills.map((skill) => {
                                const isChecked = Boolean(skill.completedAt);
                                const mutationKey = `${badge.assignmentId}:${skill.id}`;
                                const isThisSkillSaving = savingSkillKey === mutationKey;
                                return (
                                  <label
                                    key={skill.id}
                                    className={[
                                      "relative flex items-start gap-2 overflow-hidden border px-3 py-2.5 text-sm text-[#2a203c]",
                                      isMutating ? "cursor-wait" : "cursor-pointer",
                                      isChecked ? "border-[#cfe8db] bg-[#eef8f2]" : "border-[#ece4f5] bg-[#fefcff]",
                                    ].join(" ")}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      disabled={isMutating}
                                      onChange={(event) =>
                                        setSkillCompleted(
                                          badge.assignmentId,
                                          skill.id,
                                          event.target.checked
                                        )
                                      }
                                      className="relative z-10 mt-0.5 h-4 w-4 accent-[#6c35c3]"
                                    />
                                    <span className="relative z-10">
                                      <span className="flex items-center gap-2">
                                        <span>{skill.name}</span>
                                        {isThisSkillSaving ? (
                                          <span className="inline-flex h-4 w-4 animate-spin rounded-full border-2 border-[#d6c9e7] border-t-[#6c35c3]" />
                                        ) : null}
                                      </span>
                                      {skill.description ? (
                                        <span className="mt-0.5 block text-xs text-[#6c607d]">
                                          {skill.description}
                                        </span>
                                      ) : null}
                                    </span>
                                  </label>
                                );
                              })}
                            </div>
                          )}
                        </section>
                        <div className="mt-4 flex justify-end border-t border-[#f0eaf6] pt-3">
                          <button
                            type="button"
                            onClick={() => {
                              setDeleteError(null);
                              setDeleteCandidate(badge);
                            }}
                            disabled={isMutating || isAssigning}
                            className={[
                              "h-8 border px-2.5 text-xs font-semibold transition",
                              !isMutating && !isAssigning
                                ? "cursor-pointer border-[#d93636] bg-[#d93636] text-white hover:bg-[#bd2d2d]"
                                : "cursor-not-allowed border-[#eadada] bg-[#f8f6fb] text-[#b79a9a]",
                            ].join(" ")}
                          >
                            Delete Badge
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </article>
                );
              })
            )}
          </div>
        </section>
      )}

      <Dialog.Root
        open={deleteCandidate !== null}
        onOpenChange={(open) => {
          if (!open && !isDeletingBadge) {
            setDeleteCandidate(null);
            setDeleteError(null);
          }
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[100] bg-black/45" />
          <Dialog.Content className="fixed inset-x-3 top-1/2 z-[101] max-h-[86vh] -translate-y-1/2 overflow-hidden border border-[#d8ceeb] bg-white shadow-2xl sm:left-1/2 sm:right-auto sm:w-[min(520px,calc(100vw-32px))] sm:-translate-x-1/2">
            <div className="border-b border-[#e8e0f2] px-4 py-4 sm:px-5">
              <div>
                <Dialog.Title className="text-lg font-bold text-[#24193a]">
                  Delete assigned badge
                </Dialog.Title>
                <Dialog.Description className="mt-1 text-sm text-[#5f5177]">
                  This will remove the badge and any completed skill records for this student.
                </Dialog.Description>
              </div>
            </div>

            <div className="px-4 py-4 sm:px-5">
              <p className="text-sm text-[#342744]">
                Delete{" "}
                <span className="font-semibold text-[#24193a]">
                  {deleteCandidate?.name ?? "this badge"}
                </span>
                ?
              </p>
              <p className="mt-2 text-sm text-[#6c607d]">
                Warning, this action is permanent and cannot be undone.
              </p>
              {deleteError ? (
                <p className="mt-3 text-sm font-medium text-[#a72020]">{deleteError}</p>
              ) : null}
            </div>

            <div className="border-t border-[#e8e0f2] px-4 py-4 sm:px-5">
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Dialog.Close asChild>
                  <button
                    type="button"
                    disabled={isDeletingBadge}
                    className="h-10 border border-[#ddd4ea] bg-white px-4 text-sm font-semibold text-[#6f6384] hover:bg-[#faf7ff] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Cancel
                  </button>
                </Dialog.Close>
                <button
                  type="button"
                  onClick={deleteAssignedBadge}
                  disabled={!deleteCandidate || isDeletingBadge}
                  className={[
                    "h-10 border px-4 text-sm font-semibold transition",
                    deleteCandidate && !isDeletingBadge
                      ? "cursor-pointer border-[#d93636] bg-[#d93636] text-white hover:bg-[#bd2d2d]"
                      : "cursor-not-allowed border-[#eadada] bg-[#f8f6fb] text-[#b79a9a]",
                  ].join(" ")}
                >
                  {isDeletingBadge ? "Deleting..." : "Delete badge"}
                </button>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
